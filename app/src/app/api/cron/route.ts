/**
 * GET /api/cron — dipanggil terjadwal (Vercel Cron / GitHub Actions) dengan header Authorization: Bearer <CRON_SECRET>.
 * Mengambil data aktif, meminta domain/jobs.ts merencanakan aksi, lalu mengembalikan rencana (mode kering = default).
 * Eksekusi aksi (ubah status + jurnal + notifikasi) dengan ?jalankan=1, hanya bila env CRON_JALANKAN=1 (dinyalakan setelah
 * QA rilis lulus). Notifikasi selalu mode uji (NOTIF_MODE selain "kirim"): dicatat di audit, tidak dikirim ke pihak luar.
 * Ada aksi gagal → HTTP 500 supaya pemantau cron melihatnya.
 */
import { muatFeeConfig } from "../../../domain/config.ts";
import { rencanakan, type DataCron } from "../../../domain/jobs.ts";
import { modeNotif, pilihPengirim } from "../../../domain/notifikasi.ts";
import { jalankanAksiCron } from "../../../server/cron.ts";
import { keDomainPesanan, portPrisma } from "../../../server/cronPrisma.ts";
import { prisma } from "../../../server/db.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const rahasia = process.env.CRON_SECRET;
  if (!rahasia || req.headers.get("authorization") !== `Bearer ${rahasia}`) {
    return Response.json({ error: "tidak diizinkan" }, { status: 401 });
  }
  const cfg = muatFeeConfig();
  const now = new Date();

  const [orders, reqs, subs, batches] = await Promise.all([
    prisma.order.findMany({ where: { status: { in: ["MENUNGGU_BAYAR", "DIBAYAR", "DIKIRIM"] } } }),
    prisma.joinRequest.findMany({ where: { status: "MENUNGGU" } }),
    prisma.subscription.findMany({ where: { status: { in: ["AKTIF", "H3_RENEWAL"] }, habisAt: { not: null } } }),
    prisma.batch.findMany({ where: { status: "BUKA" }, include: { subscriptions: { select: { userId: true } }, package: { select: { autoProvision: true } } } }),
  ]);

  const data: DataCron = {
    pesanan: orders.map(keDomainPesanan),
    permintaan: reqs.map((r) => ({ id: r.id, status: r.status, dibuatAt: r.createdAt })),
    langganan: subs.map((s) => ({ id: s.id, habisAt: s.habisAt as Date, diperpanjang: s.status === "DIPERPANJANG" })),
    batch: batches.map((b) => ({ id: b.id, kapasitas: b.kapasitas, anggota: b.subscriptions.map((s) => s.userId), status: b.status, dibukaAt: b.dibukaAt, autoProvision: b.package.autoProvision })),
  };

  const aksi = rencanakan(data, now, cfg);
  if (new URL(req.url).searchParams.get("jalankan") !== "1") {
    return Response.json({ waktu: now.toISOString(), jumlah: aksi.length, aksi, mode: "rencana" });
  }
  if (process.env.CRON_JALANKAN !== "1") {
    return Response.json({ error: "eksekusi cron belum diaktifkan (CRON_JALANKAN=1 setelah QA rilis)", jumlah: aksi.length, aksi }, { status: 409 });
  }
  const ringkasan = await jalankanAksiCron(aksi, portPrisma, pilihPengirim(modeNotif(process.env.NOTIF_MODE)), now, cfg);
  return Response.json({ waktu: now.toISOString(), jumlah: aksi.length, ...ringkasan }, { status: ringkasan.gagal > 0 ? 500 : 200 });
}
