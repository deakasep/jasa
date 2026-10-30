/**
 * Data CONTOH untuk dashboard admin & pratinjau — fiktif, tanpa nama/kontak/kredensial.
 * Semua waktu relatif terhadap `now` sehingga setiap jenis aksi cron selalu muncul.
 */
import type { DataAdmin } from "./adminDashboard.ts";

const JAM = 3600_000;
const HARI = 24 * JAM;

export function dataContohAdmin(now: Date): DataAdmin {
  const lalu = (ms: number) => new Date(now.getTime() - ms);
  const nanti = (ms: number) => new Date(now.getTime() + ms);
  return {
    pesanan: [
      { id: "MKT-CONTOH-001", total: 75_000, status: "MENUNGGU_BAYAR", metodeBayar: "qris", batasKirimJam: 24, garansiHari: 0, dibuatAt: lalu(2 * JAM) },
      { id: "MKT-CONTOH-002", total: 120_000, status: "DIBAYAR", metodeBayar: "va", batasKirimJam: 24, garansiHari: 0, dibuatAt: lalu(3 * JAM), dibayarAt: lalu(2 * JAM) },
      { id: "MKT-CONTOH-003", total: 50_000, status: "DIKIRIM", metodeBayar: "qris", batasKirimJam: 24, garansiHari: 0, dibuatAt: lalu(5 * HARI), dibayarAt: lalu(5 * HARI), dikirimAt: lalu(4 * HARI) },
      { id: "MKT-CONTOH-004", total: 90_000, status: "DIKIRIM", metodeBayar: "qris", batasKirimJam: 24, garansiHari: 7, dibuatAt: lalu(2 * HARI), dibayarAt: lalu(2 * HARI), dikirimAt: lalu(1 * HARI) },
    ],
    permintaan: [
      { id: "REQ-CONTOH-01", status: "MENUNGGU", dibuatAt: lalu(50 * JAM) },
      { id: "REQ-CONTOH-02", status: "MENUNGGU", dibuatAt: lalu(3 * JAM) },
    ],
    langganan: [
      { id: "JSA-CONTOH-01", habisAt: nanti(2 * HARI), diperpanjang: false },
      { id: "JSA-CONTOH-02", habisAt: lalu(2 * HARI), diperpanjang: false },
      { id: "JSA-CONTOH-03", habisAt: nanti(20 * HARI), diperpanjang: false },
    ],
    batch: [
      { id: "NFX-4-B07", layanan: "Netflix Premium", kapasitas: 4, anggota: ["u1", "u2", "u3"], status: "BUKA", dibukaAt: lalu(9 * HARI), autoProvision: false },
      { id: "NFX-4-B08", layanan: "Netflix Premium", kapasitas: 4, anggota: ["u4"], status: "BUKA", dibukaAt: lalu(1 * HARI), autoProvision: false },
      { id: "YTB-5-B03", layanan: "YouTube Premium Family", kapasitas: 5, anggota: ["u5", "u6"], status: "BUKA", dibukaAt: lalu(10 * HARI), autoProvision: true },
      { id: "SPT-3-B02", layanan: "Spotify Premium Platinum", kapasitas: 3, anggota: ["u7", "u8", "u9"], status: "PENUH", dibukaAt: lalu(3 * HARI), autoProvision: true },
    ],
    refund: [
      { kode: "RFD-CONTOH-01", kodePesanan: "JSA-CONTOH-04", nominal: 59_700, alasan: "batch tidak penuh 7 hari, pembeli pilih refund", pengajuId: "staf-cs-1", diajukanAt: lalu(5 * JAM) },
      { kode: "RFD-CONTOH-02", kodePesanan: "JBY-CONTOH-01", nominal: 1_250_000, alasan: "total checkout penyedia lebih mahal, pembeli pilih refund penuh", pengajuId: "staf-ops-1", diajukanAt: lalu(2 * JAM) },
    ],
  };
}
