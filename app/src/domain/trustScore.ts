/** Skor kepercayaan 0–100 (ditiru dari joinbareng). Bobot bisa diubah di sini; total maksimum 100. */
export interface KomponenSkor {
  fotoProfil: boolean;
  emailTerverifikasi: boolean;
  hpTerverifikasi: boolean;
  kycLulus: boolean;
  rekeningTerverifikasi: boolean;
  fakturDiunggah: boolean;
  transaksiSelesai: number;
  ratingRata: number | null; // 1..5
  sengketaKalah90Hari: number;
}

export const BOBOT = {
  fotoProfil: 5,
  emailTerverifikasi: 10,
  hpTerverifikasi: 10,
  kycLulus: 20,
  rekeningTerverifikasi: 10,
  fakturDiunggah: 15,
  transaksiMaks: 15, // 1 poin per transaksi selesai, maks 15
  ratingMaks: 15, // rating 5 = 15 poin
} as const;

export function hitungSkor(k: KomponenSkor): number {
  let s = 0;
  if (k.fotoProfil) s += BOBOT.fotoProfil;
  if (k.emailTerverifikasi) s += BOBOT.emailTerverifikasi;
  if (k.hpTerverifikasi) s += BOBOT.hpTerverifikasi;
  if (k.kycLulus) s += BOBOT.kycLulus;
  if (k.rekeningTerverifikasi) s += BOBOT.rekeningTerverifikasi;
  if (k.fakturDiunggah) s += BOBOT.fakturDiunggah;
  s += Math.min(k.transaksiSelesai, BOBOT.transaksiMaks);
  if (k.ratingRata !== null) s += Math.round((Math.max(0, Math.min(5, k.ratingRata)) / 5) * BOBOT.ratingMaks);
  s -= 10 * k.sengketaKalah90Hari;
  return Math.max(0, Math.min(100, s));
}

/** Skor 100 atau faktur terverifikasi = "dijamin sesuai iklan". */
export function dijaminSesuaiIklan(skor: number, fakturTerverifikasi: boolean): boolean {
  return skor >= 100 || fakturTerverifikasi;
}
