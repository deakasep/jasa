/**
 * Metode bayar yang diizinkan (config/pembayaran.json). Keputusan pemilik 31 Okt 2026:
 * tanpa kartu kredit/debit — hanya QRIS, VA, e-wallet, dan gerai retail lewat gateway Indonesia.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export type JenisMetode = "qris" | "va" | "ewallet" | "retail";

export interface MetodeBayar {
  id: string;
  nama: string;
  jenis: JenisMetode;
  xendit: string | null;
  tripay: string | null;
}

export interface KonfigPembayaran {
  kartu_diizinkan: boolean;
  metode: MetodeBayar[];
  kode_kartu_ditolak: string[];
}

const JENIS_SAH: JenisMetode[] = ["qris", "va", "ewallet", "retail"];

export function lokasiKonfigPembayaran(): string {
  return process.env.JASA_PEMBAYARAN_PATH ?? path.resolve(process.cwd(), "..", "config", "pembayaran.json");
}

export function validasiKonfigPembayaran(k: KonfigPembayaran): void {
  if (k.kartu_diizinkan !== false) throw new Error("pembayaran: kartu kredit/debit tidak diizinkan (keputusan pemilik 31 Okt)");
  if (!k.metode.length) throw new Error("pembayaran: minimal satu metode");
  if (!k.metode.some((m) => m.jenis === "qris")) throw new Error("pembayaran: QRIS wajib ada");
  const ditolak = new Set(k.kode_kartu_ditolak.map((s) => s.toUpperCase()));
  const id = new Set<string>();
  for (const m of k.metode) {
    if (id.has(m.id)) throw new Error(`pembayaran: id ganda ${m.id}`);
    id.add(m.id);
    if (!JENIS_SAH.includes(m.jenis)) throw new Error(`pembayaran: jenis ${m.jenis} tidak diizinkan (${m.id})`);
    for (const kode of [m.xendit, m.tripay]) {
      if (kode && (ditolak.has(kode.toUpperCase()) || /CARD|^CC$/i.test(kode))) throw new Error(`pembayaran: kode kartu ${kode} dilarang (${m.id})`);
    }
  }
}

export function muatKonfigPembayaran(lokasi: string = lokasiKonfigPembayaran()): KonfigPembayaran {
  const k = JSON.parse(readFileSync(lokasi, "utf8")) as KonfigPembayaran;
  validasiKonfigPembayaran(k);
  return k;
}

/** Daftar kanal untuk field `payment_methods` invoice Xendit — membatasi halaman bayar agar kartu tidak muncul. */
export function kanalXendit(k: KonfigPembayaran): string[] {
  return k.metode.map((m) => m.xendit).filter((x): x is string => !!x);
}

/** Tripay closed payment memakai satu kanal per transaksi; kanal harus ada di daftar izin. */
export function kanalTripaySah(kode: string, k: KonfigPembayaran): boolean {
  return k.metode.some((m) => m.tripay === kode);
}
