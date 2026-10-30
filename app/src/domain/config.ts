/**
 * Konfigurasi fee & timer. Satu-satunya sumber angka: config/fee.json di root repo
 * (dipakai juga oleh scripts/hitung.py). Jangan menulis angka fee di kode.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export type Periode = "bulanan" | "tahunan";

export interface TierJasaBayar {
  maks_usd: number | null;
  tipe: "flat" | "persen";
  nilai: number;
}

export interface FeeConfig {
  patungan: Record<Periode, { persen: number; tetap: number }>;
  patungan_host: Record<Periode, { persen: number; maks: number }> & { pribadi_bebas_connection_fee: boolean };
  jasa_bayar: {
    tier: TierJasaBayar[];
    spread_kurs: number;
    kunci_kurs_menit: number;
    kurs: { refresh_menit: number; maks_umur_jam: number; maks_lonjakan: number; maks_beda_antar_sumber: number };
    toleransi_selisih_checkout: number;
    harga_dicek_maks_hari: number;
  };
  estimasi_pajak: { pph_final_umkm: number; markup_kurs_bank_estimasi: number };
  marketplace: {
    fee_seller_persen: number;
    fee_seller_min: number;
    payout_min: number;
    payout_sla_jam_kerja: number;
  };
  dompet: { topup_min: number; bisa_ditarik: boolean; kedaluwarsa: boolean; referral_bonus: number };
  biaya_gateway_estimasi: Record<"qris" | "va" | "payout", { persen: number; tetap: number }>;
  timer: {
    bayar_qris_menit: number;
    bayar_va_jam: number;
    host_terima_permintaan_jam: number;
    batal_permintaan_setelah_menit: number;
    seller_respon_jam: number;
    batas_kirim_maks_jam: number;
    masa_cek_hari: number;
    masa_cek_bergaransi_hari: number;
    putusan_sengketa_jam: number;
    proses_refund_jam: number;
    refund_kredensial_rusak_jam: number;
    verifikasi_kyc_jam: number;
    verifikasi_rekening_jam: number;
    klaim_patungan_hari_kerja: number;
    mediasi_hari_kerja: number;
    layanan_host_min_hari: number;
    reminder_renewal_hari: number;
    batch_resmi_maks_hari: number;
  };
}

let cache: FeeConfig | undefined;

/** Lokasi default: env FEE_CONFIG_PATH, lalu ../config/fee.json relatif terhadap folder app/. */
export function lokasiConfig(): string {
  return process.env.FEE_CONFIG_PATH ?? path.resolve(process.cwd(), "..", "config", "fee.json");
}

export function muatFeeConfig(lokasi: string = lokasiConfig()): FeeConfig {
  if (cache && lokasi === lokasiConfig()) return cache;
  const cfg = JSON.parse(readFileSync(lokasi, "utf8")) as FeeConfig;
  validasiConfig(cfg);
  if (lokasi === lokasiConfig()) cache = cfg;
  return cfg;
}

export function validasiConfig(cfg: FeeConfig): void {
  const salah: string[] = [];
  for (const p of ["bulanan", "tahunan"] as const) {
    if (!(cfg.patungan?.[p]?.persen >= 0)) salah.push(`patungan.${p}.persen`);
    if (!(cfg.patungan_host?.[p]?.maks >= 0)) salah.push(`patungan_host.${p}.maks`);
  }
  if (!Array.isArray(cfg.jasa_bayar?.tier) || cfg.jasa_bayar.tier.at(-1)?.maks_usd !== null) {
    salah.push("jasa_bayar.tier (tier terakhir harus maks_usd null)");
  }
  if (!(cfg.marketplace?.fee_seller_persen >= 0 && cfg.marketplace.fee_seller_persen < 1)) salah.push("marketplace.fee_seller_persen");
  const k = cfg.jasa_bayar?.kurs;
  if (!(k?.refresh_menit > 0 && k.maks_umur_jam > 0 && k.maks_lonjakan > 0 && k.maks_beda_antar_sumber > 0)) salah.push("jasa_bayar.kurs");
  if (!Number.isInteger(cfg.jasa_bayar?.toleransi_selisih_checkout) || cfg.jasa_bayar.toleransi_selisih_checkout < 0) {
    salah.push("jasa_bayar.toleransi_selisih_checkout");
  }
  if (!(cfg.jasa_bayar?.harga_dicek_maks_hari > 0)) salah.push("jasa_bayar.harga_dicek_maks_hari");
  if (!(cfg.estimasi_pajak?.pph_final_umkm >= 0)) salah.push("estimasi_pajak.pph_final_umkm");
  if (salah.length) throw new Error(`config/fee.json tidak valid: ${salah.join(", ")}`);
}
