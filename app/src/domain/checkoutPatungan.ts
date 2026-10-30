/**
 * Ringkasan checkout patungan (murni, tanpa gateway). Dipakai halaman /checkout sebelum gateway nyata disambungkan.
 * Validasi: paket ada di katalog, periode cocok, slot masih tersedia, bukan layanan yang dialihkan ke Jasa Bayar.
 */
import type { FeeConfig, Periode } from "./config.ts";
import { aksesAutoProvision, type Katalog } from "./katalog.ts";
import type { Rupiah } from "./money.ts";
import { tagihanJoiner, type Tagihan } from "./patungan.ts";

export interface PilihanPaket {
  kode: string;
  layanan: string;
  periode: Periode;
  hargaSlot: Rupiah;
  slotTersedia: number;
}

export interface RingkasanCheckout {
  kodePaket: string;
  layanan: string;
  kategori: string;
  akses: string;
  aturan: string[];
  periode: Periode;
  slot: number;
  slotTersedia: number;
  /** true = akses langsung dikirim (undangan/seat); false = menunggu batch penuh. */
  aksesLangsung: boolean;
  tagihan: Tagihan;
}

export function daftarPaket(k: Katalog): PilihanPaket[] {
  return k.produk.flatMap((l) =>
    l.paket.map((p) => ({ kode: p.kode, layanan: l.nama, periode: p.periode, hargaSlot: p.harga_per_slot, slotTersedia: p.slot_tersedia })),
  );
}

export function ringkasCheckout(k: Katalog, kodePaket: string, cfg: FeeConfig, diskon: Rupiah = 0): RingkasanCheckout {
  const kode = kodePaket.trim().toUpperCase();
  const dialihkan = new Set((k.dialihkan_ke_jasa_bayar ?? []).map((x) => x.toLowerCase()));
  for (const l of k.produk) {
    const p = l.paket.find((x) => x.kode.toUpperCase() === kode);
    if (!p) continue;
    if (dialihkan.has(l.id.toLowerCase())) throw new Error(`${l.nama} tidak dipatungkan — pakai Jasa Bayar`);
    if (p.slot_tersedia < 1) throw new Error(`slot ${p.kode} sedang habis — masuk waitlist`);
    return {
      kodePaket: p.kode,
      layanan: l.nama,
      kategori: l.kategori,
      akses: l.akses,
      aturan: l.aturan,
      periode: p.periode,
      slot: p.slot,
      slotTersedia: p.slot_tersedia,
      aksesLangsung: p.auto_provision ?? aksesAutoProvision(l.akses),
      tagihan: tagihanJoiner(p.harga_per_slot, p.periode, cfg, diskon),
    };
  }
  throw new Error(`paket ${kodePaket} tidak ditemukan`);
}
