/**
 * Mesin status pesanan marketplace (escrow) — aturan perlindungan pembeli joinbareng:
 *  - seller diam > 1 jam setelah dibayar, atau lewat batas kirim (≤ 24 jam) → pembeli boleh batal, refund penuh ke dompet
 *  - setelah dikirim: masa cek 3 hari (7 hari bila bergaransi); pembeli konfirmasi atau otomatis selesai saat masa cek habis
 *  - laporan masalah → SENGKETA, putusan ≤ 24 jam: kirim ulang / refund sebagian / refund penuh / dana ke penjual
 */
import type { FeeConfig } from "./config.ts";
import { feeSeller } from "./fee.ts";
import { pastikanRupiah, type Rupiah } from "./money.ts";

export type StatusPesanan =
  | "MENUNGGU_BAYAR"
  | "DIBAYAR"
  | "DIKIRIM"
  | "SENGKETA"
  | "SELESAI"
  | "DIBATALKAN"
  | "KADALUARSA";

export type Putusan = "KIRIM_ULANG" | "REFUND_SEBAGIAN" | "REFUND_PENUH" | "DANA_KE_PENJUAL";

export interface Pesanan {
  id: string;
  total: Rupiah;
  status: StatusPesanan;
  metodeBayar: "qris" | "va" | "dompet";
  batasKirimJam: number; // per listing, maks dari config
  garansiHari: number; // 0..7
  dibuatAt: Date;
  dibayarAt?: Date;
  responSellerAt?: Date;
  dikirimAt?: Date;
  selesaiAt?: Date;
  refund?: Rupiah;
}

export type Event =
  | { tipe: "BAYAR"; at: Date }
  | { tipe: "SELLER_RESPON"; at: Date }
  | { tipe: "KIRIM"; at: Date }
  | { tipe: "KONFIRMASI_PEMBELI"; at: Date }
  | { tipe: "LAPOR_MASALAH"; at: Date }
  | { tipe: "BATAL_PEMBELI"; at: Date }
  | { tipe: "PUTUSAN"; at: Date; putusan: Putusan; nominalRefund?: Rupiah }
  | { tipe: "WAKTU"; at: Date };

const JAM = 3600_000;
const HARI = 24 * JAM;

export function batasBayar(p: Pesanan, cfg: FeeConfig): Date {
  const ms = p.metodeBayar === "va" ? cfg.timer.bayar_va_jam * JAM : cfg.timer.bayar_qris_menit * 60_000;
  return new Date(p.dibuatAt.getTime() + ms);
}

export function batasKirim(p: Pesanan, cfg: FeeConfig): Date | undefined {
  if (!p.dibayarAt) return undefined;
  const jam = Math.min(p.batasKirimJam, cfg.timer.batas_kirim_maks_jam);
  return new Date(p.dibayarAt.getTime() + jam * JAM);
}

export function akhirMasaCek(p: Pesanan, cfg: FeeConfig): Date | undefined {
  if (!p.dikirimAt) return undefined;
  const hari = p.garansiHari > 0 ? Math.min(Math.max(p.garansiHari, cfg.timer.masa_cek_hari), cfg.timer.masa_cek_bergaransi_hari) : cfg.timer.masa_cek_hari;
  return new Date(p.dikirimAt.getTime() + hari * HARI);
}

/** Pembeli boleh batal & refund penuh bila seller diam > 1 jam atau lewat batas kirim. */
export function bolehBatalPembeli(p: Pesanan, now: Date, cfg: FeeConfig): boolean {
  if (p.status !== "DIBAYAR" || !p.dibayarAt) return false;
  const diam = !p.responSellerAt && now.getTime() - p.dibayarAt.getTime() > cfg.timer.seller_respon_jam * JAM;
  const telat = now > (batasKirim(p, cfg) as Date);
  return diam || telat;
}

export class TransisiTidakSah extends Error {}

function salah(p: Pesanan, e: Event): never {
  throw new TransisiTidakSah(`event ${e.tipe} tidak sah pada status ${p.status} (${p.id})`);
}

/** Terapkan event → pesanan baru (immutable). Melempar TransisiTidakSah bila tidak boleh. */
export function terapkan(p: Pesanan, e: Event, cfg: FeeConfig): Pesanan {
  switch (e.tipe) {
    case "BAYAR":
      if (p.status !== "MENUNGGU_BAYAR") return salah(p, e);
      if (e.at > batasBayar(p, cfg)) return { ...p, status: "KADALUARSA" };
      return { ...p, status: "DIBAYAR", dibayarAt: e.at };
    case "SELLER_RESPON":
      if (p.status !== "DIBAYAR") return salah(p, e);
      return { ...p, responSellerAt: p.responSellerAt ?? e.at };
    case "KIRIM":
      if (p.status !== "DIBAYAR") return salah(p, e);
      return { ...p, status: "DIKIRIM", dikirimAt: e.at, responSellerAt: p.responSellerAt ?? e.at };
    case "KONFIRMASI_PEMBELI":
      if (p.status !== "DIKIRIM") return salah(p, e);
      return { ...p, status: "SELESAI", selesaiAt: e.at };
    case "LAPOR_MASALAH": {
      if (p.status !== "DIKIRIM") return salah(p, e);
      const akhir = akhirMasaCek(p, cfg) as Date;
      if (e.at > akhir) return salah(p, e); // lewat masa cek → garansi toko, di luar escrow
      return { ...p, status: "SENGKETA" };
    }
    case "BATAL_PEMBELI":
      if (!bolehBatalPembeli(p, e.at, cfg)) return salah(p, e);
      return { ...p, status: "DIBATALKAN", refund: p.total, selesaiAt: e.at };
    case "PUTUSAN": {
      if (p.status !== "SENGKETA") return salah(p, e);
      switch (e.putusan) {
        case "KIRIM_ULANG":
          return { ...p, status: "DIKIRIM", dikirimAt: e.at };
        case "REFUND_PENUH":
          return { ...p, status: "DIBATALKAN", refund: p.total, selesaiAt: e.at };
        case "REFUND_SEBAGIAN": {
          const n = pastikanRupiah(e.nominalRefund ?? -1, "nominalRefund");
          if (n <= 0 || n >= p.total) throw new TransisiTidakSah("refund sebagian harus 0 < nominal < total");
          return { ...p, status: "SELESAI", refund: n, selesaiAt: e.at };
        }
        case "DANA_KE_PENJUAL":
          return { ...p, status: "SELESAI", refund: 0, selesaiAt: e.at };
      }
      return salah(p, e);
    }
    case "WAKTU":
      return majukanWaktu(p, e.at, cfg);
  }
}

/** Tindakan otomatis oleh cron: kadaluarsa bayar & auto-selesai saat masa cek habis. */
export function majukanWaktu(p: Pesanan, now: Date, cfg: FeeConfig): Pesanan {
  if (p.status === "MENUNGGU_BAYAR" && now > batasBayar(p, cfg)) return { ...p, status: "KADALUARSA" };
  if (p.status === "DIKIRIM" && now > (akhirMasaCek(p, cfg) as Date)) return { ...p, status: "SELESAI", selesaiAt: now };
  return p;
}

export interface Penyelesaian {
  refundKePembeli: Rupiah;
  kePenjual: Rupiah; // bersih setelah fee
  feePlatform: Rupiah;
}

/** Pembagian dana saat pesanan final. Fee hanya dari bagian yang diterima penjual. */
export function hitungPenyelesaian(p: Pesanan, cfg: FeeConfig): Penyelesaian {
  if (p.status !== "SELESAI" && p.status !== "DIBATALKAN") throw new Error(`pesanan ${p.id} belum final`);
  const refund = p.status === "DIBATALKAN" ? p.total : (p.refund ?? 0);
  const bagianPenjual = p.total - refund;
  const fee = bagianPenjual > 0 ? Math.min(feeSeller(bagianPenjual, cfg), bagianPenjual) : 0;
  return { refundKePembeli: refund, kePenjual: bagianPenjual - fee, feePlatform: fee };
}
