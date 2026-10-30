import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { bagianTerlihat, susunDashboard } from "./adminDashboard.ts";
import { daftarPaket, ringkasCheckout } from "./checkoutPatungan.ts";
import { muatFeeConfig } from "./config.ts";
import { dataContohAdmin } from "./contohAdmin.ts";
import type { Katalog } from "./katalog.ts";

const cfg = muatFeeConfig();
const now = new Date("2026-10-30T12:00:00Z");
const katalog = JSON.parse(readFileSync(path.resolve(process.cwd(), "..", "site", "produk.json"), "utf8")) as Katalog;

test("checkout: NFX-4 bulanan = harga slot + 10% + Rp8.000, menunggu batch penuh", () => {
  const r = ringkasCheckout(katalog, "nfx-4", cfg);
  assert.equal(r.kodePaket, "NFX-4");
  assert.equal(r.tagihan.hargaSlot, 47_000);
  assert.equal(r.tagihan.fee, 12_700);
  assert.equal(r.tagihan.total, 59_700);
  assert.equal(r.aksesLangsung, false);
  assert.equal(ringkasCheckout(katalog, "YTB-5", cfg).aksesLangsung, true);
});

test("checkout: diskon memotong harga slot sebelum fee", () => {
  const r = ringkasCheckout(katalog, "NFX-4", cfg, 7_000);
  assert.equal(r.tagihan.fee, 12_000);
  assert.equal(r.tagihan.total, 52_000);
});

test("checkout: menolak paket tidak ada, slot habis, dan layanan jasa bayar", () => {
  assert.throws(() => ringkasCheckout(katalog, "XXX-9", cfg), /tidak ditemukan/);
  const habis: Katalog = { produk: [{ ...katalog.produk[0], paket: [{ ...katalog.produk[0].paket[0], slot_tersedia: 0 }] }] };
  assert.throws(() => ringkasCheckout(habis, katalog.produk[0].paket[0].kode, cfg), /habis/);
  const dialihkan: Katalog = { ...katalog, dialihkan_ke_jasa_bayar: [katalog.produk[0].id] };
  assert.throws(() => ringkasCheckout(dialihkan, katalog.produk[0].paket[0].kode, cfg), /Jasa Bayar/);
  assert.ok(daftarPaket(katalog).length >= katalog.produk.length);
});

test("RBAC: bagian dashboard sesuai peran", () => {
  assert.deepEqual(bagianTerlihat(["owner"]), ["antrian_cron", "batch", "refund"]);
  assert.deepEqual(bagianTerlihat(["admin_ops"]), ["antrian_cron", "batch", "refund"]);
  assert.deepEqual(bagianTerlihat(["finance"]), ["refund"]);
  assert.deepEqual(bagianTerlihat(["cs"]), ["refund"]);
  assert.deepEqual(bagianTerlihat(["kyc_reviewer"]), []);
  assert.deepEqual(bagianTerlihat(["buyer"]), []);
});

test("data contoh memunculkan setiap jenis aksi cron", () => {
  const d = susunDashboard(dataContohAdmin(now), ["owner"], now, cfg);
  const jenis = new Set(d.antrianCron.map((a) => a.jenis));
  for (const j of ["PESANAN_KADALUARSA", "PESANAN_AUTO_SELESAI", "BERI_TAHU_PEMBELI_BOLEH_BATAL", "PERMINTAAN_KADALUARSA",
    "KIRIM_PENGINGAT_RENEWAL", "LEPAS_SLOT", "TAWARKAN_PINDAH_BATCH"] as const) {
    assert.ok(jenis.has(j), `aksi ${j} tidak muncul`);
  }
  assert.ok(d.antrianCron.every((a) => a.label.length > 0));
  assert.equal(d.ringkasan.aksiCron, d.antrianCron.length);
  // pesanan bergaransi 7 hari yang baru dikirim kemarin tidak diselesaikan
  assert.ok(!d.antrianCron.some((a) => a.id === "MKT-CONTOH-004"));
});

test("batch: yang perlu ditawari pindah di atas; auto-provision tidak ditawari", () => {
  const d = susunDashboard(dataContohAdmin(now), ["admin_ops"], now, cfg);
  assert.equal(d.batch[0].id, "NFX-4-B07");
  assert.equal(d.batch[0].perluTawaran, true);
  assert.equal(d.batch.find((b) => b.id === "YTB-5-B03")?.perluTawaran, false);
  assert.equal(d.batch.find((b) => b.id === "YTB-5-B03")?.aksesBolehDikirim, true);
  assert.equal(d.batch.find((b) => b.id === "NFX-4-B08")?.aksesBolehDikirim, false);
  assert.equal(d.ringkasan.batchBuka, 3);
  assert.equal(d.ringkasan.batchPerluTawaran, 1);
});

test("refund: batas ops Rp500.000 dan empat mata", () => {
  const ops = susunDashboard(dataContohAdmin(now), ["admin_ops"], now, cfg);
  const besar = ops.refund.find((r) => r.kode === "RFD-CONTOH-02");
  const kecil = ops.refund.find((r) => r.kode === "RFD-CONTOH-01");
  assert.equal(besar?.bolehSetujui, false);
  assert.match(besar?.catatan ?? "", /finance\/owner/);
  assert.equal(kecil?.bolehSetujui, true);
  assert.equal(kecil?.empatMata, false);

  const fin = susunDashboard(dataContohAdmin(now), ["finance"], now, cfg);
  const besarFin = fin.refund.find((r) => r.kode === "RFD-CONTOH-02");
  assert.equal(besarFin?.bolehSetujui, true);
  assert.equal(besarFin?.empatMata, true);
  assert.equal(fin.antrianCron.length, 0);
  assert.equal(fin.batch.length, 0);

  const cs = susunDashboard(dataContohAdmin(now), ["cs"], now, cfg);
  assert.ok(cs.refund.every((r) => !r.bolehSetujui));
  assert.equal(cs.ringkasan.nominalRefund, 1_309_700);
});

test("peran tanpa izin tidak melihat apa pun", () => {
  const d = susunDashboard(dataContohAdmin(now), ["buyer"], now, cfg);
  assert.deepEqual(d.bagian, []);
  assert.equal(d.antrianCron.length + d.batch.length + d.refund.length, 0);
  assert.deepEqual(d.ringkasan, { aksiCron: 0, batchBuka: 0, batchPerluTawaran: 0, refundMenunggu: 0, nominalRefund: 0 });
});
