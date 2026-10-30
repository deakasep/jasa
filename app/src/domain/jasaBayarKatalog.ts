/**
 * Katalog Jasa Bayar + jalur "Layanan lain" (docs/23-jasa-bayar-katalog.md, data/jasa-bayar-katalog.json).
 *
 * Cara joinbareng melayani ribuan layanan: halaman per layanan hanyalah pintu masuk SEO; di baliknya SATU form generik
 * (estimasi harga USD, email akun produk, nama, WhatsApp, catatan) → CS konfirmasi harga final → invoice. Jadi layanan apa
 * pun bisa dilayani. Kita tiru, plus jalur resmi "Layanan lain" (nama + URL wajib) yang dicek daftar tolak, dan layanan
 * yang sering diminta otomatis diusulkan masuk katalog.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { cekLayanan } from "./jasaBayar.ts";

export type CaraBayar = "kartu_di_akun_pembeli" | "topup_saldo" | "gift_card" | "invoice_sekali" | "tagihan_sekali";

export interface ProdukJasaBayar {
  slug: string;
  nama: string;
  kategori: string;
  mata_uang: "USD" | "IDR";
  cara_bayar: CaraBayar;
  butuh_login: boolean;
  aktif: boolean;
  alasan_nonaktif?: string;
  /** Domain & kata kunci untuk mengenali layanan ini saat dipesan lewat jalur Layanan lain (wajib bila nonaktif). */
  domain?: string[];
  kata_kunci?: string[];
  /** null = PPN penyedia belum diverifikasi → harga otomatis tidak tampil (dihitung CS). 0 = penyedia tidak memungut PPN. */
  ppn_persen: number | null;
  sumber_ppn?: string;
  /** Halaman harga resmi untuk pantau perubahan harga (domain/pantauHarga.ts). */
  url_harga: string | null;
  /** YYYY-MM-DD terakhir paket USD & PPN dicek manusia. */
  harga_dicek: string | null;
  paket: { nama: string; harga: number }[];
  catatan?: string;
  patungan?: string;
}

export interface KatalogJasaBayar {
  cara_bayar: Record<CaraBayar, string>;
  kategori: string[];
  produk: ProdukJasaBayar[];
}

export function muatKatalogJasaBayar(
  lokasi = path.resolve(process.cwd(), "..", "data", "jasa-bayar-katalog.json"),
): KatalogJasaBayar {
  const k = JSON.parse(readFileSync(lokasi, "utf8")) as KatalogJasaBayar;
  const salah = validasiKatalog(k);
  if (salah.length) throw new Error(`data/jasa-bayar-katalog.json tidak valid: ${salah.join("; ")}`);
  return k;
}

export function validasiKatalog(k: KatalogJasaBayar): string[] {
  const salah: string[] = [];
  const slug = new Set<string>();
  for (const p of k.produk) {
    if (!/^[a-z0-9-]+$/.test(p.slug)) salah.push(`slug tidak valid: ${p.slug}`);
    if (slug.has(p.slug)) salah.push(`slug ganda: ${p.slug}`);
    slug.add(p.slug);
    if (!k.kategori.includes(p.kategori)) salah.push(`${p.slug}: kategori tidak dikenal "${p.kategori}"`);
    if (!(p.cara_bayar in k.cara_bayar)) salah.push(`${p.slug}: cara_bayar tidak dikenal`);
    const cek = cekLayanan(`${p.slug} ${p.nama}`);
    if (!cek.ok) salah.push(`${p.slug}: ${cek.alasan}`);
    for (const pk of p.paket) if (!(pk.harga > 0)) salah.push(`${p.slug}/${pk.nama}: harga harus > 0`);
    if (typeof p.aktif !== "boolean") salah.push(`${p.slug}: aktif wajib true/false`);
    if (!p.aktif && !p.alasan_nonaktif) salah.push(`${p.slug}: nonaktif wajib punya alasan_nonaktif`);
    if (!p.aktif && !(p.domain?.length && p.kata_kunci?.length)) salah.push(`${p.slug}: nonaktif wajib punya domain & kata_kunci`);
    if (p.ppn_persen !== null && !(p.ppn_persen >= 0 && p.ppn_persen < 0.5)) salah.push(`${p.slug}: ppn_persen tidak wajar`);
    if (p.ppn_persen !== null && !p.sumber_ppn) salah.push(`${p.slug}: ppn_persen wajib punya sumber_ppn`);
    if (p.harga_dicek !== null && !/^\d{4}-\d{2}-\d{2}$/.test(p.harga_dicek)) salah.push(`${p.slug}: harga_dicek harus YYYY-MM-DD`);
    if (p.url_harga !== null && !p.url_harga.startsWith("https://")) salah.push(`${p.slug}: url_harga harus https`);
  }
  return salah;
}

function normal(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

/** Cari produk berdasarkan nama/slug/kategori (semua kata harus cocok). */
export function cariProduk(k: KatalogJasaBayar, kueri: string, kategori?: string): ProdukJasaBayar[] {
  const kata = normal(kueri).split(" ").filter(Boolean);
  return k.produk.filter((p) => {
    if (kategori && p.kategori !== kategori) return false;
    const teks = normal(`${p.slug} ${p.nama} ${p.kategori}`);
    return kata.every((w) => teks.includes(w));
  });
}

export interface InputOrder {
  slugProduk?: string;
  /** Wajib untuk layanan di luar katalog. */
  namaLayanan?: string;
  urlLayanan?: string;
  estimasiHarga?: number;
}

export interface RencanaOrder {
  jalur: "katalog" | "layanan_lain";
  produk?: ProdukJasaBayar;
  /** Harga final selalu dikonfirmasi CS (≤ 3 menit), kecuali produk USD dengan estimasi dari pembeli. */
  hargaDihitungCs: boolean;
  butuhLogin: boolean;
  caraBayar: CaraBayar | "ditentukan_cs";
  peringatan: string[];
}

export type HasilRencana = { ok: true; rencana: RencanaOrder } | { ok: false; alasan: string };

export function rencanakanOrder(k: KatalogJasaBayar, input: InputOrder): HasilRencana {
  if (input.slugProduk) {
    const produk = k.produk.find((p) => p.slug === input.slugProduk);
    if (!produk) return { ok: false, alasan: "produk tidak ada di katalog — pakai jalur Layanan lain" };
    if (!produk.aktif) return { ok: false, alasan: `${produk.nama} sementara tidak dilayani: ${produk.alasan_nonaktif ?? "nonaktif"}` };
    const peringatan: string[] = [];
    if (produk.cara_bayar === "tagihan_sekali") {
      peringatan.push("Layanan pascabayar: kami bayar tagihan yang sudah terbit sekali, kartu dilepas setelah lunas. Pasang budget alert di akunmu.");
    }
    if (produk.butuh_login) {
      peringatan.push("Perlu login/OTP akunmu saat proses. Pakai password sementara lalu ganti setelah selesai; kami tidak menyimpan kredensial.");
    }
    return {
      ok: true,
      rencana: {
        jalur: "katalog",
        produk,
        hargaDihitungCs: produk.mata_uang !== "USD" || !(input.estimasiHarga && input.estimasiHarga > 0),
        butuhLogin: produk.butuh_login,
        caraBayar: produk.cara_bayar,
        peringatan,
      },
    };
  }

  const nama = (input.namaLayanan ?? "").trim();
  const url = (input.urlLayanan ?? "").trim();
  if (nama.length < 2) return { ok: false, alasan: "isi nama layanan yang mau dibayar" };
  if (!/^https:\/\/[^\s/]+\.[^\s]+$/i.test(url)) return { ok: false, alasan: "isi link halaman harga/checkout layanan (https://…)" };
  const cek = cekLayanan(`${nama} ${url}`);
  if (!cek.ok) return { ok: false, alasan: cek.alasan };
  const host = kunciLayanan(url);
  const kata = new Set(normal(nama).split(" "));
  const nonaktif = k.produk.find((p) => !p.aktif && (
    (p.domain ?? []).some((d) => host === d || host.endsWith(`.${d}`))
    || (p.kata_kunci ?? []).some((w) => normal(w).split(" ").every((x) => kata.has(x)))));
  if (nonaktif) return { ok: false, alasan: `${nonaktif.nama} sementara tidak dilayani: ${nonaktif.alasan_nonaktif ?? "nonaktif"}` };
  return {
    ok: true,
    rencana: {
      jalur: "layanan_lain",
      hargaDihitungCs: true,
      butuhLogin: false,
      caraBayar: "ditentukan_cs",
      peringatan: ["Layanan di luar katalog: CS cek dulu layanan & cara bayarnya, lalu kirim harga final sebelum kamu bayar."],
    },
  };
}

/** Host dari URL layanan lain → kunci pengelompokan (mis. "www.notion.so/pricing" → "notion.so"). */
export function kunciLayanan(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return normal(url);
  }
}

/** Layanan lain yang sudah dipesan ≥ ambang kali (pesanan selesai) dan belum ada di katalog → usulan tambah katalog. */
export function usulanKatalog(
  k: KatalogJasaBayar,
  pesananLayananLain: { url: string; nama: string }[],
  ambang: number,
): { kunci: string; contohNama: string; jumlah: number }[] {
  const hitung = new Map<string, { contohNama: string; jumlah: number }>();
  for (const p of pesananLayananLain) {
    const kunci = kunciLayanan(p.url);
    const ada = hitung.get(kunci);
    hitung.set(kunci, { contohNama: ada?.contohNama ?? p.nama, jumlah: (ada?.jumlah ?? 0) + 1 });
  }
  const sudahAda = new Set(k.produk.map((p) => normal(p.nama)));
  return [...hitung.entries()]
    .filter(([, v]) => v.jumlah >= ambang && !sudahAda.has(normal(v.contohNama)))
    .map(([kunci, v]) => ({ kunci, ...v }))
    .sort((a, b) => b.jumlah - a.jumlah);
}

/**
 * Langkah wajib admin per order (docs/11 §Alur + docs/23 §3). Dipakai sebagai checklist di dashboard admin:
 * order tidak bisa ditandai SELESAI sebelum semua langkah dicentang.
 */
export function checklistProses(caraBayar: CaraBayar | "ditentukan_cs"): string[] {
  const umum = ["cek total checkout penyedia ≤ yang dibayar klien (domain/checkout.ts)", "catat nominal yang benar-benar terpotong dari kartu"];
  const kartu = ["buat kartu virtual khusus order ini, limit = total checkout", "bekukan kartu virtual setelah pembayaran berhasil"];
  switch (caraBayar) {
    case "kartu_di_akun_pembeli":
      return [...kartu, ...umum, "matikan perpanjangan otomatis di akun penyedia (langganan tetap aktif sampai akhir periode)",
        "minta pembeli ganti password bila sempat login", "kirim bukti invoice penyedia ke pembeli"];
    case "tagihan_sekali":
      return [...kartu, ...umum, "pastikan tidak ada kartu kita tersisa sebagai metode bayar utama", "kirim bukti lunas tagihan"];
    case "topup_saldo":
    case "invoice_sekali":
      return [...kartu, ...umum, "kirim bukti pembayaran"];
    case "gift_card":
      return [...umum, "kirim kode gift card lewat chat platform (bukan WhatsApp/email pribadi)"];
    default:
      return [...kartu, ...umum, "tentukan cara bayar & catat sebelum memproses"];
  }
}
