/**
 * Pantau harga resmi penyedia (docs/23 §6). Server mengambil teks halaman `url_harga` secara berkala; fungsi murni ini
 * memeriksa apakah setiap harga paket di katalog masih tertulis di halaman itu.
 * - cocok        → tidak ada aksi
 * - berubah      → produk DIJEDA (harga otomatis mati) + task ClickUp "QA & QC" untuk admin cek & ubah katalog
 * - tidak_terbaca → halaman tidak bisa dibaca (dirender JS, diblokir) → task cek manual; harga tetap jalan sampai
 *                   batas harga_dicek_maks_hari, lalu otomatis mati (hargaOtomatis.ts)
 */
import type { ProdukJasaBayar } from "./jasaBayarKatalog.ts";

export type HasilPantau =
  | { status: "cocok" }
  | { status: "berubah"; hilang: { paket: string; harga: number }[] }
  | { status: "tidak_terbaca"; alasan: string };

/** Variasi penulisan harga: $20, $20.00, US$20, USD 20, 20 USD, $1,200. */
function polaHarga(usd: number): RegExp {
  const bulat = Number.isInteger(usd);
  const angka = bulat ? usd.toLocaleString("en-US") : usd.toFixed(2);
  const tanpaKoma = angka.replace(/,/g, "");
  const inti = `(?:${angka.replace(/[.,]/g, "\\$&")}|${tanpaKoma.replace(/\./g, "\\.")})${bulat ? "(?:\\.00)?" : ""}`;
  return new RegExp(`(?:US\\$|\\$|USD\\s?)\\s?${inti}(?![\\d.,]*\\d)|${inti}\\s?USD\\b`, "i");
}

export function cekHalamanHarga(p: ProdukJasaBayar, teksHalaman: string | null): HasilPantau {
  if (!teksHalaman || teksHalaman.trim().length < 200) return { status: "tidak_terbaca", alasan: "halaman kosong/tidak bisa dibaca" };
  if (!/\$|USD/i.test(teksHalaman)) return { status: "tidak_terbaca", alasan: "tidak ada harga USD di halaman (mungkin harga lokal/dirender JS)" };
  const hilang = p.paket.filter((pk) => !polaHarga(pk.harga).test(teksHalaman)).map((pk) => ({ paket: pk.nama, harga: pk.harga }));
  return hilang.length ? { status: "berubah", hilang } : { status: "cocok" };
}

/** Ringkas jadi judul task ClickUp. */
export function judulTaskPantau(p: ProdukJasaBayar, h: HasilPantau): string | null {
  if (h.status === "cocok") return null;
  if (h.status === "berubah") return `Harga ${p.nama} berubah? Paket ${h.hilang.map((x) => `${x.paket} $${x.harga}`).join(", ")} tidak ditemukan — produk dijeda`;
  return `Cek manual harga ${p.nama}: ${h.alasan}`;
}

/** Teks polos dari HTML (untuk pantau harga): buang script/style/tag, rapikan spasi. */
export function teksDariHtml(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#36;|&dollar;/g, "$")
    .replace(/\s+/g, " ")
    .trim();
}
