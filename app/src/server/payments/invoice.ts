/**
 * Pembuat tagihan (invoice) Xendit & Tripay. `fetch` bisa diganti (injeksi) agar teruji tanpa jaringan.
 * Format API mengikuti dokumentasi publik masing-masing gateway — WAJIB dicek ulang ke dokumen resmi
 * saat akun sandbox sudah ada (STATUS.md langkah 3), sebelum dipakai produksi.
 */
import { createHmac } from "node:crypto";
import { kanalTripaySah, kanalXendit, muatKonfigPembayaran, type KonfigPembayaran } from "../../domain/metodeBayar.ts";

export type Fetch = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export interface PermintaanTagihan {
  kode: string; // merchant_ref / external_id, mis. "JSA-261030-01"
  nominal: number; // integer Rupiah
  deskripsi: string;
  emailPembeli: string;
  namaPembeli: string;
  hpPembeli?: string;
  berlakuMenit: number; // dari config/fee.json timer
  urlKembali?: string;
}

export interface Tagihan {
  gateway: "xendit" | "tripay";
  externalId: string;
  urlBayar: string;
  kadaluarsaAt?: string;
}

function validasi(p: PermintaanTagihan): void {
  if (!Number.isInteger(p.nominal) || p.nominal < 1000) throw new Error("nominal tagihan minimal Rp1.000 dan bulat");
  if (!/^[A-Z]{3}-[\w-]+$/.test(p.kode)) throw new Error(`kode tagihan tidak valid: ${p.kode}`);
  if (!p.emailPembeli.includes("@")) throw new Error("email pembeli tidak valid");
}

// ---------------- Xendit (Invoice API) ----------------
export interface KonfigXendit {
  secretKey: string;
  baseUrl?: string; // default https://api.xendit.co
  pembayaran?: KonfigPembayaran; // default config/pembayaran.json (tanpa kartu)
}

export async function buatTagihanXendit(p: PermintaanTagihan, k: KonfigXendit, f: Fetch = fetch as unknown as Fetch): Promise<Tagihan> {
  validasi(p);
  if (!k.secretKey) throw new Error("XENDIT_SECRET_KEY belum diatur");
  const kanal = kanalXendit(k.pembayaran ?? muatKonfigPembayaran());
  const res = await f(`${k.baseUrl ?? "https://api.xendit.co"}/v2/invoices`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${k.secretKey}:`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: p.kode,
      amount: p.nominal,
      currency: "IDR",
      description: p.deskripsi,
      payer_email: p.emailPembeli,
      customer: { given_names: p.namaPembeli, email: p.emailPembeli, mobile_number: p.hpPembeli },
      invoice_duration: p.berlakuMenit * 60,
      success_redirect_url: p.urlKembali,
      payment_methods: kanal, // hanya metode lokal; kartu kredit/debit tidak tampil
    }),
  });
  const data = (await res.json()) as { id?: string; invoice_url?: string; expiry_date?: string; message?: string };
  if (!res.ok || !data.id || !data.invoice_url) throw new Error(`Xendit menolak tagihan ${p.kode}: ${data.message ?? res.status}`);
  return { gateway: "xendit", externalId: data.id, urlBayar: data.invoice_url, kadaluarsaAt: data.expiry_date };
}

// ---------------- Tripay (Closed Payment) ----------------
export interface KonfigTripay {
  apiKey: string;
  privateKey: string;
  merchantCode: string;
  mode: "sandbox" | "production";
  metode?: string; // mis. "QRIS"
  pembayaran?: KonfigPembayaran; // default config/pembayaran.json (tanpa kartu)
}

export function urlDasarTripay(mode: KonfigTripay["mode"]): string {
  return mode === "production" ? "https://tripay.co.id/api" : "https://tripay.co.id/api-sandbox";
}

/** Signature pembuatan transaksi Tripay: HMAC-SHA256(merchantCode + merchantRef + amount, privateKey). */
export function tandaTanganTransaksiTripay(merchantCode: string, merchantRef: string, amount: number, privateKey: string): string {
  return createHmac("sha256", privateKey).update(`${merchantCode}${merchantRef}${amount}`, "utf8").digest("hex");
}

export async function buatTagihanTripay(p: PermintaanTagihan, k: KonfigTripay, f: Fetch = fetch as unknown as Fetch, now = new Date()): Promise<Tagihan> {
  validasi(p);
  if (!k.apiKey || !k.privateKey || !k.merchantCode) throw new Error("kredensial Tripay belum lengkap");
  const metode = k.metode ?? "QRIS";
  if (!kanalTripaySah(metode, k.pembayaran ?? muatKonfigPembayaran())) throw new Error(`metode Tripay ${metode} tidak diizinkan (config/pembayaran.json)`);
  const res = await f(`${urlDasarTripay(k.mode)}/transaction/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${k.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      method: metode,
      merchant_ref: p.kode,
      amount: p.nominal,
      customer_name: p.namaPembeli,
      customer_email: p.emailPembeli,
      customer_phone: p.hpPembeli,
      order_items: [{ name: p.deskripsi, price: p.nominal, quantity: 1 }],
      return_url: p.urlKembali,
      expired_time: Math.floor(now.getTime() / 1000) + p.berlakuMenit * 60,
      signature: tandaTanganTransaksiTripay(k.merchantCode, p.kode, p.nominal, k.privateKey),
    }),
  });
  const body = (await res.json()) as { success?: boolean; message?: string; data?: { reference?: string; checkout_url?: string; expired_time?: number } };
  if (!res.ok || !body.success || !body.data?.reference || !body.data.checkout_url) {
    throw new Error(`Tripay menolak tagihan ${p.kode}: ${body.message ?? res.status}`);
  }
  return {
    gateway: "tripay",
    externalId: body.data.reference,
    urlBayar: body.data.checkout_url,
    kadaluarsaAt: body.data.expired_time ? new Date(body.data.expired_time * 1000).toISOString() : undefined,
  };
}

/** Pilih gateway dari environment: Xendit bila XENDIT_SECRET_KEY ada, selain itu Tripay. */
export function gatewayAktif(env: Record<string, string | undefined> = process.env): "xendit" | "tripay" | null {
  if (env.XENDIT_SECRET_KEY) return "xendit";
  if (env.TRIPAY_API_KEY && env.TRIPAY_PRIVATE_KEY && env.TRIPAY_MERCHANT_CODE) return "tripay";
  return null;
}
