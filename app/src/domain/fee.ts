import type { FeeConfig, Periode } from "./config.ts";
import { bulatkan, pastikanRupiah, ribuanAtas, type Rupiah } from "./money.ts";

/** Fee JOINER (dibayar pembeli). Bulanan: hargaSlot per bulan. Tahunan: hargaSlot per tahun, fee dihitung per bulan × 12. */
export function feeJoiner(hargaSlot: Rupiah, periode: Periode, cfg: FeeConfig): Rupiah {
  pastikanRupiah(hargaSlot, "hargaSlot");
  const f = cfg.patungan[periode];
  return periode === "bulanan"
    ? bulatkan(hargaSlot * f.persen + f.tetap)
    : bulatkan(hargaSlot * f.persen + 12 * f.tetap);
}

/** Connection fee HOST (dipotong dari penjual) — hanya bulan pertama tiap joiner baru; berbagi pribadi = 0. */
export function connectionFeeHost(hargaSlot: Rupiah, periode: Periode, cfg: FeeConfig, pribadi = false): Rupiah {
  pastikanRupiah(hargaSlot, "hargaSlot");
  if (pribadi && cfg.patungan_host.pribadi_bebas_connection_fee) return 0;
  const f = cfg.patungan_host[periode];
  return Math.min(bulatkan(hargaSlot * f.persen), f.maks);
}

export function hargaPerSlot(hargaPlanResmi: Rupiah, slot: number): Rupiah {
  pastikanRupiah(hargaPlanResmi, "hargaPlanResmi");
  if (!Number.isInteger(slot) || slot < 1) throw new Error("slot minimal 1");
  return ribuanAtas(hargaPlanResmi / slot);
}

export interface QuoteJasaBayar {
  usd: number;
  kursMid: number;
  kursJual: number;
  hargaRp: Rupiah;
  spreadRp: Rupiah;
  fee: Rupiah;
  total: Rupiah;
}

export function feeJasaBayar(usd: number, hargaRp: number, cfg: FeeConfig): Rupiah {
  for (const t of cfg.jasa_bayar.tier) {
    const cocok = t.maks_usd === null || (t.tipe === "flat" ? usd < t.maks_usd : usd <= t.maks_usd);
    if (cocok) return t.tipe === "flat" ? t.nilai : bulatkan(hargaRp * t.nilai);
  }
  throw new Error("tier fee jasa bayar tidak ditemukan");
}

export function quoteJasaBayar(usd: number, kursMid: number, cfg: FeeConfig): QuoteJasaBayar {
  if (!(usd > 0) || !(kursMid > 0)) throw new Error("usd dan kurs harus > 0");
  const kursJual = kursMid * (1 + cfg.jasa_bayar.spread_kurs);
  const hargaRp = usd * kursJual;
  const fee = feeJasaBayar(usd, hargaRp, cfg);
  return {
    usd,
    kursMid,
    kursJual: Math.round(kursJual * 100) / 100,
    hargaRp: bulatkan(hargaRp),
    spreadRp: bulatkan(hargaRp - usd * kursMid),
    fee,
    total: ribuanAtas(hargaRp + fee),
  };
}

export function feeSeller(totalPesanan: Rupiah, cfg: FeeConfig): Rupiah {
  pastikanRupiah(totalPesanan, "totalPesanan");
  const m = cfg.marketplace;
  return Math.max(m.fee_seller_min, bulatkan(totalPesanan * m.fee_seller_persen));
}

export function biayaGateway(nominal: Rupiah, metode: "qris" | "va" | "payout", cfg: FeeConfig): Rupiah {
  const g = cfg.biaya_gateway_estimasi[metode];
  return bulatkan(nominal * g.persen + g.tetap);
}
