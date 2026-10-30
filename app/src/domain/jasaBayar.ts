/** Jasa Bayar: kuotasi (kurs terkunci 30 menit), status, batas pembeli baru, layanan terlarang. */
import type { FeeConfig } from "./config.ts";
import { quoteJasaBayar, type QuoteJasaBayar } from "./fee.ts";
import type { Rupiah } from "./money.ts";

export type StatusJasaBayar = "MENUNGGU_BAYAR" | "DIBAYAR" | "DIPROSES" | "SELESAI" | "GAGAL" | "REFUND";

export const LAYANAN_DITOLAK = ["onlyfans", "fansly", "judi", "slot", "casino", "forex", "crypto-exchange", "airwallex"] as const;

export const BATAS_PEMBELI_BARU: Rupiah = 2_000_000;
export const MIN_TRANSAKSI_LANCAR = 3;

export interface KuotasiTerkunci extends QuoteJasaBayar {
  dibuatAt: Date;
  berlakuSampai: Date;
}

export function buatKuotasi(usd: number, kursMid: number, now: Date, cfg: FeeConfig): KuotasiTerkunci {
  const q = quoteJasaBayar(usd, kursMid, cfg);
  return { ...q, dibuatAt: now, berlakuSampai: new Date(now.getTime() + cfg.jasa_bayar.kunci_kurs_menit * 60_000) };
}

export function kuotasiMasihBerlaku(q: KuotasiTerkunci, now: Date): boolean {
  return now <= q.berlakuSampai;
}

export function cekLayanan(slugLayanan: string): { ok: true } | { ok: false; alasan: string } {
  const s = slugLayanan.toLowerCase();
  const kena = LAYANAN_DITOLAK.find((x) => s.includes(x));
  return kena ? { ok: false, alasan: `layanan "${kena}" tidak dilayani (docs/11-jasa-bayar.md)` } : { ok: true };
}

/** Anti-penipuan: pembeli dengan < 3 transaksi lancar dibatasi Rp2.000.000 per transaksi. */
export function cekBatasPembeli(total: Rupiah, transaksiLancar: number): { ok: true } | { ok: false; alasan: string } {
  if (transaksiLancar < MIN_TRANSAKSI_LANCAR && total > BATAS_PEMBELI_BARU) {
    return { ok: false, alasan: "pembeli baru maksimal Rp2.000.000 per transaksi sampai 3 transaksi lancar" };
  }
  return { ok: true };
}

const TRANSISI: Record<StatusJasaBayar, StatusJasaBayar[]> = {
  MENUNGGU_BAYAR: ["DIBAYAR", "GAGAL"],
  DIBAYAR: ["DIPROSES", "REFUND"],
  DIPROSES: ["SELESAI", "GAGAL"],
  GAGAL: ["REFUND"],
  SELESAI: [],
  REFUND: [],
};

export function bolehPindah(dari: StatusJasaBayar, ke: StatusJasaBayar): boolean {
  return TRANSISI[dari].includes(ke);
}

/** Pendapatan kita dari satu transaksi jasa bayar = fee + spread kurs. */
export function pendapatanJasaBayar(q: QuoteJasaBayar): Rupiah {
  return q.fee + q.spreadRp;
}
