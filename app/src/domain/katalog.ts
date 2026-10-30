/** Ubah katalog site/produk.json menjadi baris Service & Package untuk database (murni, teruji). */
import type { Periode } from "./config.ts";
import { hargaPerSlot } from "./fee.ts";

export interface PaketKatalog {
  kode: string;
  slot: number;
  periode: Periode;
  harga_plan_resmi: number;
  harga_per_slot: number;
  slot_tersedia: number;
  auto_provision?: boolean;
}

export interface LayananKatalog {
  id: string;
  nama: string;
  kategori: string;
  akses: string;
  aturan: string[];
  paket: PaketKatalog[];
}

export interface Katalog {
  produk: LayananKatalog[];
  dialihkan_ke_jasa_bayar?: string[];
}

export interface BarisService {
  id: string;
  nama: string;
  kategori: string;
  akses: string;
  aturan: string[];
  multiUserResmi: boolean;
}

export interface BarisPackage {
  kode: string;
  serviceId: string;
  slot: number;
  periode: Periode;
  hargaPlanResmi: number;
  hargaPerSlot: number;
  autoProvision: boolean;
}

/** Skema akses undangan (family/tim) bisa langsung diberi akses → auto-provision; akun bersama menunggu batch penuh. */
export function aksesAutoProvision(akses: string): boolean {
  return /undangan|family sharing|seat/i.test(akses);
}

export function katalogKeBaris(k: Katalog): { services: BarisService[]; packages: BarisPackage[] } {
  const services: BarisService[] = [];
  const packages: BarisPackage[] = [];
  const kodeDipakai = new Set<string>();
  const dialihkan = new Set((k.dialihkan_ke_jasa_bayar ?? []).map((x) => x.toLowerCase()));

  for (const l of k.produk) {
    if (dialihkan.has(l.id.toLowerCase())) throw new Error(`layanan ${l.id} ditandai jasa bayar, tidak boleh di katalog patungan`);
    services.push({ id: l.id, nama: l.nama, kategori: l.kategori, akses: l.akses, aturan: l.aturan, multiUserResmi: true });
    for (const p of l.paket) {
      if (kodeDipakai.has(p.kode)) throw new Error(`kode paket ganda: ${p.kode}`);
      kodeDipakai.add(p.kode);
      const harapan = hargaPerSlot(p.harga_plan_resmi, p.slot);
      if (p.harga_per_slot !== harapan) throw new Error(`${p.kode}: harga_per_slot ${p.harga_per_slot} ≠ ${harapan}`);
      packages.push({
        kode: p.kode,
        serviceId: l.id,
        slot: p.slot,
        periode: p.periode,
        hargaPlanResmi: p.harga_plan_resmi,
        hargaPerSlot: p.harga_per_slot,
        autoProvision: p.auto_provision ?? aksesAutoProvision(l.akses),
      });
    }
  }
  return { services, packages };
}
