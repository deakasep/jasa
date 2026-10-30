/** Kode voucher: kode PROMO (dari JASA) dan kode REFERRAL (milik pengguna). Diskon promo memotong harga slot, fee tetap. */
import { bulatkan, type Rupiah } from "./money.ts";

export interface KodePromo {
  kode: string;
  tipe: "persen" | "nominal";
  nilai: number; // 0..1 untuk persen, Rupiah untuk nominal
  kuota: number;
  terpakai: number;
  minTransaksi: Rupiah;
  berlakuSampai: Date;
  maksDiskon?: Rupiah;
}

export type HasilPromo = { ok: true; diskon: Rupiah } | { ok: false; alasan: string };

export function normalisasiKode(k: string): string {
  return k.trim().toUpperCase();
}

export function terapkanPromo(
  promo: KodePromo | undefined,
  ctx: { hargaSlot: Rupiah; now: Date; sudahPakaiKodeIni: boolean },
): HasilPromo {
  if (!promo) return { ok: false, alasan: "kode tidak ditemukan" };
  if (ctx.now > promo.berlakuSampai) return { ok: false, alasan: "kode sudah kedaluwarsa" };
  if (promo.terpakai >= promo.kuota) return { ok: false, alasan: "kuota kode habis" };
  if (ctx.sudahPakaiKodeIni) return { ok: false, alasan: "kode hanya bisa dipakai 1x per pengguna" };
  if (ctx.hargaSlot < promo.minTransaksi) return { ok: false, alasan: "belum memenuhi minimal transaksi" };
  let diskon = promo.tipe === "persen" ? bulatkan(ctx.hargaSlot * promo.nilai) : promo.nilai;
  if (promo.maksDiskon !== undefined) diskon = Math.min(diskon, promo.maksDiskon);
  return { ok: true, diskon: Math.min(diskon, ctx.hargaSlot) };
}

export interface AktivasiReferral {
  kode: string;
  pemilikId: string;
  penggunaBaruId: string;
  penggunaBaruSudahTransaksi: boolean;
  penggunaBaruSudahPernahDipakai: boolean; // pengguna baru sudah pernah mengaktifkan kode lain
}

/** Bonus referral (Rp10.000) hanya untuk pengguna baru unik yang sudah bertransaksi; tidak boleh merujuk diri sendiri. */
export function bonusReferral(a: AktivasiReferral, bonus: Rupiah): { ok: true; bonus: Rupiah } | { ok: false; alasan: string } {
  if (a.pemilikId === a.penggunaBaruId) return { ok: false, alasan: "tidak bisa memakai kode sendiri" };
  if (a.penggunaBaruSudahPernahDipakai) return { ok: false, alasan: "pengguna baru sudah memakai kode referral" };
  if (!a.penggunaBaruSudahTransaksi) return { ok: false, alasan: "bonus cair setelah transaksi pertama pengguna baru" };
  return { ok: true, bonus };
}
