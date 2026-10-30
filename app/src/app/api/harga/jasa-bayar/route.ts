/**
 * GET /api/harga/jasa-bayar — tabel harga Rupiah final per paket (docs/23 §6), dipakai halaman web Jasa Bayar.
 * Kurs terakhir yang sah + produk yang dijeda diambil dari DB; bila DB/kurs tidak tersedia semua paket "dihitung_cs".
 */
import { muatFeeConfig } from "../../../../domain/config.ts";
import { tabelHarga } from "../../../../domain/hargaOtomatis.ts";
import { muatKatalogJasaBayar } from "../../../../domain/jasaBayarKatalog.ts";
import type { KursSah } from "../../../../domain/kurs.ts";
import { kursTerakhir, produkDijeda } from "../../../../server/hargaRepo.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const cfg = muatFeeConfig();
    const katalog = muatKatalogJasaBayar();
    const now = new Date();
    let kurs: KursSah | null = null;
    let dijeda = new Set<string>();
    try {
      [kurs, dijeda] = await Promise.all([kursTerakhir(), produkDijeda()]);
    } catch {
      kurs = null; // DB belum siap → aman: semua dihitung CS
    }
    return Response.json({ waktu: now.toISOString(), kurs, produk: tabelHarga(katalog, kurs, now, cfg, { dijeda }) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
