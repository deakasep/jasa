/** GET /api/quote?jenis=patungan&harga=46500&periode=bulanan  |  ?jenis=jasa-bayar&usd=20&kurs=16500  |  ?jenis=seller&total=50000 */
import { muatFeeConfig, type Periode } from "../../../domain/config.ts";
import { feeSeller, quoteJasaBayar } from "../../../domain/fee.ts";
import { tagihanJoiner } from "../../../domain/patungan.ts";

export const runtime = "nodejs";

function angka(v: string | null): number {
  const n = Number(v);
  if (v === null || !Number.isFinite(n) || n <= 0) throw new Error("parameter angka tidak valid");
  return n;
}

export async function GET(req: Request): Promise<Response> {
  try {
    const cfg = muatFeeConfig();
    const q = new URL(req.url).searchParams;
    const jenis = q.get("jenis");
    if (jenis === "patungan") {
      const periode = (q.get("periode") ?? "bulanan") as Periode;
      if (periode !== "bulanan" && periode !== "tahunan") throw new Error("periode harus bulanan/tahunan");
      return Response.json(tagihanJoiner(Math.round(angka(q.get("harga"))), periode, cfg));
    }
    if (jenis === "jasa-bayar") return Response.json(quoteJasaBayar(angka(q.get("usd")), angka(q.get("kurs")), cfg));
    if (jenis === "seller") {
      const total = Math.round(angka(q.get("total")));
      const fee = feeSeller(total, cfg);
      return Response.json({ total, fee, diterimaSeller: total - fee });
    }
    return Response.json({ error: "jenis harus patungan | jasa-bayar | seller" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
