/**
 * Eksekusi aksi cron (`/api/cron?jalankan=1`). Murni: aksi dari domain/jobs.ts + konteks dari database
 * → rencana eksekusi (ubah status bersyarat, jurnal ledger bila ada uang bergerak, notifikasi WA/email).
 * Lapisan I/O (src/server/cron.ts) menerapkan rencana dalam satu transaksi.
 *
 * Aturan:
 *  - Ubah status selalu bersyarat (`dari`): bila status di DB sudah berubah (mis. pembeli keburu konfirmasi), aksi dilewati.
 *  - Uang hanya bergerak lewat jurnal (PESANAN_AUTO_SELESAI → jurnalLepasEscrow, ref `lepas:<id>` idempoten).
 *  - Notifikasi tanpa ubah status (BERI_TAHU_PEMBELI_BOLEH_BATAL, TAWARKAN_PINDAH_BATCH) dijaga kunci idempoten agar
 *    tidak dikirim ulang setiap cron jalan.
 */
import type { FeeConfig } from "./config.ts";
import { hitungPenyelesaian, majukanWaktu, type Pesanan, type StatusPesanan } from "./escrow.ts";
import type { AksiCron } from "./jobs.ts";
import { jurnalLepasEscrow, type Jurnal } from "./ledger.ts";
import type { StatusPermintaan } from "./patungan.ts";
import { buatNotifikasi, rupiahPesan, tanggalPesan, type Notifikasi } from "./notifikasi.ts";

export type KonteksAksi =
  | { jenis: "pesanan"; pesanan: Pesanan; kode: string; buyerId: string; sellerId: string; produk: string }
  | { jenis: "permintaan"; id: string; status: StatusPermintaan; joinerId: string; hostId: string; produk: string }
  | { jenis: "langganan"; id: string; kode: string; status: StatusLangganan; userId: string; produk: string; habisAt: Date }
  | { jenis: "batch"; id: string; status: string; produk: string; anggota: string[] };

/** Status langganan (sama dengan enum SubscriptionStatus di prisma/schema.prisma). */
export type StatusLangganan = "MENUNGGU_BAYAR" | "MENUNGGU_BATCH" | "AKTIF" | "H3_RENEWAL" | "DIPERPANJANG" | "LEPAS" | "DICABUT" | "REFUND";

/** Ubah status bersyarat: `dari` = status yang diizinkan saat update; selain itu → aksi dilewati. */
export type UbahStatus =
  | { model: "order"; id: string; dari: StatusPesanan[]; ke: StatusPesanan; selesaiAt?: Date; feeSeller?: number }
  | { model: "joinRequest"; id: string; dari: StatusPermintaan[]; ke: StatusPermintaan; decidedAt?: Date }
  | { model: "subscription"; id: string; dari: StatusLangganan[]; ke: StatusLangganan };

export interface RencanaEksekusi {
  aksi: AksiCron;
  ubah?: UbahStatus;
  jurnal?: Jurnal;
  notifikasi: Notifikasi[];
  /** Diisi bila aksi tidak bisa/tidak perlu dijalankan (konteks hilang, status sudah berubah). */
  lewati?: string;
}

const JENIS_KONTEKS: Record<AksiCron["jenis"], KonteksAksi["jenis"]> = {
  PESANAN_KADALUARSA: "pesanan",
  PESANAN_AUTO_SELESAI: "pesanan",
  BERI_TAHU_PEMBELI_BOLEH_BATAL: "pesanan",
  PERMINTAAN_KADALUARSA: "permintaan",
  KIRIM_PENGINGAT_RENEWAL: "langganan",
  LEPAS_SLOT: "langganan",
  TAWARKAN_PINDAH_BATCH: "batch",
};

export function konteksYangDibutuhkan(aksi: AksiCron): KonteksAksi["jenis"] {
  return JENIS_KONTEKS[aksi.jenis];
}

export function rencanaEksekusi(aksi: AksiCron, k: KonteksAksi | null, now: Date, cfg: FeeConfig): RencanaEksekusi {
  const lewati = (alasan: string): RencanaEksekusi => ({ aksi, notifikasi: [], lewati: alasan });
  if (!k) return lewati("data tidak ditemukan");
  if (k.jenis !== JENIS_KONTEKS[aksi.jenis]) throw new Error(`konteks ${k.jenis} tidak cocok untuk ${aksi.jenis}`);
  const kunci = `${aksi.jenis}:${aksi.id}`;

  switch (aksi.jenis) {
    case "PESANAN_KADALUARSA": {
      const { pesanan: p, kode, buyerId, produk } = k as Extract<KonteksAksi, { jenis: "pesanan" }>;
      if (p.status !== "MENUNGGU_BAYAR") return lewati(`status sudah ${p.status}`);
      return {
        aksi,
        ubah: { model: "order", id: p.id, dari: ["MENUNGGU_BAYAR"], ke: "KADALUARSA" },
        notifikasi: buatNotifikasi(kunci, buyerId, "pesanan-kadaluarsa", { KODE: kode, PRODUK: produk }),
      };
    }
    case "PESANAN_AUTO_SELESAI": {
      const { pesanan: p, kode, buyerId, sellerId, produk } = k as Extract<KonteksAksi, { jenis: "pesanan" }>;
      const maju = majukanWaktu(p, now, cfg);
      if (p.status !== "DIKIRIM" || maju.status !== "SELESAI") return lewati(`status ${p.status}, masa cek belum habis atau sudah diproses`);
      const s = hitungPenyelesaian(maju, cfg);
      // Refund sebagian (hasil sengketa) dicatat oleh jurnal refund tersendiri; di sini hanya bagian penjual + fee.
      const dilepas = s.kePenjual + s.feePlatform;
      return {
        aksi,
        ubah: { model: "order", id: p.id, dari: ["DIKIRIM"], ke: "SELESAI", selesaiAt: now, feeSeller: s.feePlatform },
        jurnal: jurnalLepasEscrow(p.id, sellerId, dilepas, s.feePlatform),
        notifikasi: [
          ...buatNotifikasi(kunci, buyerId, "pesanan-selesai-pembeli", { KODE: kode, PRODUK: produk }),
          ...buatNotifikasi(kunci, sellerId, "pesanan-selesai-penjual", { KODE: kode, PRODUK: produk, NOMINAL: rupiahPesan(s.kePenjual) }),
        ],
      };
    }
    case "BERI_TAHU_PEMBELI_BOLEH_BATAL": {
      const { pesanan: p, kode, buyerId, produk } = k as Extract<KonteksAksi, { jenis: "pesanan" }>;
      if (p.status !== "DIBAYAR") return lewati(`status sudah ${p.status}`);
      return { aksi, notifikasi: buatNotifikasi(kunci, buyerId, "pembeli-boleh-batal", { KODE: kode, PRODUK: produk }) };
    }
    case "PERMINTAAN_KADALUARSA": {
      const r = k as Extract<KonteksAksi, { jenis: "permintaan" }>;
      if (r.status !== "MENUNGGU") return lewati(`status sudah ${r.status}`);
      return {
        aksi,
        ubah: { model: "joinRequest", id: r.id, dari: ["MENUNGGU"], ke: "KADALUARSA", decidedAt: now },
        notifikasi: [
          ...buatNotifikasi(kunci, r.joinerId, "permintaan-kadaluarsa", { PRODUK: r.produk }),
          ...buatNotifikasi(kunci, r.hostId, "permintaan-kadaluarsa-host", { PRODUK: r.produk }),
        ],
      };
    }
    case "KIRIM_PENGINGAT_RENEWAL": {
      const l = k as Extract<KonteksAksi, { jenis: "langganan" }>;
      if (l.status !== "AKTIF" && l.status !== "H3_RENEWAL") return lewati(`status sudah ${l.status}`);
      // Kunci memuat tanggal habis: periode berikutnya (setelah perpanjang) dapat pengingat baru.
      return {
        aksi,
        ubah: l.status === "AKTIF" ? { model: "subscription", id: l.id, dari: ["AKTIF"], ke: "H3_RENEWAL" } : undefined,
        notifikasi: buatNotifikasi(`${kunci}:${l.habisAt.toISOString()}`, l.userId, "reminder-h3", {
          PRODUK: l.produk, KODE: l.kode, TANGGAL_HABIS: tanggalPesan(l.habisAt),
        }),
      };
    }
    case "LEPAS_SLOT": {
      const l = k as Extract<KonteksAksi, { jenis: "langganan" }>;
      if (l.status !== "AKTIF" && l.status !== "H3_RENEWAL") return lewati(`status sudah ${l.status}`);
      return {
        aksi,
        ubah: { model: "subscription", id: l.id, dari: ["AKTIF", "H3_RENEWAL"], ke: "LEPAS" },
        notifikasi: buatNotifikasi(kunci, l.userId, "slot-dilepas", { PRODUK: l.produk, KODE: l.kode }),
      };
    }
    case "TAWARKAN_PINDAH_BATCH": {
      const b = k as Extract<KonteksAksi, { jenis: "batch" }>;
      if (b.status !== "BUKA") return lewati(`status sudah ${b.status}`);
      const anggota = [...new Set(b.anggota)];
      if (anggota.length === 0) return lewati("batch tanpa anggota");
      return { aksi, notifikasi: anggota.flatMap((u) => buatNotifikasi(kunci, u, "batch-7-hari", { PRODUK: b.produk })) };
    }
  }
}
