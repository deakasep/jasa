/**
 * GET /api/cron — dipanggil terjadwal (Vercel Cron / GitHub Actions) dengan header Authorization: Bearer <CRON_SECRET>.
 * Mengambil data aktif, meminta domain/jobs.ts merencanakan aksi, lalu mengembalikan rencana (mode kering = default).
 * Eksekusi aksi (update status + notifikasi) diaktifkan dengan ?jalankan=1 setelah QA rilis lulus.
 */
import { muatFeeConfig } from "../../../domain/config.ts";
import { rencanakan, type DataCron } from "../../../domain/jobs.ts";
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
    pesanan: orders.map((o) => ({
      id: o.id, total: o.total, status: o.status, metodeBayar: o.metodeBayar === "va" ? "va" : o.metodeBayar === "dompet" ? "dompet" : "qris",
      batasKirimJam: o.batasKirimJam, garansiHari: o.garansiHari, dibuatAt: o.createdAt,
      dibayarAt: o.dibayarAt ?? undefined, responSellerAt: o.responSellerAt ?? undefined, dikirimAt: o.dikirimAt ?? undefined,
    })),
    permintaan: reqs.map((r) => ({ id: r.id, status: r.status, dibuatAt: r.createdAt })),
    langganan: subs.map((s) => ({ id: s.id, habisAt: s.habisAt as Date, diperpanjang: s.status === "DIPERPANJANG" })),
    batch: batches.map((b) => ({ id: b.id, kapasitas: b.kapasitas, anggota: b.subscriptions.map((s) => s.userId), status: b.status, dibukaAt: b.dibukaAt, autoProvision: b.package.autoProvision })),
  };

  const aksi = rencanakan(data, now, cfg);
  return Response.json({ waktu: now.toISOString(), jumlah: aksi.length, aksi, mode: "rencana" });
}
