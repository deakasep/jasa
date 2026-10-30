/**
 * Pengambil kurs USD→IDR dari sumber publik gratis (tanpa API key). `fetch` bisa diganti agar teruji tanpa jaringan.
 * - Frankfurter (kurs referensi ECB, update tiap hari kerja): https://api.frankfurter.app/latest?from=USD&to=IDR
 * - ExchangeRate-API open access (update harian):           https://open.er-api.com/v6/latest/USD
 * Format respons WAJIB dicek ulang ke dokumen resmi sebelum produksi. Pemilihan & pengaman: domain/kurs.ts.
 */
import type { KandidatKurs } from "../domain/kurs.ts";

export type FetchJson = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export const SUMBER_KURS = {
  frankfurter: "https://api.frankfurter.app/latest?from=USD&to=IDR",
  erapi: "https://open.er-api.com/v6/latest/USD",
} as const;

export function bacaFrankfurter(data: unknown): KandidatKurs {
  const d = data as { rates?: { IDR?: number }; date?: string };
  if (typeof d?.rates?.IDR !== "number" || !d.date) throw new Error("frankfurter: format tidak dikenal");
  // Kurs referensi ECB terbit ±16:00 CET; anggap 15:00 UTC hari itu.
  return { sumber: "frankfurter", nilai: d.rates.IDR, waktu: new Date(`${d.date}T15:00:00Z`) };
}

export function bacaErApi(data: unknown): KandidatKurs {
  const d = data as { result?: string; rates?: { IDR?: number }; time_last_update_unix?: number };
  if (d?.result !== "success" || typeof d.rates?.IDR !== "number" || typeof d.time_last_update_unix !== "number") {
    throw new Error("open.er-api: format tidak dikenal");
  }
  return { sumber: "erapi", nilai: d.rates.IDR, waktu: new Date(d.time_last_update_unix * 1000) };
}

/** Ambil semua sumber; sumber yang gagal dicatat sebagai error, tidak menggagalkan yang lain. */
export async function ambilKandidatKurs(f: FetchJson = (u) => fetch(u)): Promise<{ kandidat: KandidatKurs[]; error: string[] }> {
  const tugas: [string, string, (d: unknown) => KandidatKurs][] = [
    ["frankfurter", SUMBER_KURS.frankfurter, bacaFrankfurter],
    ["erapi", SUMBER_KURS.erapi, bacaErApi],
  ];
  const hasil = await Promise.all(tugas.map(async ([nama, url, baca]) => {
    try {
      const r = await f(url);
      if (!r.ok) throw new Error(`${nama}: HTTP ${r.status}`);
      return { ok: true as const, k: baca(await r.json()) };
    } catch (e) {
      return { ok: false as const, e: (e as Error).message };
    }
  }));
  return {
    kandidat: hasil.flatMap((h) => (h.ok ? [h.k] : [])),
    error: hasil.flatMap((h) => (h.ok ? [] : [h.e])),
  };
}
