import { test } from "node:test";
import assert from "node:assert/strict";
import { muatFeeConfig } from "./config.ts";
import { bolehBatalPembeli, hitungPenyelesaian, majukanWaktu, terapkan, TransisiTidakSah, type Pesanan } from "./escrow.ts";

const cfg = muatFeeConfig();
const t0 = new Date("2026-11-01T00:00:00Z");
const jam = (h: number) => new Date(t0.getTime() + h * 3600_000);

const baru = (over: Partial<Pesanan> = {}): Pesanan => ({
  id: "O1", total: 50000, status: "MENUNGGU_BAYAR", metodeBayar: "qris", batasKirimJam: 24, garansiHari: 0, dibuatAt: t0, ...over,
});

test("alur normal: bayar → kirim → konfirmasi → selesai, fee 5%", () => {
  let p = terapkan(baru(), { tipe: "BAYAR", at: jam(0.1) }, cfg);
  p = terapkan(p, { tipe: "KIRIM", at: jam(0.5) }, cfg);
  p = terapkan(p, { tipe: "KONFIRMASI_PEMBELI", at: jam(2) }, cfg);
  assert.equal(p.status, "SELESAI");
  assert.deepEqual(hitungPenyelesaian(p, cfg), { refundKePembeli: 0, kePenjual: 47500, feePlatform: 2500 });
});

test("QRIS tidak dibayar 30 menit → kadaluarsa", () => {
  assert.equal(majukanWaktu(baru(), jam(1), cfg).status, "KADALUARSA");
  assert.equal(terapkan(baru(), { tipe: "BAYAR", at: jam(1) }, cfg).status, "KADALUARSA");
});

test("M1: seller diam > 1 jam → pembeli boleh batal, refund penuh", () => {
  const p = terapkan(baru(), { tipe: "BAYAR", at: jam(0) }, cfg);
  assert.equal(bolehBatalPembeli(p, jam(0.5), cfg), false);
  assert.equal(bolehBatalPembeli(p, jam(1.1), cfg), true);
  const b = terapkan(p, { tipe: "BATAL_PEMBELI", at: jam(1.1) }, cfg);
  assert.equal(b.status, "DIBATALKAN");
  assert.deepEqual(hitungPenyelesaian(b, cfg), { refundKePembeli: 50000, kePenjual: 0, feePlatform: 0 });
});

test("M2: seller merespons tapi lewat batas kirim → boleh batal", () => {
  let p = terapkan(baru({ batasKirimJam: 6 }), { tipe: "BAYAR", at: jam(0) }, cfg);
  p = terapkan(p, { tipe: "SELLER_RESPON", at: jam(0.2) }, cfg);
  assert.equal(bolehBatalPembeli(p, jam(5), cfg), false);
  assert.equal(bolehBatalPembeli(p, jam(6.5), cfg), true);
});

test("batas kirim listing dibatasi maks 24 jam", () => {
  let p = terapkan(baru({ batasKirimJam: 72 }), { tipe: "BAYAR", at: jam(0) }, cfg);
  p = terapkan(p, { tipe: "SELLER_RESPON", at: jam(0.2) }, cfg);
  assert.equal(bolehBatalPembeli(p, jam(25), cfg), true);
});

test("M3: masa cek 3 hari habis tanpa laporan → auto selesai; bergaransi 7 hari", () => {
  let p = terapkan(baru(), { tipe: "BAYAR", at: jam(0) }, cfg);
  p = terapkan(p, { tipe: "KIRIM", at: jam(1) }, cfg);
  assert.equal(majukanWaktu(p, jam(1 + 71), cfg).status, "DIKIRIM");
  assert.equal(majukanWaktu(p, jam(1 + 73), cfg).status, "SELESAI");
  let g = terapkan(baru({ garansiHari: 7 }), { tipe: "BAYAR", at: jam(0) }, cfg);
  g = terapkan(g, { tipe: "KIRIM", at: jam(1) }, cfg);
  assert.equal(majukanWaktu(g, jam(1 + 24 * 6), cfg).status, "DIKIRIM");
  assert.equal(majukanWaktu(g, jam(1 + 24 * 7 + 1), cfg).status, "SELESAI");
});

test("M4: sengketa → refund sebagian; fee hanya dari bagian penjual", () => {
  let p = terapkan(baru({ total: 100000 }), { tipe: "BAYAR", at: jam(0) }, cfg);
  p = terapkan(p, { tipe: "KIRIM", at: jam(1) }, cfg);
  p = terapkan(p, { tipe: "LAPOR_MASALAH", at: jam(5) }, cfg);
  assert.equal(p.status, "SENGKETA");
  p = terapkan(p, { tipe: "PUTUSAN", at: jam(20), putusan: "REFUND_SEBAGIAN", nominalRefund: 40000 }, cfg);
  assert.deepEqual(hitungPenyelesaian(p, cfg), { refundKePembeli: 40000, kePenjual: 57000, feePlatform: 3000 });
});

test("sengketa → kirim ulang membuka masa cek baru", () => {
  let p = terapkan(baru(), { tipe: "BAYAR", at: jam(0) }, cfg);
  p = terapkan(p, { tipe: "KIRIM", at: jam(1) }, cfg);
  p = terapkan(p, { tipe: "LAPOR_MASALAH", at: jam(2) }, cfg);
  p = terapkan(p, { tipe: "PUTUSAN", at: jam(10), putusan: "KIRIM_ULANG" }, cfg);
  assert.equal(p.status, "DIKIRIM");
  assert.equal(majukanWaktu(p, jam(10 + 71), cfg).status, "DIKIRIM");
});

test("transisi tidak sah ditolak", () => {
  assert.throws(() => terapkan(baru(), { tipe: "KIRIM", at: jam(0) }, cfg), TransisiTidakSah);
  let p = terapkan(baru(), { tipe: "BAYAR", at: jam(0) }, cfg);
  assert.throws(() => terapkan(p, { tipe: "BATAL_PEMBELI", at: jam(0.2) }, cfg), TransisiTidakSah);
  p = terapkan(p, { tipe: "KIRIM", at: jam(1) }, cfg);
  assert.throws(() => terapkan(p, { tipe: "LAPOR_MASALAH", at: jam(1 + 24 * 4) }, cfg), TransisiTidakSah);
  assert.throws(() => hitungPenyelesaian(p, cfg));
});
