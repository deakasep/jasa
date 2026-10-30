import { test } from "node:test";
import assert from "node:assert/strict";
import { muatFeeConfig } from "./config.ts";
import { estimasiRpKeKartu, evaluasiMarkupBank, markupBank, nilaiCheckout, untungBersih } from "./checkout.ts";

const cfg = muatFeeConfig();

test("checkout sama/lebih murah → lanjut", () => {
  assert.deepEqual(nilaiCheckout({ usdDitagih: 22.2, kursJual: 16747.5, checkoutUsd: 22.2 }, cfg), { keputusan: "lanjut", selisihRp: 0 });
  assert.equal(nilaiCheckout({ usdDitagih: 22.2, kursJual: 16747.5, checkoutUsd: 20 }, cfg).keputusan, "lanjut");
});

test("selisih kecil ≤ toleransi ditanggung, besar → pesanan ditahan", () => {
  const kecil = nilaiCheckout({ usdDitagih: 22.2, kursJual: 16747.5, checkoutUsd: 22.4 }, cfg);
  assert.deepEqual(kecil, { keputusan: "tanggung", selisihRp: 3350 });
  const besar = nilaiCheckout({ usdDitagih: 22.2, kursJual: 16747.5, checkoutUsd: 24.42 }, cfg);
  assert.equal(besar.keputusan, "tahan");
  assert.ok(besar.keputusan === "tahan" && besar.pesan.includes("refund penuh"));
});

test("markup bank nyata & peringatan bila melebihi spread", () => {
  assert.ok(Math.abs(markupBank(20, 336600, 16500) - 0.02) < 1e-9);
  assert.equal(evaluasiMarkupBank([0.02, 0.02], cfg).peringatan, null); // data belum cukup
  assert.match(evaluasiMarkupBank(Array(10).fill(0.022), cfg).peringatan!, /tergerus/);
  assert.equal(evaluasiMarkupBank(Array(10).fill(0.01), cfg).peringatan, null);
});

test("untung bersih Claude $10 + PPN (contoh untuk pemilik)", () => {
  const keKartu = estimasiRpKeKartu(11.1, 16500, cfg); // 11,10 × 16.500 × 1,02
  assert.equal(keKartu, 186813);
  const u = untungBersih(236000, keKartu, "qris", cfg);
  assert.deepEqual([u.biayaGateway, u.estimasiPajak, u.bersih], [2402, 1180, 45605]);
  assert.equal(untungBersih(236000, keKartu, "qris", cfg, "fee").estimasiPajak, 246);
});
