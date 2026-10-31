/**
 * Pelaksana aksi cron. Tidak tahu Prisma: semua I/O lewat `PortCron` (implementasi database di cronPrisma.ts,
 * implementasi palsu di test). Setiap aksi berdiri sendiri — satu aksi gagal tidak menghentikan yang lain,
 * dan kegagalan dilaporkan (status "gagal" + pesan), tidak ditelan.
 */
import type { FeeConfig } from "../domain/config.ts";
import { konteksYangDibutuhkan, rencanaEksekusi, type KonteksAksi, type RencanaEksekusi } from "../domain/eksekusiCron.ts";
import type { AksiCron } from "../domain/jobs.ts";
import type { Notifikasi, Pengirim } from "../domain/notifikasi.ts";

export interface PortCron {
  muatKonteks(jenis: KonteksAksi["jenis"], id: string): Promise<KonteksAksi | null>;
  /** Kunci notifikasi yang sudah pernah dicatat (dari daftar yang ditanyakan). */
  kunciTercatat(kunci: string[]): Promise<Set<string>>;
  /**
   * Atomik dalam satu transaksi: ubah status bersyarat, simpan jurnal (idempoten), catat audit aksi,
   * dan catat notifikasi baru ke kotak keluar/audit. Return false bila ubah status tidak mengenai baris
   * (status di DB sudah berubah) — seluruh transaksi dibatalkan.
   */
  terapkan(r: RencanaEksekusi, notifBaru: Notifikasi[], mode: Pengirim["mode"], now: Date): Promise<boolean>;
}

export type StatusEksekusi = "dijalankan" | "dilewati" | "gagal";

export interface HasilAksi {
  jenis: AksiCron["jenis"];
  id: string;
  status: StatusEksekusi;
  alasan?: string;
  notifikasi: number;
}

export interface RingkasanEksekusi {
  mode: Pengirim["mode"];
  hasil: HasilAksi[];
  dijalankan: number;
  dilewati: number;
  gagal: number;
}

export async function jalankanAksiCron(aksi: AksiCron[], port: PortCron, pengirim: Pengirim, now: Date, cfg: FeeConfig): Promise<RingkasanEksekusi> {
  const hasil: HasilAksi[] = [];
  for (const a of aksi) {
    try {
      const r = rencanaEksekusi(a, await port.muatKonteks(konteksYangDibutuhkan(a), a.id), now, cfg);
      if (r.lewati) {
        hasil.push({ jenis: a.jenis, id: a.id, status: "dilewati", alasan: r.lewati, notifikasi: 0 });
        continue;
      }
      const sudah = await port.kunciTercatat(r.notifikasi.map((n) => n.kunci));
      const baru = r.notifikasi.filter((n) => !sudah.has(n.kunci));
      if (!r.ubah && !r.jurnal && baru.length === 0) {
        hasil.push({ jenis: a.jenis, id: a.id, status: "dilewati", alasan: "notifikasi sudah pernah dikirim", notifikasi: 0 });
        continue;
      }
      const kena = await port.terapkan(r, baru, pengirim.mode, now);
      if (!kena) {
        hasil.push({ jenis: a.jenis, id: a.id, status: "dilewati", alasan: "status di database sudah berubah", notifikasi: 0 });
        continue;
      }
      // Kirim SETELAH transaksi sukses. Mode uji: hanya masuk kotak keluar di memori.
      for (const n of baru) await pengirim.kirim(n);
      hasil.push({ jenis: a.jenis, id: a.id, status: "dijalankan", notifikasi: baru.length });
    } catch (e) {
      hasil.push({ jenis: a.jenis, id: a.id, status: "gagal", alasan: e instanceof Error ? e.message : String(e), notifikasi: 0 });
    }
  }
  const hitung = (s: StatusEksekusi) => hasil.filter((h) => h.status === s).length;
  return { mode: pengirim.mode, hasil, dijalankan: hitung("dijalankan"), dilewati: hitung("dilewati"), gagal: hitung("gagal") };
}
