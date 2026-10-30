/**
 * Patungan: tagihan joiner, batch grup Resmi, permintaan bergabung ke grup host, perpanjangan.
 * Aturan mengikuti joinbareng (docs/15-patungan-batch.md, docs/20-pusat-bantuan.md).
 */
import type { FeeConfig, Periode } from "./config.ts";
import { connectionFeeHost, feeJoiner } from "./fee.ts";
import { pastikanRupiah, type Rupiah } from "./money.ts";

const MENIT = 60_000;
const JAM = 60 * MENIT;
const HARI = 24 * JAM;

export interface Tagihan {
  hargaSlot: Rupiah;
  diskon: Rupiah;
  fee: Rupiah;
  total: Rupiah;
}

/** Diskon promo memotong harga slot; fee dihitung dari harga slot setelah diskon. */
export function tagihanJoiner(hargaSlot: Rupiah, periode: Periode, cfg: FeeConfig, diskon: Rupiah = 0): Tagihan {
  pastikanRupiah(hargaSlot, "hargaSlot");
  pastikanRupiah(diskon, "diskon");
  const setelah = Math.max(0, hargaSlot - diskon);
  const fee = feeJoiner(setelah, periode, cfg);
  return { hargaSlot, diskon: hargaSlot - setelah, fee, total: setelah + fee };
}

export interface PembagianHost {
  diterimaHost: Rupiah;
  connectionFee: Rupiah;
}

/** Host menerima harga slot; connection fee hanya bulan pertama per joiner baru (atau joiner pindah grup). */
export function pembagianHost(
  hargaSlot: Rupiah,
  periode: Periode,
  cfg: FeeConfig,
  opsi: { bulanKe: number; pribadi: boolean },
): PembagianHost {
  const fee = opsi.bulanKe === 1 ? connectionFeeHost(hargaSlot, periode, cfg, opsi.pribadi) : 0;
  return { diterimaHost: hargaSlot - fee, connectionFee: fee };
}

// ---------- Batch grup Resmi ----------

export type StatusBatch = "BUKA" | "PENUH" | "AKTIF" | "BATAL";

export interface Batch {
  id: string;
  kapasitas: number;
  anggota: string[]; // userId
  status: StatusBatch;
  dibukaAt: Date;
  autoProvision: boolean;
}

export function sisaSlot(b: Batch): number {
  return b.kapasitas - b.anggota.length;
}

export function tambahAnggota(b: Batch, userId: string): Batch {
  if (b.status !== "BUKA") throw new Error(`batch ${b.id} tidak menerima anggota (status ${b.status})`);
  if (b.anggota.includes(userId)) throw new Error("pengguna sudah ada di batch ini");
  const anggota = [...b.anggota, userId];
  return { ...b, anggota, status: anggota.length >= b.kapasitas ? "PENUH" : "BUKA" };
}

/** Akses boleh dikirim bila batch penuh, atau layanan auto-provision. */
export function aksesBolehDikirim(b: Batch): boolean {
  return b.status === "PENUH" || b.status === "AKTIF" || (b.autoProvision && b.status === "BUKA");
}

/** Batch tidak penuh lewat 7 hari → tawarkan pindah / tunggu / refund 100%. */
export function batchPerluTawaran(b: Batch, now: Date, cfg: FeeConfig): boolean {
  return b.status === "BUKA" && !b.autoProvision && now.getTime() - b.dibukaAt.getTime() > cfg.timer.batch_resmi_maks_hari * HARI;
}

// ---------- Permintaan bergabung ke grup host (penerimaan instan off) ----------

export type StatusPermintaan = "MENUNGGU" | "DITERIMA" | "DITOLAK" | "DIBATALKAN" | "KADALUARSA";

export interface PermintaanGabung {
  id: string;
  status: StatusPermintaan;
  dibuatAt: Date;
}

export function bolehBatalkanPermintaan(r: PermintaanGabung, now: Date, cfg: FeeConfig): boolean {
  return r.status === "MENUNGGU" && now.getTime() - r.dibuatAt.getTime() >= cfg.timer.batal_permintaan_setelah_menit * MENIT;
}

export function permintaanKadaluarsa(r: PermintaanGabung, now: Date, cfg: FeeConfig): boolean {
  return r.status === "MENUNGGU" && now.getTime() - r.dibuatAt.getTime() > cfg.timer.host_terima_permintaan_jam * JAM;
}

// ---------- Langganan berjalan & perpanjangan ----------

export interface Langganan {
  id: string;
  habisAt: Date;
  diperpanjang: boolean;
}

export type AksiRenewal = "TIDAK_ADA" | "KIRIM_PENGINGAT" | "LEPAS_SLOT";

/** H-3 kirim invoice/pengingat; H+1 belum bayar → slot dilepas. */
export function aksiRenewal(l: Langganan, now: Date, cfg: FeeConfig): AksiRenewal {
  if (l.diperpanjang) return "TIDAK_ADA";
  const selisih = l.habisAt.getTime() - now.getTime();
  if (selisih <= -1 * HARI) return "LEPAS_SLOT";
  if (selisih <= cfg.timer.reminder_renewal_hari * HARI) return "KIRIM_PENGINGAT";
  return "TIDAK_ADA";
}

/** Tambah periode dihitung dari tanggal habis lama (bukan tanggal bayar) agar tidak ada hari hilang. */
export function perpanjang(l: Langganan, periode: Periode, now: Date): Langganan {
  const dasar = l.habisAt > now ? l.habisAt : now;
  const baru = new Date(dasar);
  if (periode === "bulanan") baru.setUTCMonth(baru.getUTCMonth() + 1);
  else baru.setUTCFullYear(baru.getUTCFullYear() + 1);
  return { ...l, habisAt: baru, diperpanjang: false };
}

/** Joiner berhenti di tengah periode: tidak ada refund; host tetap dibayar penuh periode berjalan. */
export function refundBerhentiSendiri(): Rupiah {
  return 0;
}
