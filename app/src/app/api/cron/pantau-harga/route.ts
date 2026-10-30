/**
 * GET /api/cron/pantau-harga — harian (Authorization: Bearer <CRON_SECRET>). Baca halaman harga resmi tiap produk katalog,
 * bandingkan dengan paket (domain/pantauHarga.ts). Default = rencana (kering); ?jalankan=1 → produk yang berubah dijeda di DB.
 * Judul task di respons dibuat jadi task ClickUp "QA & QC" oleh skill qc-harian.
 */
import { muatKatalogJasaBayar } from "../../../../domain/jasaBayarKatalog.ts";
import { cekHalamanHarga, judulTaskPantau, teksDariHtml } from "../../../../domain/pantauHarga.ts";
import { prisma } from "../../../../server/db.ts";
import { izinCron } from "../../../../server/hargaRepo.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ambilTeks(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { "user-agent": "JASA-pantau-harga/1.0 (+cek harga publik)" }, signal: AbortSignal.timeout(15_000) });
    return r.ok ? teksDariHtml(await r.text()) : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request): Promise<Response> {
  if (!izinCron(req)) return Response.json({ error: "tidak diizinkan" }, { status: 401 });
  const jalankan = new URL(req.url).searchParams.get("jalankan") === "1";
  const produk = muatKatalogJasaBayar().produk.filter((p) => p.aktif && p.url_harga && p.mata_uang === "USD" && p.paket.length);
  const hasil = [];
  for (const p of produk) {
    const h = cekHalamanHarga(p, await ambilTeks(p.url_harga as string));
    const task = judulTaskPantau(p, h);
    if (jalankan && h.status === "berubah") {
      await prisma.jasaBayarProduct.update({ where: { slug: p.slug }, data: { dijedaAlasan: task } });
    }
    hasil.push({ slug: p.slug, status: h.status, task });
  }
  return Response.json({ waktu: new Date().toISOString(), mode: jalankan ? "jalankan" : "rencana", hasil });
}
