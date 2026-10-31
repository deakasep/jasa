/**
 * Implementasi PortCron dengan Prisma. Semua perubahan satu aksi dalam satu transaksi:
 * ubah status bersyarat → jurnal (idempoten) → audit aksi → catat notifikasi (kotak keluar mode uji).
 * Notifikasi dicatat di AuditLog (aksi `notifikasi.<mode>`, objek `notif:<kunci>`) tanpa nomor HP/email.
 */
import { buatAudit } from "../domain/audit.ts";
import type { KonteksAksi, RencanaEksekusi } from "../domain/eksekusiCron.ts";
import type { Pesanan } from "../domain/escrow.ts";
import type { Notifikasi } from "../domain/notifikasi.ts";
import type { PortCron } from "./cron.ts";
import { prisma } from "./db.ts";
import { keJson, simpanJurnal, type Tx } from "./ledgerRepo.ts";

const AKTOR = "sistem:cron";

/** Baris Order → Pesanan domain (dipakai juga oleh /api/cron). */
export function keDomainPesanan(o: {
  id: string; total: number; refund: number; status: Pesanan["status"]; metodeBayar: string; batasKirimJam: number; garansiHari: number;
  createdAt: Date; dibayarAt: Date | null; responSellerAt: Date | null; dikirimAt: Date | null; selesaiAt: Date | null;
}): Pesanan {
  return {
    id: o.id, total: o.total, refund: o.refund, status: o.status,
    metodeBayar: o.metodeBayar === "va" ? "va" : o.metodeBayar === "dompet" ? "dompet" : "qris",
    batasKirimJam: o.batasKirimJam, garansiHari: o.garansiHari, dibuatAt: o.createdAt,
    dibayarAt: o.dibayarAt ?? undefined, responSellerAt: o.responSellerAt ?? undefined,
    dikirimAt: o.dikirimAt ?? undefined, selesaiAt: o.selesaiAt ?? undefined,
  };
}

const NAMA_LAYANAN = { select: { service: { select: { nama: true } } } } as const;

async function muatKonteks(jenis: KonteksAksi["jenis"], id: string): Promise<KonteksAksi | null> {
  switch (jenis) {
    case "pesanan": {
      const o = await prisma.order.findUnique({ where: { id }, include: { listing: { select: { sellerId: true, judul: true } } } });
      return o && { jenis, pesanan: keDomainPesanan(o), kode: o.kode, buyerId: o.buyerId, sellerId: o.listing.sellerId, produk: o.listing.judul };
    }
    case "permintaan": {
      const r = await prisma.joinRequest.findUnique({ where: { id }, include: { offer: { select: { hostId: true, service: { select: { nama: true } } } } } });
      return r && { jenis, id: r.id, status: r.status, joinerId: r.joinerId, hostId: r.offer.hostId, produk: r.offer.service.nama };
    }
    case "langganan": {
      const s = await prisma.subscription.findUnique({
        where: { id },
        include: { batch: { select: { package: NAMA_LAYANAN } }, hostOffer: NAMA_LAYANAN },
      });
      if (!s || !s.habisAt) return null;
      const produk = s.batch?.package.service.nama ?? s.hostOffer?.service.nama ?? "patungan";
      return { jenis, id: s.id, kode: s.kode, status: s.status, userId: s.userId, produk, habisAt: s.habisAt };
    }
    case "batch": {
      const b = await prisma.batch.findUnique({ where: { id }, include: { subscriptions: { select: { userId: true } }, package: NAMA_LAYANAN } });
      return b && { jenis, id: b.id, status: b.status, produk: b.package.service.nama, anggota: b.subscriptions.map((s) => s.userId) };
    }
  }
}

/** Ubah status bersyarat; return jumlah baris yang kena (0 = status sudah berubah). */
async function ubahStatus(tx: Tx, u: NonNullable<RencanaEksekusi["ubah"]>): Promise<number> {
  switch (u.model) {
    case "order":
      return (await tx.order.updateMany({
        where: { id: u.id, status: { in: u.dari } },
        data: { status: u.ke, selesaiAt: u.selesaiAt, feeSeller: u.feeSeller },
      })).count;
    case "joinRequest":
      return (await tx.joinRequest.updateMany({ where: { id: u.id, status: { in: u.dari } }, data: { status: u.ke, decidedAt: u.decidedAt } })).count;
    case "subscription":
      return (await tx.subscription.updateMany({ where: { id: u.id, status: { in: u.dari } }, data: { status: u.ke } })).count;
  }
}

class BatalkanTransaksi extends Error {}

async function terapkan(r: RencanaEksekusi, notifBaru: Notifikasi[], mode: "uji" | "kirim", now: Date): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      if (r.ubah && (await ubahStatus(tx, r.ubah)) === 0) throw new BatalkanTransaksi();
      if (r.jurnal) await simpanJurnal(r.jurnal, tx, AKTOR);
      const a = buatAudit({
        aktorId: AKTOR, peran: [], aksi: `cron.${r.aksi.jenis.toLowerCase()}`, objek: `${r.ubah?.model ?? "aksi"}:${r.aksi.id}`,
        sebelum: r.ubah ? { status: r.ubah.dari } : undefined, sesudah: r.ubah ? { status: r.ubah.ke } : undefined, at: now,
      });
      await tx.auditLog.create({
        data: { aktorId: a.aktorId, peran: a.peran, aksi: a.aksi, objek: a.objek, sebelum: a.sebelum === undefined ? undefined : keJson(a.sebelum), sesudah: a.sesudah === undefined ? undefined : keJson(a.sesudah), at: now },
      });
      if (notifBaru.length > 0) {
        await tx.auditLog.createMany({
          data: notifBaru.map((n) => ({
            aktorId: AKTOR, peran: [], aksi: `notifikasi.${mode}`, objek: `notif:${n.kunci}`,
            sesudah: keJson({ userId: n.userId, kanal: n.kanal, template: n.template, isi: n.isi }), at: now,
          })),
        });
      }
    });
    return true;
  } catch (e) {
    if (e instanceof BatalkanTransaksi) return false;
    throw e;
  }
}

async function kunciTercatat(kunci: string[]): Promise<Set<string>> {
  if (kunci.length === 0) return new Set();
  const ada = await prisma.auditLog.findMany({ where: { objek: { in: kunci.map((k) => `notif:${k}`) } }, select: { objek: true } });
  return new Set(ada.map((x) => x.objek.slice("notif:".length)));
}

export const portPrisma: PortCron = { muatKonteks, kunciTercatat, terapkan };
