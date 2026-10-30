/** Kode pesanan manusiawi: JSA-YYMMDD-NN (patungan), JBY-YYMMDD-NN (jasa bayar), MKT-YYMMDD-NNN (marketplace). */
export type Prefix = "JSA" | "JBY" | "MKT" | "PAY" | "RFD";

/** Tanggal dalam zona waktu bisnis (default Asia/Makassar, UTC+8) agar kode sesuai hari lokal. */
export function tanggalLokal(now: Date, offsetMenit = 8 * 60): string {
  const d = new Date(now.getTime() + offsetMenit * 60_000);
  const yy = String(d.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function buatKode(prefix: Prefix, now: Date, urutanHariIni: number, offsetMenit = 8 * 60): string {
  if (!Number.isInteger(urutanHariIni) || urutanHariIni < 1) throw new Error("urutan mulai dari 1");
  const lebar = prefix === "MKT" ? 3 : 2;
  return `${prefix}-${tanggalLokal(now, offsetMenit)}-${String(urutanHariIni).padStart(lebar, "0")}`;
}

export function kodeValid(kode: string): boolean {
  return /^(JSA|JBY|PAY|RFD)-\d{6}-\d{2,}$|^MKT-\d{6}-\d{3,}$/.test(kode);
}

/** Sensor nama untuk ticker & daftar anggota: "Ahmad Rizal" → "Ahm** Ri***". */
export function samarkanNama(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((k) => (k.length <= 2 ? k[0] + "*" : k.slice(0, Math.min(3, Math.ceil(k.length / 2))) + "*".repeat(k.length - Math.min(3, Math.ceil(k.length / 2)))))
    .join(" ");
}
