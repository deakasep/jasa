import { test } from "node:test";
import assert from "node:assert/strict";
import { statusTripay, statusXendit, tandaTanganTripay, verifikasiTripay, verifikasiXendit } from "./verify.ts";

test("xendit: token cocok diterima, salah/kosong ditolak", () => {
  assert.equal(verifikasiXendit("tok_benar", "tok_benar"), true);
  assert.equal(verifikasiXendit("tok_salah", "tok_benar"), false);
  assert.equal(verifikasiXendit(null, "tok_benar"), false);
  assert.throws(() => verifikasiXendit("x", ""));
});

test("tripay: HMAC-SHA256 raw body; body diubah = ditolak; event lain ditolak", () => {
  const key = "kunci-uji-bukan-asli";
  const body = JSON.stringify({ merchant_ref: "JSA-261030-01", status: "PAID", total_amount: 59150 });
  const sig = tandaTanganTripay(body, key);
  assert.equal(verifikasiTripay(body, sig, key, "payment_status"), true);
  assert.equal(verifikasiTripay(body.replace("59150", "1"), sig, key), false);
  assert.equal(verifikasiTripay(body, sig, key, "lainnya"), false);
  assert.equal(verifikasiTripay(body, undefined, key), false);
});

test("normalisasi status", () => {
  assert.equal(statusXendit("PAID"), "LUNAS");
  assert.equal(statusXendit("expired"), "KADALUARSA");
  assert.equal(statusTripay("UNPAID"), "MENUNGGU");
  assert.equal(statusTripay("PAID"), "LUNAS");
});
