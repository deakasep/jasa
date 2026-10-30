/**
 * Verifikasi webhook payment gateway. Tanpa verifikasi, siapa pun bisa memalsukan "pembayaran sukses".
 *  - Xendit: header `x-callback-token` harus sama dengan token callback di dashboard Xendit.
 *  - Tripay: header `X-Callback-Signature` = HMAC-SHA256(rawBody, privateKey) dalam hex; header `X-Callback-Event` = "payment_status".
 * Selalu bandingkan dengan timingSafeEqual dan pakai RAW body (sebelum JSON.parse).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function samaAman(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function verifikasiXendit(headerToken: string | null | undefined, tokenRahasia: string): boolean {
  if (!tokenRahasia) throw new Error("XENDIT_CALLBACK_TOKEN belum diatur");
  if (!headerToken) return false;
  return samaAman(headerToken, tokenRahasia);
}

export function tandaTanganTripay(rawBody: string, privateKey: string): string {
  return createHmac("sha256", privateKey).update(rawBody, "utf8").digest("hex");
}

export function verifikasiTripay(rawBody: string, headerSignature: string | null | undefined, privateKey: string, headerEvent?: string | null): boolean {
  if (!privateKey) throw new Error("TRIPAY_PRIVATE_KEY belum diatur");
  if (!headerSignature) return false;
  if (headerEvent !== undefined && headerEvent !== null && headerEvent !== "payment_status") return false;
  return samaAman(headerSignature.toLowerCase(), tandaTanganTripay(rawBody, privateKey));
}

/** Normalisasi status dari gateway ke status internal. */
export type StatusBayar = "LUNAS" | "GAGAL" | "KADALUARSA" | "MENUNGGU";

export function statusXendit(s: string): StatusBayar {
  switch (s.toUpperCase()) {
    case "PAID":
    case "SETTLED":
    case "SUCCEEDED":
    case "COMPLETED":
      return "LUNAS";
    case "EXPIRED":
      return "KADALUARSA";
    case "FAILED":
      return "GAGAL";
    default:
      return "MENUNGGU";
  }
}

export function statusTripay(s: string): StatusBayar {
  switch (s.toUpperCase()) {
    case "PAID":
      return "LUNAS";
    case "EXPIRED":
      return "KADALUARSA";
    case "FAILED":
    case "REFUND":
      return "GAGAL";
    default:
      return "MENUNGGU";
  }
}
