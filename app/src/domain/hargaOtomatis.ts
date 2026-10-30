/**
 * Harga otomatis Jasa Bayar (docs/23 §6): paket berharga pasti tampil langsung dalam Rupiah di web.
 *
 *   kurs_jual = kurs_mid × (1 + spread)                 ← config/fee.json jasa_bayar.spread_kurs
 *   harga     = USD paket × kurs_jual
 *   ppn       = USD paket × ppn_persen penyedia × kurs_jual   (PPN dipungut penyedia, diteruskan ke pembeli)
 *   fee       = tier fee dari USD paket sebelum pajak (sama dengan joinbareng)
 *   total     = bulat ke atas ribuan(harga + ppn + fee), dikunci kunci_kurs_menit
 *
 * Harga otomatis HANYA tampil bila semua syarat terpenuhi; selain itu "dihitung CS" (tidak pernah menebak):
 * produk aktif · mata uang USD · paket ada · PPN sudah diverifikasi · harga dicek ≤ harga_dicek_maks_hari · tidak dijeda
 * pemantau harga · kurs sah tersedia.
 */
import type { FeeConfig } from "./config.ts";
import { feeJasaBayar } from "./fee.ts";
import type { KursSah } from "./kurs.ts";
import type { KatalogJasaBayar, ProdukJasaBayar } from "./jasaBayarKatalog.ts";
import { bulatkan, ribuanAtas, type Rupiah } from "./money.ts";

export interface RincianHarga {
  produk: string;
  paket: string;
  usd: number;
  ppnPersen: number;
  kursMid: number;
  kursJual: number;
  hargaRp: Rupiah;
  ppnRp: Rupiah;
  spreadRp: Rupiah;
  fee: Rupiah;
  total: Rupiah;
  berlakuSampai: Date;
}

export type HasilHarga = { status: "otomatis"; rincian: RincianHarga } | { status: "dihitung_cs"; alasan: string };

export interface StatusPantau {
  /** slug produk yang sedang dijeda pemantau harga (harga di halaman resmi berubah / belum dikonfirmasi). */
  dijeda: Set<string>;
}

export function hargaDicekMasihBerlaku(p: ProdukJasaBayar, now: Date, cfg: FeeConfig): boolean {
  if (!p.harga_dicek) return false;
  const umurHari = (now.getTime() - new Date(`${p.harga_dicek}T00:00:00+08:00`).getTime()) / 86_400_000;
  return umurHari <= cfg.jasa_bayar.harga_dicek_maks_hari;
}

export function hitungRincian(usd: number, ppnPersen: number, kursMid: number, now: Date, cfg: FeeConfig) {
  if (!(usd > 0) || !(kursMid > 0) || !(ppnPersen >= 0)) throw new Error("usd, kurs harus > 0 dan ppn ≥ 0");
  const kursJual = kursMid * (1 + cfg.jasa_bayar.spread_kurs);
  const harga = usd * kursJual;
  const ppn = usd * ppnPersen * kursJual;
  const fee = feeJasaBayar(usd, harga, cfg);
  return {
    usd,
    ppnPersen,
    kursMid,
    kursJual: Math.round(kursJual * 100) / 100,
    hargaRp: bulatkan(harga),
    ppnRp: bulatkan(ppn),
    spreadRp: bulatkan(harga - usd * kursMid),
    fee,
    total: ribuanAtas(harga + ppn + fee),
    berlakuSampai: new Date(now.getTime() + cfg.jasa_bayar.kunci_kurs_menit * 60_000),
  };
}

export function hargaPaket(
  p: ProdukJasaBayar,
  namaPaket: string,
  kurs: KursSah | null,
  now: Date,
  cfg: FeeConfig,
  pantau: StatusPantau = { dijeda: new Set() },
): HasilHarga {
  const cs = (alasan: string): HasilHarga => ({ status: "dihitung_cs", alasan });
  if (!p.aktif) return cs(`${p.nama} sementara tidak dilayani`);
  if (p.mata_uang !== "USD") return cs("harga penyedia dalam Rupiah/lokal — dihitung CS");
  const paket = p.paket.find((x) => x.nama === namaPaket);
  if (!paket) return cs("paket tidak ada di katalog");
  if (p.ppn_persen === null) return cs("PPN penyedia belum diverifikasi");
  if (!hargaDicekMasihBerlaku(p, now, cfg)) return cs("harga paket perlu dicek ulang");
  if (pantau.dijeda.has(p.slug)) return cs("harga di situs resmi berubah — menunggu konfirmasi admin");
  if (!kurs) return cs("kurs belum tersedia");
  const r = hitungRincian(paket.harga, p.ppn_persen, kurs.nilai, now, cfg);
  return { status: "otomatis", rincian: { produk: p.slug, paket: paket.nama, ...r } };
}

/** Tabel harga untuk halaman web: semua paket semua produk aktif. */
export function tabelHarga(k: KatalogJasaBayar, kurs: KursSah | null, now: Date, cfg: FeeConfig, pantau?: StatusPantau) {
  return k.produk.filter((p) => p.aktif).map((p) => ({
    slug: p.slug,
    nama: p.nama,
    kategori: p.kategori,
    paket: p.paket.length
      ? p.paket.map((pk) => ({ nama: pk.nama, usd: pk.harga, harga: hargaPaket(p, pk.nama, kurs, now, cfg, pantau) }))
      : [],
  }));
}
