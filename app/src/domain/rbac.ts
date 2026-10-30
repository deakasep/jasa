/** Hak akses berbasis peran + aturan empat mata (maker–checker). Lihat docs/21-enterprise.md §2. */
import type { Rupiah } from "./money.ts";

export type Peran = "owner" | "finance" | "admin_ops" | "cs" | "kyc_reviewer" | "host" | "seller" | "buyer";

export type Aksi =
  | "pesanan.lihat_semua"
  | "pesanan.proses"
  | "batch.kelola"
  | "refund.ajukan"
  | "refund.setujui"
  | "payout.setujui"
  | "ledger.lihat"
  | "ledger.koreksi"
  | "fee.ubah"
  | "katalog.ubah"
  | "listing.moderasi"
  | "kyc.lihat"
  | "kyc.putuskan"
  | "kredensial_induk.lihat"
  | "peran.kelola"
  | "data.ekspor"
  | "data.hapus"
  | "chat.cs"
  | "audit.lihat";

const IZIN: Record<Peran, readonly Aksi[]> = {
  owner: [
    "pesanan.lihat_semua", "pesanan.proses", "batch.kelola", "refund.ajukan", "refund.setujui", "payout.setujui", "ledger.lihat",
    "ledger.koreksi", "fee.ubah", "katalog.ubah", "listing.moderasi", "kyc.lihat", "kyc.putuskan", "kredensial_induk.lihat",
    "peran.kelola", "data.ekspor", "data.hapus", "chat.cs", "audit.lihat",
  ],
  finance: ["pesanan.lihat_semua", "refund.ajukan", "refund.setujui", "payout.setujui", "ledger.lihat", "audit.lihat"],
  admin_ops: ["pesanan.lihat_semua", "pesanan.proses", "batch.kelola", "refund.ajukan", "refund.setujui", "katalog.ubah", "listing.moderasi", "kredensial_induk.lihat", "chat.cs"],
  cs: ["pesanan.lihat_semua", "refund.ajukan", "chat.cs"],
  kyc_reviewer: ["kyc.lihat", "kyc.putuskan"],
  host: [],
  seller: [],
  buyer: [],
};

/** Batas refund yang boleh disetujui admin_ops sendiri; di atasnya butuh finance/owner. */
export const BATAS_REFUND_OPS: Rupiah = 500_000;

/** Aksi yang wajib empat mata (pengaju ≠ penyetuju). */
const EMPAT_MATA: readonly Aksi[] = ["payout.setujui", "fee.ubah", "data.hapus", "kredensial_induk.lihat", "ledger.koreksi"];

export function boleh(peran: readonly Peran[], aksi: Aksi, ctx: { nominal?: Rupiah } = {}): boolean {
  const punya = peran.some((p) => IZIN[p].includes(aksi));
  if (!punya) return false;
  if (aksi === "refund.setujui" && (ctx.nominal ?? 0) > BATAS_REFUND_OPS) {
    return peran.includes("finance") || peran.includes("owner");
  }
  return true;
}

export function butuhEmpatMata(aksi: Aksi, ctx: { nominal?: Rupiah } = {}): boolean {
  return EMPAT_MATA.includes(aksi) || (aksi === "refund.setujui" && (ctx.nominal ?? 0) > BATAS_REFUND_OPS);
}

export interface Persetujuan {
  aksi: Aksi;
  pengajuId: string;
  penyetujuId: string;
  diajukanAt: Date;
  disetujuiAt: Date;
}

/**
 * Validasi empat mata. Mode satu-orang (belum ada tim): pengaju = penyetuju diizinkan HANYA jika ada jeda ≥ 1 jam
 * dan alasan tertulis (dicatat audit). Lihat docs/21-enterprise.md §2.
 */
export function validasiEmpatMata(p: Persetujuan, opsi: { modeSatuOrang: boolean; alasan?: string }): { ok: true } | { ok: false; alasan: string } {
  if (p.pengajuId !== p.penyetujuId) return { ok: true };
  if (!opsi.modeSatuOrang) return { ok: false, alasan: "pengaju dan penyetuju harus orang berbeda" };
  if (!opsi.alasan?.trim()) return { ok: false, alasan: "mode satu orang wajib mencantumkan alasan" };
  if (p.disetujuiAt.getTime() - p.diajukanAt.getTime() < 3600_000) return { ok: false, alasan: "mode satu orang wajib jeda minimal 1 jam" };
  return { ok: true };
}

/** Pemilik data selalu boleh mengakses miliknya sendiri. */
export function bolehAksesMilik(userId: string, pemilikId: string, peran: readonly Peran[]): boolean {
  return userId === pemilikId || boleh(peran, "pesanan.lihat_semua");
}
