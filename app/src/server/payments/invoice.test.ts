import { test } from "node:test";
import assert from "node:assert/strict";
import { buatTagihanTripay, buatTagihanXendit, gatewayAktif, tandaTanganTransaksiTripay, urlDasarTripay, type Fetch } from "./invoice.ts";

const minta = { kode: "JSA-261030-01", nominal: 59150, deskripsi: "Netflix Premium 4 user (bulanan)", emailPembeli: "pembeli@contoh.id", namaPembeli: "Pembeli Uji", berlakuMenit: 30 };

function palsu(respons: unknown, ok = true) {
  const panggilan: { url: string; init: { headers: Record<string, string>; body: string } }[] = [];
  const f: Fetch = async (url, init) => {
    panggilan.push({ url, init });
    return { ok, status: ok ? 200 : 400, json: async () => respons };
  };
  return { f, panggilan };
}

test("xendit: kirim body & auth benar, kembalikan url bayar", async () => {
  const { f, panggilan } = palsu({ id: "inv_1", invoice_url: "https://checkout.xendit.co/x", expiry_date: "2026-10-30T05:00:00Z" });
  const t = await buatTagihanXendit(minta, { secretKey: "xnd_development_uji" }, f);
  assert.deepEqual(t, { gateway: "xendit", externalId: "inv_1", urlBayar: "https://checkout.xendit.co/x", kadaluarsaAt: "2026-10-30T05:00:00Z" });
  assert.equal(panggilan[0].url, "https://api.xendit.co/v2/invoices");
  assert.equal(panggilan[0].init.headers.Authorization, "Basic " + Buffer.from("xnd_development_uji:").toString("base64"));
  const body = JSON.parse(panggilan[0].init.body);
  assert.equal(body.external_id, "JSA-261030-01");
  assert.equal(body.amount, 59150);
  assert.equal(body.invoice_duration, 1800);
});

test("xendit: halaman bayar hanya metode lokal, tanpa kartu kredit", async () => {
  const { f, panggilan } = palsu({ id: "inv_2", invoice_url: "https://checkout.xendit.co/y" });
  await buatTagihanXendit(minta, { secretKey: "x" }, f);
  const kanal: string[] = JSON.parse(panggilan[0].init.body).payment_methods;
  assert.ok(kanal.includes("QRIS") && kanal.includes("BCA") && kanal.includes("INDOMARET"));
  assert.ok(!kanal.some((k) => /CARD/.test(k)));
});

test("tripay: kanal kartu kredit / tidak terdaftar ditolak sebelum ke gateway", async () => {
  const { f, panggilan } = palsu({ success: true, data: { reference: "T", checkout_url: "u" } });
  const k = { apiKey: "a", privateKey: "b", merchantCode: "c", mode: "sandbox" as const };
  await assert.rejects(buatTagihanTripay(minta, { ...k, metode: "CC" }, f), /tidak diizinkan/);
  await assert.rejects(buatTagihanTripay(minta, { ...k, metode: "XYZVA" }, f), /tidak diizinkan/);
  assert.equal(panggilan.length, 0);
  await buatTagihanTripay(minta, { ...k, metode: "BRIVA" }, f);
  assert.equal(JSON.parse(panggilan[0].init.body).method, "BRIVA");
});

test("xendit: tolakan gateway & input salah jadi error jelas", async () => {
  const { f } = palsu({ message: "INVALID_API_KEY" }, false);
  await assert.rejects(buatTagihanXendit(minta, { secretKey: "x" }, f), /INVALID_API_KEY/);
  await assert.rejects(buatTagihanXendit({ ...minta, nominal: 100.5 }, { secretKey: "x" }, f), /nominal/);
  await assert.rejects(buatTagihanXendit(minta, { secretKey: "" }, f), /XENDIT_SECRET_KEY/);
});

test("tripay: signature HMAC(merchant+ref+amount), url sandbox, kadaluarsa 30 menit", async () => {
  const now = new Date("2026-10-30T04:00:00Z");
  const { f, panggilan } = palsu({ success: true, data: { reference: "T123", checkout_url: "https://tripay.co.id/checkout/T123", expired_time: 1793336400 } });
  const k = { apiKey: "DEV-uji", privateKey: "kunci-uji", merchantCode: "T0001", mode: "sandbox" as const };
  const t = await buatTagihanTripay(minta, k, f, now);
  assert.equal(t.externalId, "T123");
  assert.equal(panggilan[0].url, "https://tripay.co.id/api-sandbox/transaction/create");
  const body = JSON.parse(panggilan[0].init.body);
  assert.equal(body.signature, tandaTanganTransaksiTripay("T0001", "JSA-261030-01", 59150, "kunci-uji"));
  assert.equal(body.expired_time, Math.floor(now.getTime() / 1000) + 1800);
  assert.equal(body.method, "QRIS");
  assert.equal(urlDasarTripay("production"), "https://tripay.co.id/api");
});

test("tripay: success=false ditolak", async () => {
  const { f } = palsu({ success: false, message: "Invalid signature" });
  await assert.rejects(buatTagihanTripay(minta, { apiKey: "a", privateKey: "b", merchantCode: "c", mode: "sandbox" }, f), /Invalid signature/);
});

test("pilih gateway dari env", () => {
  assert.equal(gatewayAktif({ XENDIT_SECRET_KEY: "x" }), "xendit");
  assert.equal(gatewayAktif({ TRIPAY_API_KEY: "a", TRIPAY_PRIVATE_KEY: "b", TRIPAY_MERCHANT_CODE: "c" }), "tripay");
  assert.equal(gatewayAktif({}), null);
});
