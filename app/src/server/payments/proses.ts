/**
 * Lapisan I/O untuk pengolah pembayaran bersama. Dipanggil dari webhook Xendit & Tripay di dalam satu transaksi.
 * Logika keputusan ada di domain/pembayaran.ts (teruji tanpa database).
 */
import { jenisDariKode, rencanakanPembayaranLunas, type DataPesanan } from "../../domain/pembayaran.ts";
import { buatAudit } from "../../domain/audit.ts";
import { keJson, simpanJurnal, type Tx } from "../ledgerRepo.ts";

async function muatPesanan(tx: Tx, kode: string): Promise<DataPesanan | null> {
  switch (jenisDariKode(kode)) {
    case "MKT": {
      const o = await tx.order.findUnique({ where: { kode } });
      return o && { id: o.id, status: o.status, tagihan: o.total };
    }
    case "JSA": {
      const s = await tx.subscription.findUnique({ where: { kode } });
      return s && { id: s.id, status: s.status, tagihan: s.hargaSlot - s.diskon + s.feeJoiner };
    }
    case "JBY": {
      const j = await tx.jasaBayarOrder.findUnique({ where: { kode } });
      return j && { id: j.id, status: j.status, tagihan: j.total };
    }
    default:
      return null;
  }
}

export interface HasilProses {
  hasil: "DIPROSES" | "PERLU_TINJAU";
  alasan?: string;
}

export async function prosesPembayaranLunas(tx: Tx, kode: string, nominal: number, gateway: string): Promise<HasilProses> {
  const rencana = rencanakanPembayaranLunas(kode, nominal, await muatPesanan(tx, kode));

  if (rencana.jenis !== "PROSES") {
    const a = buatAudit({ aktorId: `sistem:${gateway}`, peran: [], aksi: "pembayaran.perlu_tinjau", objek: `pesanan:${kode}`, alasan: rencana.alasan, at: new Date() });
    await tx.auditLog.create({ data: { aktorId: a.aktorId, peran: a.peran, aksi: a.aksi, objek: a.objek, alasan: a.alasan } });
    return { hasil: "PERLU_TINJAU", alasan: rencana.alasan };
  }

  await simpanJurnal(rencana.jurnal, tx, `sistem:${gateway}`);
  if (rencana.statusBaru) {
    const now = new Date();
    if (rencana.pesanan === "MKT") await tx.order.update({ where: { id: rencana.id }, data: { status: "DIBAYAR", dibayarAt: now } });
    if (rencana.pesanan === "JSA") await tx.subscription.update({ where: { id: rencana.id }, data: { status: "MENUNGGU_BATCH" } });
    if (rencana.pesanan === "JBY") await tx.jasaBayarOrder.update({ where: { id: rencana.id }, data: { status: "DIBAYAR" } });
  }
  return { hasil: "DIPROSES" };
}

export { keJson };
