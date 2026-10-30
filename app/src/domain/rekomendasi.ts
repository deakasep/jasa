/**
 * Tab "Rekomendasi" marketplace + daftar game fokus (data/kategori-marketplace.json, docs/22 §6).
 * Skor murni dari data asli (tanpa iklan berbayar): penjualan 30 hari, rating (dirata-rata dengan prior),
 * skor kepercayaan seller, kecepatan respon.
 */
export interface AturanRekomendasi {
  bobot: { penjualan_30_hari: number; rating: number; skor_kepercayaan_seller: number; kecepatan_respon: number };
  rating_prior: number;
  rating_prior_bobot: number;
  respon_ideal_menit: number;
  respon_maks_menit: number;
  skor_kepercayaan_min: number;
}

export interface ListingSkor {
  id: string;
  terjual30Hari: number;
  ratingRata: number; // 0..5, 0 bila belum ada ulasan
  jumlahUlasan: number;
  skorKepercayaanSeller: number; // 0..100
  medianResponMenit: number | null; // null = belum ada data
}

export interface GameFokus {
  nama: string;
  slug: string;
  kategori: string[];
}

export function validasiAturan(a: AturanRekomendasi): void {
  const total = Object.values(a.bobot).reduce((s, v) => s + v, 0);
  if (Math.abs(total - 1) > 1e-9) throw new Error(`rekomendasi: total bobot harus 1 (sekarang ${total})`);
  if (Object.values(a.bobot).some((v) => v < 0)) throw new Error("rekomendasi: bobot tidak boleh negatif");
  if (a.respon_maks_menit <= a.respon_ideal_menit) throw new Error("rekomendasi: respon_maks harus > respon_ideal");
}

/** Rating Bayesian: listing dengan sedikit ulasan ditarik ke prior agar 1 ulasan bintang 5 tidak langsung juara. */
export function ratingTerkoreksi(l: ListingSkor, a: AturanRekomendasi): number {
  return (a.rating_prior * a.rating_prior_bobot + l.ratingRata * l.jumlahUlasan) / (a.rating_prior_bobot + l.jumlahUlasan);
}

export function skorRekomendasi(l: ListingSkor, maksTerjual: number, a: AturanRekomendasi): number {
  const jual = maksTerjual > 0 ? Math.log1p(l.terjual30Hari) / Math.log1p(maksTerjual) : 0;
  const rating = ratingTerkoreksi(l, a) / 5;
  const percaya = Math.min(Math.max(l.skorKepercayaanSeller, 0), 100) / 100;
  let respon = 0;
  if (l.medianResponMenit !== null) {
    const m = l.medianResponMenit;
    respon = m <= a.respon_ideal_menit ? 1 : m >= a.respon_maks_menit ? 0 : (a.respon_maks_menit - m) / (a.respon_maks_menit - a.respon_ideal_menit);
  }
  const b = a.bobot;
  return b.penjualan_30_hari * jual + b.rating * rating + b.skor_kepercayaan_seller * percaya + b.kecepatan_respon * respon;
}

/** Urutan tab Rekomendasi: seller di bawah ambang kepercayaan dikeluarkan; seri → terjual lebih banyak, lalu id (stabil). */
export function urutkanRekomendasi(daftar: ListingSkor[], a: AturanRekomendasi): ListingSkor[] {
  validasiAturan(a);
  const lolos = daftar.filter((l) => l.skorKepercayaanSeller >= a.skor_kepercayaan_min);
  const maks = Math.max(0, ...lolos.map((l) => l.terjual30Hari));
  return lolos
    .map((l) => ({ l, s: skorRekomendasi(l, maks, a) }))
    .sort((x, y) => y.s - x.s || y.l.terjual30Hari - x.l.terjual30Hari || x.l.id.localeCompare(y.l.id))
    .map((x) => x.l);
}

/** Listing game hanya boleh untuk game fokus dan kategori yang terdaftar untuk game itu. */
export function listingGameDiizinkan(slugGame: string, slugKategori: string, game: GameFokus[]): boolean {
  return game.some((g) => g.slug === slugGame && g.kategori.includes(slugKategori));
}
