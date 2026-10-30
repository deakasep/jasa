/**
 * Ulasan, ticker transaksi, dan strip kepercayaan untuk SEMUA pilar (Marketplace, Patungan, Jasa Bayar, Permintaan).
 * Ditiru dari joinbareng: rating + jumlah ulasan per produk, 3 testimoni (nama disingkat + kota + paket), ticker
 * "transaksi terbaru" lintas produk dengan nama disamarkan, strip "N+ transaksi sukses · Rating x/5 · Garansi 100% refund ·
 * Aktif 1–5 menit". Bedanya: semua angka dihitung dari data asli dengan ambang tampil (config/kepercayaan.json),
 * jadi tidak pernah ada klaim tulisan tangan (docs/02 §Strip kepercayaan, docs/09 §10).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export type Pilar = "marketplace" | "patungan" | "jasa_bayar" | "permintaan";

export interface KepercayaanConfig {
  transaksi_min_tampil: number;
  transaksi_tangga: number[];
  ulasan_min_tampil: number;
  kecepatan_min_pesanan_30_hari: number;
  kecepatan_target_menit: Record<Pilar, number>;
  testimoni_min_rating: number;
  testimoni_tampil: number;
  ticker_tampil: number;
  layanan_lain_jadi_katalog_min_pesanan: number;
}

export function muatKepercayaan(
  lokasi = process.env.KEPERCAYAAN_CONFIG_PATH ?? path.resolve(process.cwd(), "..", "config", "kepercayaan.json"),
): KepercayaanConfig {
  return JSON.parse(readFileSync(lokasi, "utf8")) as KepercayaanConfig;
}

/** Ulasan hanya dari pesanan yang SELESAI, satu pesanan maksimal satu ulasan, bintang bulat 1–5. */
export function bolehMengulas(statusPesanan: string, sudahAdaUlasan: boolean): { ok: true } | { ok: false; alasan: string } {
  if (statusPesanan !== "SELESAI") return { ok: false, alasan: "ulasan hanya untuk pesanan yang sudah selesai" };
  if (sudahAdaUlasan) return { ok: false, alasan: "satu pesanan hanya boleh satu ulasan" };
  return { ok: true };
}

export function validRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/** "Andra Saputra" → "Andra S." (testimoni). Satu kata → kata itu saja. */
export function namaTestimoni(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  if (kata.length === 0) return "Pengguna";
  if (kata.length === 1) return kata[0];
  return `${kata[0]} ${kata[kata.length - 1][0].toUpperCase()}.`;
}

/** "Sonny Wijaya" → "Sonn***" (ticker). Nama pendek tetap disamarkan minimal 1 huruf. */
export function namaTicker(nama: string): string {
  const depan = nama.trim().split(/\s+/)[0] ?? "";
  if (!depan) return "***";
  const tampil = Math.max(1, Math.min(4, depan.length - 1));
  return `${depan.slice(0, tampil)}***`;
}

export interface RingkasanRating {
  rata: number | null; // 1 desimal
  jumlah: number;
}

export function ringkasRating(ratings: number[]): RingkasanRating {
  const sah = ratings.filter(validRating);
  if (sah.length === 0) return { rata: null, jumlah: 0 };
  const rata = Math.round((sah.reduce((a, b) => a + b, 0) / sah.length) * 10) / 10;
  return { rata, jumlah: sah.length };
}

/** Bulatkan ke bawah ke anak tangga: 10.437 → "10.000+". Di bawah ambang → null. */
export function labelTransaksi(jumlah: number, cfg: KepercayaanConfig): string | null {
  if (jumlah < cfg.transaksi_min_tampil) return null;
  const tangga = [...cfg.transaksi_tangga].sort((a, b) => a - b).filter((t) => t <= jumlah).at(-1)!;
  return `${tangga.toLocaleString("id-ID")}+`;
}

export function median(nilai: number[]): number | null {
  if (nilai.length === 0) return null;
  const s = [...nilai].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface StatistikPilar {
  transaksiSelesai: number;
  ratings: number[];
  /** Menit dari bayar → aktif/terkirim, pesanan 30 hari terakhir. */
  menitProses30Hari: number[];
}

export interface Badge {
  kunci: "transaksi" | "rating" | "garansi" | "kecepatan";
  teks: string;
  /** true = angka dari data asli; false = label jujur (target/baru) sebelum ambang tercapai. */
  dariData: boolean;
}

export function stripKepercayaan(pilar: Pilar, s: StatistikPilar, cfg: KepercayaanConfig): Badge[] {
  const badges: Badge[] = [];
  const t = labelTransaksi(s.transaksiSelesai, cfg);
  badges.push(t ? { kunci: "transaksi", teks: `${t} transaksi sukses`, dariData: true }
    : { kunci: "transaksi", teks: "Transaksi baru — dilindungi escrow", dariData: false });

  const r = ringkasRating(s.ratings);
  if (r.rata !== null && r.jumlah >= cfg.ulasan_min_tampil) {
    badges.push({ kunci: "rating", teks: `Rating ${r.rata.toLocaleString("id-ID")}/5 dari ${r.jumlah.toLocaleString("id-ID")} ulasan`, dariData: true });
  }

  badges.push({ kunci: "garansi", teks: "Garansi 100% refund*", dariData: false });

  const target = cfg.kecepatan_target_menit[pilar];
  const med = median(s.menitProses30Hari);
  if (med !== null && s.menitProses30Hari.length >= cfg.kecepatan_min_pesanan_30_hari && med <= target) {
    badges.push({ kunci: "kecepatan", teks: `Rata-rata aktif ${Math.max(1, Math.round(med))} menit`, dariData: true });
  } else {
    badges.push({ kunci: "kecepatan", teks: `Target aktif ${target} menit`, dariData: false });
  }
  return badges;
}

export interface UlasanTampil {
  nama: string; // nama asli dari DB; disingkat saat tampil
  kota?: string;
  paket?: string;
  rating: number;
  komentar?: string;
  createdAt: Date;
}

/** Testimoni = ulasan asli terbaru dengan komentar dan bintang ≥ ambang. Tidak pernah ditulis tangan. */
export function pilihTestimoni(ulasan: UlasanTampil[], cfg: KepercayaanConfig) {
  return ulasan
    .filter((u) => validRating(u.rating) && u.rating >= cfg.testimoni_min_rating && (u.komentar ?? "").trim().length >= 20)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, cfg.testimoni_tampil)
    .map((u) => ({ ...u, nama: namaTestimoni(u.nama) }));
}

export interface TransaksiTicker {
  namaPembeli: string;
  produk: string;
  selesaiAt: Date;
}

/** Ticker "transaksi terbaru" lintas produk: hanya pesanan SELESAI nyata, nama disamarkan, waktu relatif. */
export function tickerTransaksi(trx: TransaksiTicker[], now: Date, cfg: KepercayaanConfig) {
  return [...trx]
    .filter((x) => x.selesaiAt <= now)
    .sort((a, b) => b.selesaiAt.getTime() - a.selesaiAt.getTime())
    .slice(0, cfg.ticker_tampil)
    .map((x) => ({ nama: namaTicker(x.namaPembeli), produk: x.produk, waktu: waktuRelatif(x.selesaiAt, now) }));
}

export function waktuRelatif(t: Date, now: Date): string {
  const menit = Math.max(0, Math.floor((now.getTime() - t.getTime()) / 60_000));
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  return `${Math.floor(jam / 24)} hari lalu`;
}
