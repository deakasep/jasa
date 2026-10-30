/** Catatan audit append-only (docs/21-enterprise.md §3). Nilai sensitif disamarkan sebelum disimpan. */
export interface EntriAudit {
  aktorId: string;
  peran: string[];
  aksi: string;
  objek: string; // mis. "pesanan:MKT-261030-001"
  sebelum?: unknown;
  sesudah?: unknown;
  alasan?: string;
  ip?: string;
  at: Date;
}

const KUNCI_SENSITIF = /(password|sandi|pin|token|secret|kredensial|credential|ktp|nik|rekening|nomor_rek|card|kartu|otp)/i;

export function samarkan(nilai: unknown): unknown {
  if (Array.isArray(nilai)) return nilai.map(samarkan);
  if (nilai && typeof nilai === "object" && !(nilai instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(nilai as Record<string, unknown>)) {
      out[k] = KUNCI_SENSITIF.test(k) ? "[disamarkan]" : samarkan(v);
    }
    return out;
  }
  return nilai;
}

export function buatAudit(e: EntriAudit): EntriAudit {
  if (!e.aktorId || !e.aksi || !e.objek) throw new Error("audit wajib berisi aktorId, aksi, objek");
  return { ...e, sebelum: samarkan(e.sebelum), sesudah: samarkan(e.sesudah) };
}

/** Aksi yang wajib dicatat. */
export const AKSI_WAJIB_AUDIT = [
  "admin.login", "peran.ubah", "saldo.koreksi", "refund.putus", "sengketa.putus", "kyc.putus", "kredensial.akses",
  "data.ekspor", "data.hapus", "fee.ubah", "payout.setujui",
] as const;
