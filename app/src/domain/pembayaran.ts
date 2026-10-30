/**
 * Pengolah pembayaran bersama (murni, tanpa I/O) — dipakai webhook Xendit & Tripay.
 * Input: kode pesanan (merchant_ref/external_id), nominal yang dibayar, dan data pesanan terkait dari database.
 * Output: rencana — jurnal ledger + perubahan status — atau PERLU_TINJAU (nominal beda / pesanan tak dikenal).
 * PERLU_TINJAU tidak melempar error, supaya pembayaran tetap tercatat dan gateway tidak mengirim ulang tanpa henti;
 * admin menindaklanjuti lewat antrian tinjauan.
 */
import { jurnalBayarEscrow, jurnalTopupDompet, type Jurnal } from "./ledger.ts";
import type { Rupiah } from "./money.ts";

export type JenisPesanan = "MKT" | "JSA" | "JBY" | "TOP";

export function jenisDariKode(kode: string): JenisPesanan | undefined {
  const p = kode.split("-")[0];
  return p === "MKT" || p === "JSA" || p === "JBY" || p === "TOP" ? p : undefined;
}

/** Kode top-up dompet: TOP-YYMMDD-<userId>. */
export function kodeTopup(tanggal: string, userId: string): string {
  if (!/^\d{6}$/.test(tanggal) || !userId) throw new Error("kode top-up butuh tanggal YYMMDD dan userId");
  return `TOP-${tanggal}-${userId}`;
}

export function userDariKodeTopup(kode: string): string | undefined {
  const bagian = kode.split("-");
  return bagian.length >= 3 && bagian[0] === "TOP" ? bagian.slice(2).join("-") : undefined;
}

export interface DataPesanan {
  id: string;
  status: string;
  /** Nominal yang seharusnya dibayar pembeli. */
  tagihan: Rupiah;
}

export type Rencana =
  | {
      jenis: "PROSES";
      pesanan: JenisPesanan;
      id: string;
      jurnal: Jurnal;
      statusBaru?: string; // undefined = status tidak diubah (pembayaran ulang / sudah diproses)
    }
  | { jenis: "PERLU_TINJAU"; alasan: string }
  | { jenis: "ABAIKAN"; alasan: string };

const STATUS_AWAL: Record<Exclude<JenisPesanan, "TOP">, { dari: string; ke: string }> = {
  MKT: { dari: "MENUNGGU_BAYAR", ke: "DIBAYAR" },
  JSA: { dari: "MENUNGGU_BAYAR", ke: "MENUNGGU_BATCH" },
  JBY: { dari: "MENUNGGU_BAYAR", ke: "DIBAYAR" },
};

export function rencanakanPembayaranLunas(kode: string, nominal: Rupiah, pesanan: DataPesanan | null): Rencana {
  if (!Number.isInteger(nominal) || nominal <= 0) return { jenis: "PERLU_TINJAU", alasan: `nominal tidak valid: ${nominal}` };
  const jenis = jenisDariKode(kode);
  if (!jenis) return { jenis: "PERLU_TINJAU", alasan: `kode pesanan tidak dikenal: ${kode}` };

  if (jenis === "TOP") {
    const userId = userDariKodeTopup(kode);
    if (!userId) return { jenis: "PERLU_TINJAU", alasan: `kode top-up rusak: ${kode}` };
    return { jenis: "PROSES", pesanan: "TOP", id: userId, jurnal: jurnalTopupDompet(kode, userId, nominal) };
  }

  if (!pesanan) return { jenis: "PERLU_TINJAU", alasan: `pesanan ${kode} tidak ditemukan` };
  if (pesanan.tagihan !== nominal) {
    return { jenis: "PERLU_TINJAU", alasan: `nominal ${kode} tidak cocok: dibayar ${nominal}, tagihan ${pesanan.tagihan}` };
  }
  const s = STATUS_AWAL[jenis];
  if (pesanan.status !== s.dari && pesanan.status !== s.ke) {
    // mis. pesanan sudah KADALUARSA lalu pembeli tetap membayar → uang masuk, perlu refund/aktivasi manual
    return { jenis: "PERLU_TINJAU", alasan: `${kode} dibayar saat status ${pesanan.status}` };
  }
  return {
    jenis: "PROSES",
    pesanan: jenis,
    id: pesanan.id,
    jurnal: jurnalBayarEscrow(pesanan.id, nominal),
    statusBaru: pesanan.status === s.dari ? s.ke : undefined,
  };
}
