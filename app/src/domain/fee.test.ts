import { test } from "node:test";
import assert from "node:assert/strict";
import { muatFeeConfig } from "./config.ts";
import { connectionFeeHost, feeJasaBayar, feeJoiner, feeSeller, hargaPerSlot, quoteJasaBayar } from "./fee.ts";

const cfg = muatFeeConfig();

// Vektor uji = contoh resmi joinbareng; harus sama dengan scripts/qa_check.py (paritas Python ↔ TypeScript).
test("fee joiner bulanan: contoh Netflix Rp46.500 → Rp12.650", () => {
  assert.equal(feeJoiner(46500, "bulanan", cfg), 12650);
  assert.equal(46500 + feeJoiner(46500, "bulanan", cfg), 59150);
});

test("fee joiner bulanan: Rp50.000 → Rp13.000 (contoh S&K)", () => {
  assert.equal(feeJoiner(50000, "bulanan", cfg), 13000);
});

test("fee joiner tahunan dihitung per bulan × 12", () => {
  assert.equal(feeJoiner(600000, "tahunan", cfg), 12 * 16500);
});

test("connection fee host: 25% maks Rp5.000, 20% maks Rp6.000, pribadi 0", () => {
  assert.equal(connectionFeeHost(46500, "bulanan", cfg), 5000);
  assert.equal(connectionFeeHost(15000, "bulanan", cfg), 3750);
  assert.equal(connectionFeeHost(600000, "tahunan", cfg), 6000);
  assert.equal(connectionFeeHost(46500, "bulanan", cfg, true), 0);
});

test("harga per slot dibulatkan ke atas ribuan", () => {
  assert.equal(hargaPerSlot(186000, 4), 47000);
  assert.equal(hargaPerSlot(119000, 3), 40000);
  assert.equal(hargaPerSlot(150000, 10), 15000);
  assert.throws(() => hargaPerSlot(1000, 0));
});

test("jasa bayar: tier flat < $70, 4% $70–500, 3,5% > $500", () => {
  const kurs = 16000;
  assert.equal(quoteJasaBayar(69, kurs, cfg).fee, 50000);
  for (const [usd, persen] of [[70, 0.04], [500, 0.04], [501, 0.035]] as const) {
    const q = quoteJasaBayar(usd, kurs, cfg);
    assert.equal(q.fee, Math.round(q.hargaRp * persen), `usd ${usd}`);
  }
  assert.equal(quoteJasaBayar(10, 10000, cfg).kursJual, 10150);
  assert.equal(feeJasaBayar(20, 334950, cfg), 50000);
});

test("jasa bayar: total dibulatkan ke atas ribuan & spread 1,5%", () => {
  const q = quoteJasaBayar(20, 16500, cfg);
  assert.equal(q.total % 1000, 0);
  assert.equal(q.spreadRp, Math.round(20 * 16500 * 0.015));
});

test("fee seller 5% minimal Rp1.000", () => {
  assert.equal(feeSeller(13000, cfg), 1000);
  assert.equal(feeSeller(50000, cfg), 2500);
});

test("menolak nominal pecahan / negatif", () => {
  assert.throws(() => feeJoiner(100.5, "bulanan", cfg));
  assert.throws(() => feeSeller(-1, cfg));
});
