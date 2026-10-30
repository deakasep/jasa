/** Uang selalu integer Rupiah. Tidak ada float yang disimpan. */
export type Rupiah = number;

export function pastikanRupiah(n: number, nama = "nominal"): Rupiah {
  if (!Number.isInteger(n)) throw new Error(`${nama} harus bilangan bulat Rupiah, dapat ${n}`);
  if (n < 0) throw new Error(`${nama} tidak boleh negatif, dapat ${n}`);
  return n;
}

/** Bulatkan ke atas ke kelipatan Rp1.000 (sama dengan scripts/hitung.py ribuan()). */
export function ribuanAtas(x: number): Rupiah {
  return Math.ceil(Number((x / 1000).toFixed(6))) * 1000;
}

/** Pembulatan setengah-ke-genap seperti round() Python, supaya hasil sama persis dengan skrip. */
export function bulatkan(x: number): Rupiah {
  const r = Math.round(x * 1e6) / 1e6;
  const bawah = Math.floor(r);
  const sisa = r - bawah;
  if (Math.abs(sisa - 0.5) < 1e-9) return bawah % 2 === 0 ? bawah : bawah + 1;
  return Math.round(r);
}

export function formatRp(n: number): string {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}
