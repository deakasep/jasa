/**
 * Kurs USD→IDR otomatis untuk harga Jasa Bayar (docs/23 §6). Murni: menerima kandidat dari beberapa sumber + kurs terakhir
 * yang sah, mengembalikan kurs yang dipakai beserta status. Angka batas di config/fee.json → jasa_bayar.kurs.
 *
 * Aturan:
 * - Kandidat basi (lebih tua dari maks_umur_jam) atau tidak masuk akal diabaikan.
 * - Dua sumber atau lebih: pakai median. Beda antar-sumber > maks_beda_antar_sumber → peringatan (tetap median).
 * - Lonjakan dibanding kurs terakhir > maks_lonjakan → TAHAN: pakai kurs terakhir, admin diberi tahu (bisa data salah).
 * - Tidak ada kandidat sah: pakai kurs terakhir selama belum basi; kalau basi juga → harga otomatis dimatikan (CS).
 */
import type { FeeConfig } from "./config.ts";

export interface KandidatKurs {
  sumber: string;
  nilai: number; // Rupiah per 1 USD
  waktu: Date; // waktu data menurut sumber
}

export interface KursSah {
  nilai: number;
  waktu: Date;
  sumber: string;
}

export type HasilKurs =
  | { status: "baru"; kurs: KursSah; peringatan: string[] }
  | { status: "pakai_terakhir"; kurs: KursSah; peringatan: string[] }
  | { status: "tidak_ada"; peringatan: string[] };

// Batas kewajaran kasar supaya angka rusak (mis. 1,65 atau 1.650.000) tidak pernah dipakai.
const MIN_WAJAR = 5_000;
const MAKS_WAJAR = 50_000;

export function median(n: number[]): number {
  const s = [...n].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function basi(waktu: Date, now: Date, cfg: FeeConfig): boolean {
  return now.getTime() - waktu.getTime() > cfg.jasa_bayar.kurs.maks_umur_jam * 3_600_000;
}

export function pilihKurs(kandidat: KandidatKurs[], terakhir: KursSah | null, now: Date, cfg: FeeConfig): HasilKurs {
  const k = cfg.jasa_bayar.kurs;
  const peringatan: string[] = [];
  const sah = kandidat.filter((x) => {
    const ok = Number.isFinite(x.nilai) && x.nilai >= MIN_WAJAR && x.nilai <= MAKS_WAJAR && !basi(x.waktu, now, cfg) && x.waktu <= new Date(now.getTime() + 3_600_000);
    if (!ok) peringatan.push(`kurs dari ${x.sumber} diabaikan (tidak wajar atau basi)`);
    return ok;
  });

  const cadangan = (): HasilKurs => {
    if (terakhir && !basi(terakhir.waktu, now, cfg)) return { status: "pakai_terakhir", kurs: terakhir, peringatan };
    peringatan.push("tidak ada kurs sah — harga otomatis dimatikan, semua order dihitung CS");
    return { status: "tidak_ada", peringatan };
  };

  if (sah.length === 0) return cadangan();

  const nilai = median(sah.map((x) => x.nilai));
  if (sah.length > 1) {
    const beda = (Math.max(...sah.map((x) => x.nilai)) - Math.min(...sah.map((x) => x.nilai))) / nilai;
    if (beda > k.maks_beda_antar_sumber) peringatan.push(`beda antar sumber kurs ${(beda * 100).toFixed(2)}%`);
  }
  if (terakhir) {
    const lonjak = Math.abs(nilai - terakhir.nilai) / terakhir.nilai;
    if (lonjak > k.maks_lonjakan) {
      peringatan.push(`kurs melonjak ${(lonjak * 100).toFixed(2)}% (${terakhir.nilai} → ${nilai}) — ditahan, cek manual`);
      return cadangan();
    }
  }
  const waktu = new Date(Math.min(...sah.map((x) => x.waktu.getTime())));
  return { status: "baru", kurs: { nilai: Math.round(nilai * 100) / 100, waktu, sumber: sah.map((x) => x.sumber).sort().join("+") }, peringatan };
}

/** Admin mengonfirmasi lonjakan kurs (kurs memang bergerak): kandidat dipakai walau melewati batas lonjakan. */
export function konfirmasiLonjakan(kandidat: KandidatKurs[], now: Date, cfg: FeeConfig): HasilKurs {
  return pilihKurs(kandidat, null, now, cfg);
}
