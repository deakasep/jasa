/**
 * Ledger berpasangan (double-entry). Setiap mutasi uang = satu Jurnal yang total debit == total kredit.
 * Saldo tidak pernah di-update langsung; saldo = hasil penjumlahan jurnal.
 *
 * Konvensi akun (string):
 *   kas:gateway                 aset — uang di payment gateway/rekening penampung (saldo normal DEBIT)
 *   escrow:<orderId>            kewajiban — dana pembeli yang ditahan (normal KREDIT)
 *   dompet:<userId>             kewajiban — saldo dompet pengguna, tidak bisa ditarik (normal KREDIT)
 *   saldo_penjual:<userId>      kewajiban — saldo penjualan host/seller, bisa ditarik (normal KREDIT)
 *   pendapatan:<sumber>         pendapatan platform (normal KREDIT)
 *   biaya:<jenis>               beban platform, mis. biaya:referral, biaya:gateway (normal DEBIT)
 *   hutang_penyedia:<layanan>   kewajiban ke penyedia layanan (grup Resmi / jasa bayar) (normal KREDIT)
 */
import { pastikanRupiah, type Rupiah } from "./money.ts";

export interface Baris {
  akun: string;
  debit: Rupiah;
  kredit: Rupiah;
}

export interface Jurnal {
  ref: string; // id unik idempoten, mis. "bayar:JSA-261030-01"
  keterangan: string;
  baris: Baris[];
}

const NORMAL_DEBIT = ["kas:", "biaya:"];

export function normalDebit(akun: string): boolean {
  return NORMAL_DEBIT.some((p) => akun.startsWith(p));
}

export function buatJurnal(ref: string, keterangan: string, baris: Baris[]): Jurnal {
  if (!ref) throw new Error("ref jurnal wajib (untuk idempotensi)");
  const bersih = baris.filter((b) => b.debit !== 0 || b.kredit !== 0);
  if (bersih.length < 2) throw new Error("jurnal minimal 2 baris");
  let d = 0;
  let k = 0;
  for (const b of bersih) {
    pastikanRupiah(b.debit, `debit ${b.akun}`);
    pastikanRupiah(b.kredit, `kredit ${b.akun}`);
    if (b.debit > 0 && b.kredit > 0) throw new Error(`baris ${b.akun} tidak boleh debit & kredit sekaligus`);
    d += b.debit;
    k += b.kredit;
  }
  if (d !== k) throw new Error(`jurnal tidak seimbang: debit ${d} ≠ kredit ${k} (${ref})`);
  return { ref, keterangan, baris: bersih };
}

const D = (akun: string, n: Rupiah): Baris => ({ akun, debit: n, kredit: 0 });
const K = (akun: string, n: Rupiah): Baris => ({ akun, debit: 0, kredit: n });

/** Saldo akun sesuai saldo normalnya (positif = wajar). */
export function saldo(jurnal: Jurnal[], akun: string): Rupiah {
  let s = 0;
  for (const j of jurnal) for (const b of j.baris) if (b.akun === akun) s += b.kredit - b.debit;
  return normalDebit(akun) ? -s : s;
}

export function cekSeimbang(jurnal: Jurnal[]): boolean {
  let d = 0;
  let k = 0;
  for (const j of jurnal) for (const b of j.baris) { d += b.debit; k += b.kredit; }
  return d === k;
}

/** Tolak jurnal dengan ref yang sudah ada (webhook dikirim ulang, klik ganda). */
export function tambahIdempoten(buku: Jurnal[], j: Jurnal): { buku: Jurnal[]; baru: boolean } {
  if (buku.some((x) => x.ref === j.ref)) return { buku, baru: false };
  return { buku: [...buku, j], baru: true };
}

// ---------- Resep jurnal per kejadian bisnis ----------

/** Pembeli bayar pesanan marketplace via gateway → dana ditahan di escrow. */
export function jurnalBayarEscrow(orderId: string, total: Rupiah): Jurnal {
  return buatJurnal(`bayar:${orderId}`, "Pembayaran masuk, dana ditahan", [D("kas:gateway", total), K(`escrow:${orderId}`, total)]);
}

/** Pesanan SELESAI → escrow dilepas ke saldo penjual dikurangi fee platform. */
export function jurnalLepasEscrow(orderId: string, sellerId: string, total: Rupiah, fee: Rupiah): Jurnal {
  if (fee > total) throw new Error("fee melebihi total pesanan");
  return buatJurnal(`lepas:${orderId}`, "Pesanan selesai, dana ke penjual", [
    D(`escrow:${orderId}`, total),
    K(`saldo_penjual:${sellerId}`, total - fee),
    K("pendapatan:marketplace", fee),
  ]);
}

/** Refund (penuh atau sebagian) dari escrow ke DOMPET pembeli; sisa (jika sebagian) dilepas ke penjual oleh jurnal lain. */
export function jurnalRefundEscrow(orderId: string, buyerId: string, nominal: Rupiah, ke: "dompet" = "dompet"): Jurnal {
  return buatJurnal(`refund:${orderId}:${nominal}`, `Refund ke ${ke}`, [D(`escrow:${orderId}`, nominal), K(`dompet:${buyerId}`, nominal)]);
}

export function jurnalTopupDompet(ref: string, userId: string, nominal: Rupiah): Jurnal {
  return buatJurnal(`topup:${ref}`, "Isi ulang dompet", [D("kas:gateway", nominal), K(`dompet:${userId}`, nominal)]);
}

/** Bayar pakai saldo dompet → masuk escrow (marketplace) atau langsung ke tujuan lain. */
export function jurnalBayarDariDompet(ref: string, userId: string, tujuan: string, nominal: Rupiah): Jurnal {
  return buatJurnal(`dompet:${ref}`, "Bayar dengan dompet", [D(`dompet:${userId}`, nominal), K(tujuan, nominal)]);
}

/**
 * Patungan grup host: joiner bayar (harga slot + fee joiner). Host menerima harga slot dikurangi connection fee (bulan pertama).
 * Dana dimasukkan dulu ke escrow langganan; jurnal ini melepasnya setelah akses dikonfirmasi.
 */
export function jurnalPatunganHost(params: {
  ref: string;
  escrowAkun: string;
  hostId: string;
  hargaSlot: Rupiah;
  feeJoiner: Rupiah;
  connectionFee: Rupiah;
}): Jurnal {
  const { ref, escrowAkun, hostId, hargaSlot, feeJoiner, connectionFee } = params;
  if (connectionFee > hargaSlot) throw new Error("connection fee melebihi harga slot");
  return buatJurnal(`patungan:${ref}`, "Patungan host: dana ke host & fee platform", [
    D(escrowAkun, hargaSlot + feeJoiner),
    K(`saldo_penjual:${hostId}`, hargaSlot - connectionFee),
    K("pendapatan:patungan_joiner", feeJoiner),
    K("pendapatan:patungan_host", connectionFee),
  ]);
}

/** Patungan grup Resmi JASA: harga slot menjadi kewajiban ke penyedia plan, fee = pendapatan. */
export function jurnalPatunganResmi(ref: string, escrowAkun: string, layanan: string, hargaSlot: Rupiah, feeJoiner: Rupiah): Jurnal {
  return buatJurnal(`resmi:${ref}`, "Patungan resmi: aktivasi batch", [
    D(escrowAkun, hargaSlot + feeJoiner),
    K(`hutang_penyedia:${layanan}`, hargaSlot),
    K("pendapatan:patungan_joiner", feeJoiner),
  ]);
}

/** Penarikan saldo penjual ke rekening bank. */
export function jurnalPayout(ref: string, sellerId: string, nominal: Rupiah, minimal: Rupiah): Jurnal {
  if (nominal < minimal) throw new Error(`penarikan minimal ${minimal}`);
  return buatJurnal(`payout:${ref}`, "Penarikan ke rekening", [D(`saldo_penjual:${sellerId}`, nominal), K("kas:gateway", nominal)]);
}

/** Bonus referral = biaya marketing, masuk dompet pemilik kode (tidak bisa ditarik). */
export function jurnalBonusReferral(ref: string, userId: string, bonus: Rupiah): Jurnal {
  return buatJurnal(`referral:${ref}`, "Bonus referral", [D("biaya:referral", bonus), K(`dompet:${userId}`, bonus)]);
}

/** Jasa bayar dibayar pembeli: harga + spread jadi kewajiban ke penyedia/kartu, fee + spread jadi pendapatan. */
export function jurnalJasaBayar(ref: string, hargaPenyedia: Rupiah, pendapatan: Rupiah, layanan: string): Jurnal {
  return buatJurnal(`jasabayar:${ref}`, "Jasa bayar diterima", [
    D("kas:gateway", hargaPenyedia + pendapatan),
    K(`hutang_penyedia:${layanan}`, hargaPenyedia),
    K("pendapatan:jasa_bayar", pendapatan),
  ]);
}
