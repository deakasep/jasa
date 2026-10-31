/**
 * Dashboard admin (murni): menyusun tampilan dari data + peran + waktu.
 * Bagian yang terlihat ditentukan RBAC (domain/rbac.ts); refund besar wajib finance/owner + empat mata.
 * Antrian aksi cron = hasil domain/jobs.ts mode rencana (eksekusi: `/api/cron?jalankan=1` + `CRON_JALANKAN=1`, lihat domain/eksekusiCron.ts).
 */
import type { FeeConfig } from "./config.ts";
import { rencanakan, type AksiCron, type DataCron } from "./jobs.ts";
import type { Rupiah } from "./money.ts";
import { aksesBolehDikirim, batchPerluTawaran, sisaSlot, type Batch } from "./patungan.ts";
import { boleh, butuhEmpatMata, type Aksi, type Peran } from "./rbac.ts";

const HARI = 24 * 3600_000;

export type Bagian = "antrian_cron" | "batch" | "refund";

/** Izin minimal untuk melihat tiap bagian. */
export const IZIN_BAGIAN: Record<Bagian, Aksi> = {
  antrian_cron: "pesanan.proses",
  batch: "batch.kelola",
  refund: "refund.ajukan",
};

export const LABEL_AKSI_CRON: Record<AksiCron["jenis"], string> = {
  PESANAN_KADALUARSA: "Tandai pesanan kadaluarsa (tidak dibayar)",
  PESANAN_AUTO_SELESAI: "Selesaikan otomatis (masa cek habis) → dana ke penjual",
  BERI_TAHU_PEMBELI_BOLEH_BATAL: "Beri tahu pembeli: penjual telat, boleh batal + refund penuh",
  PERMINTAAN_KADALUARSA: "Kadaluarsakan permintaan gabung (host tidak merespons)",
  KIRIM_PENGINGAT_RENEWAL: "Kirim pengingat perpanjangan (H-3)",
  LEPAS_SLOT: "Lepas slot (lewat H+1 belum bayar)",
  TAWARKAN_PINDAH_BATCH: "Tawarkan pindah batch / tunggu / refund 100%",
};

export interface BatchAdmin extends Batch {
  layanan: string;
}

export interface PengajuanRefund {
  kode: string;
  kodePesanan: string;
  nominal: Rupiah;
  alasan: string;
  pengajuId: string;
  diajukanAt: Date;
}

export interface DataAdmin extends Omit<DataCron, "batch"> {
  batch: BatchAdmin[];
  refund: PengajuanRefund[];
}

export interface BarisCron {
  jenis: AksiCron["jenis"];
  id: string;
  label: string;
}

export interface BarisBatch {
  id: string;
  layanan: string;
  terisi: number;
  kapasitas: number;
  sisa: number;
  umurHari: number;
  status: Batch["status"];
  aksesBolehDikirim: boolean;
  perluTawaran: boolean;
}

export interface BarisRefund {
  kode: string;
  kodePesanan: string;
  nominal: Rupiah;
  alasan: string;
  pengajuId: string;
  bolehSetujui: boolean;
  empatMata: boolean;
  /** Penyetuju tidak boleh pengaju yang sama (kecuali mode satu orang + jeda 1 jam + alasan). */
  catatan: string;
}

export interface Dashboard {
  peran: Peran[];
  bagian: Bagian[];
  ringkasan: { aksiCron: number; batchBuka: number; batchPerluTawaran: number; refundMenunggu: number; nominalRefund: Rupiah };
  antrianCron: BarisCron[];
  batch: BarisBatch[];
  refund: BarisRefund[];
}

export function bagianTerlihat(peran: readonly Peran[]): Bagian[] {
  return (Object.keys(IZIN_BAGIAN) as Bagian[]).filter((b) => boleh(peran, IZIN_BAGIAN[b]));
}

export function susunDashboard(d: DataAdmin, peran: readonly Peran[], now: Date, cfg: FeeConfig): Dashboard {
  const bagian = bagianTerlihat(peran);
  const lihat = (b: Bagian) => bagian.includes(b);

  const aksi = rencanakan(d, now, cfg);
  const antrianCron: BarisCron[] = lihat("antrian_cron") ? aksi.map((a) => ({ jenis: a.jenis, id: a.id, label: LABEL_AKSI_CRON[a.jenis] })) : [];

  const semuaBatch: BarisBatch[] = d.batch
    .map((b) => ({
      id: b.id,
      layanan: b.layanan,
      terisi: b.anggota.length,
      kapasitas: b.kapasitas,
      sisa: sisaSlot(b),
      umurHari: Math.floor((now.getTime() - b.dibukaAt.getTime()) / HARI),
      status: b.status,
      aksesBolehDikirim: aksesBolehDikirim(b),
      perluTawaran: batchPerluTawaran(b, now, cfg),
    }))
    // yang perlu tindakan di atas, lalu yang paling lama dibuka
    .sort((a, b) => Number(b.perluTawaran) - Number(a.perluTawaran) || b.umurHari - a.umurHari);

  const semuaRefund: BarisRefund[] = d.refund
    .map((r) => {
      const ctx = { nominal: r.nominal };
      const bolehSetujui = boleh(peran, "refund.setujui", ctx);
      const empatMata = butuhEmpatMata("refund.setujui", ctx);
      const catatan = !bolehSetujui
        ? boleh(peran, "refund.setujui")
          ? "Di atas batas ops — butuh finance/owner"
          : "Hanya bisa diajukan, tidak bisa disetujui"
        : empatMata
          ? `Empat mata: penyetuju ≠ ${r.pengajuId}`
          : "Boleh disetujui";
      return { kode: r.kode, kodePesanan: r.kodePesanan, nominal: r.nominal, alasan: r.alasan, pengajuId: r.pengajuId, bolehSetujui, empatMata, catatan };
    })
    .sort((a, b) => b.nominal - a.nominal);

  return {
    peran: [...peran],
    bagian,
    ringkasan: {
      aksiCron: lihat("antrian_cron") ? aksi.length : 0,
      batchBuka: lihat("batch") ? semuaBatch.filter((b) => b.status === "BUKA").length : 0,
      batchPerluTawaran: lihat("batch") ? semuaBatch.filter((b) => b.perluTawaran).length : 0,
      refundMenunggu: lihat("refund") ? semuaRefund.length : 0,
      nominalRefund: lihat("refund") ? semuaRefund.reduce((s, r) => s + r.nominal, 0) : 0,
    },
    antrianCron,
    batch: lihat("batch") ? semuaBatch : [],
    refund: lihat("refund") ? semuaRefund : [],
  };
}
