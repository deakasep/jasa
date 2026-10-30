/**
 * Perencana tugas terjadwal (cron). Murni: menerima data + waktu sekarang, mengembalikan daftar aksi.
 * Lapisan server yang mengeksekusi aksi (update DB, kirim WA/email, tulis ledger) — lihat src/server/cron.ts.
 */
import type { FeeConfig } from "./config.ts";
import { bolehBatalPembeli, majukanWaktu, type Pesanan } from "./escrow.ts";
import { aksiRenewal, batchPerluTawaran, permintaanKadaluarsa, type Batch, type Langganan, type PermintaanGabung } from "./patungan.ts";

export type AksiCron =
  | { jenis: "PESANAN_KADALUARSA"; id: string }
  | { jenis: "PESANAN_AUTO_SELESAI"; id: string }
  | { jenis: "BERI_TAHU_PEMBELI_BOLEH_BATAL"; id: string }
  | { jenis: "PERMINTAAN_KADALUARSA"; id: string }
  | { jenis: "KIRIM_PENGINGAT_RENEWAL"; id: string }
  | { jenis: "LEPAS_SLOT"; id: string }
  | { jenis: "TAWARKAN_PINDAH_BATCH"; id: string };

export interface DataCron {
  pesanan: Pesanan[];
  permintaan: PermintaanGabung[];
  langganan: Langganan[];
  batch: Batch[];
}

export function rencanakan(d: DataCron, now: Date, cfg: FeeConfig): AksiCron[] {
  const aksi: AksiCron[] = [];
  for (const p of d.pesanan) {
    const maju = majukanWaktu(p, now, cfg);
    if (maju.status !== p.status) {
      aksi.push({ jenis: maju.status === "KADALUARSA" ? "PESANAN_KADALUARSA" : "PESANAN_AUTO_SELESAI", id: p.id });
    } else if (bolehBatalPembeli(p, now, cfg)) {
      aksi.push({ jenis: "BERI_TAHU_PEMBELI_BOLEH_BATAL", id: p.id });
    }
  }
  for (const r of d.permintaan) if (permintaanKadaluarsa(r, now, cfg)) aksi.push({ jenis: "PERMINTAAN_KADALUARSA", id: r.id });
  for (const l of d.langganan) {
    const a = aksiRenewal(l, now, cfg);
    if (a === "KIRIM_PENGINGAT") aksi.push({ jenis: "KIRIM_PENGINGAT_RENEWAL", id: l.id });
    if (a === "LEPAS_SLOT") aksi.push({ jenis: "LEPAS_SLOT", id: l.id });
  }
  for (const b of d.batch) if (batchPerluTawaran(b, now, cfg)) aksi.push({ jenis: "TAWARKAN_PINDAH_BATCH", id: b.id });
  return aksi;
}
