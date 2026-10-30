/**
 * Pengaman terakhir Jasa Bayar (docs/23 §6) + untung bersih.
 * 1. Sebelum admin membayar: total checkout penyedia (USD, sudah termasuk pajak) dibandingkan dengan yang sudah dibayar klien.
 * 2. Setelah bayar: nominal Rupiah yang benar-benar terpotong dari kartu dicatat → selisih kurs bank nyata; bila rata-ratanya
 *    melebihi spread yang kita pungut, admin diberi peringatan (untung bocor diam-diam).
 */
import type { FeeConfig } from "./config.ts";
import { biayaGateway } from "./fee.ts";
import { bulatkan, type Rupiah } from "./money.ts";

export interface DataCheckout {
  /** USD yang sudah ditagihkan ke klien, termasuk PPN penyedia (usd × (1 + ppn)). */
  usdDitagih: number;
  kursJual: number;
  /** Total yang tertera di halaman checkout penyedia (USD, termasuk pajak). */
  checkoutUsd: number;
}

export type KeputusanCheckout =
  | { keputusan: "lanjut"; selisihRp: 0 }
  | { keputusan: "tanggung"; selisihRp: Rupiah }
  | { keputusan: "tahan"; selisihRp: Rupiah; pesan: string };

export function nilaiCheckout(d: DataCheckout, cfg: FeeConfig): KeputusanCheckout {
  if (!(d.checkoutUsd > 0) || !(d.usdDitagih > 0) || !(d.kursJual > 0)) throw new Error("data checkout tidak valid");
  const lebih = Math.round((d.checkoutUsd - d.usdDitagih) * 100) / 100;
  if (lebih <= 0) return { keputusan: "lanjut", selisihRp: 0 };
  const selisihRp = bulatkan(lebih * d.kursJual);
  if (selisihRp <= cfg.jasa_bayar.toleransi_selisih_checkout) return { keputusan: "tanggung", selisihRp };
  return {
    keputusan: "tahan",
    selisihRp,
    pesan: `Total di penyedia lebih mahal US$${lebih.toFixed(2)} (±Rp${selisihRp.toLocaleString("id-ID")}). Pesanan ditahan: klien bayar kekurangan atau refund penuh.`,
  };
}

/** Selisih kurs bank nyata: (Rp terpotong / (USD × kurs mid)) − 1. */
export function markupBank(usdTerpotong: number, rpTerpotong: Rupiah, kursMid: number): number {
  if (!(usdTerpotong > 0) || !(rpTerpotong > 0) || !(kursMid > 0)) throw new Error("data potongan kartu tidak valid");
  return rpTerpotong / (usdTerpotong * kursMid) - 1;
}

export function evaluasiMarkupBank(markup: number[], cfg: FeeConfig, minData = 10): { rata: number | null; peringatan: string | null } {
  if (markup.length < minData) return { rata: null, peringatan: null };
  const rata = markup.reduce((a, b) => a + b, 0) / markup.length;
  const spread = cfg.jasa_bayar.spread_kurs;
  return {
    rata,
    peringatan: rata > spread
      ? `Kurs bank rata-rata ${(rata * 100).toFixed(2)}% di atas kurs tengah, lebih besar dari spread ${(spread * 100).toFixed(1)}% yang dipungut — untung jasa bayar tergerus.`
      : null,
  };
}

export interface UntungBersih {
  diterima: Rupiah;
  keluarKeKartu: Rupiah;
  biayaGateway: Rupiah;
  estimasiPajak: Rupiah;
  bersih: Rupiah;
  persen: number;
}

/**
 * Untung bersih satu order. `rpKeKartu` = nominal nyata terpotong (atau estimasi: usd × kurs mid × (1 + markup estimasi)).
 * Pajak = PPh final UMKM × dasar; dasar "total" (konservatif) atau "fee" (bila akuntan mengizinkan dana titipan dikecualikan).
 */
export function untungBersih(
  diterima: Rupiah,
  rpKeKartu: Rupiah,
  metode: "qris" | "va",
  cfg: FeeConfig,
  dasarPajak: "total" | "fee" = "total",
): UntungBersih {
  const gateway = biayaGateway(diterima, metode, cfg);
  const kotor = diterima - rpKeKartu;
  const dasar = dasarPajak === "total" ? diterima : Math.max(0, kotor);
  const pajak = bulatkan(dasar * cfg.estimasi_pajak.pph_final_umkm);
  const bersih = kotor - gateway - pajak;
  return { diterima, keluarKeKartu: rpKeKartu, biayaGateway: gateway, estimasiPajak: pajak, bersih, persen: bersih / diterima };
}

export function estimasiRpKeKartu(usdTermasukPajak: number, kursMid: number, cfg: FeeConfig): Rupiah {
  return bulatkan(usdTermasukPajak * kursMid * (1 + cfg.estimasi_pajak.markup_kurs_bank_estimasi));
}
