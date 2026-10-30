import { test } from "node:test";
import assert from "node:assert/strict";
import { kanalTripaySah, kanalXendit, muatKonfigPembayaran, validasiKonfigPembayaran, type KonfigPembayaran } from "./metodeBayar.ts";

const asli = muatKonfigPembayaran();

test("config/pembayaran.json: tanpa kartu, ada QRIS, VA, e-wallet, retail", () => {
  assert.equal(asli.kartu_diizinkan, false);
  for (const j of ["qris", "va", "ewallet", "retail"]) assert.ok(asli.metode.some((m) => m.jenis === j), j);
  assert.ok(!kanalXendit(asli).some((k) => /CARD/.test(k)));
  assert.equal(kanalTripaySah("QRIS", asli), true);
  assert.equal(kanalTripaySah("CC", asli), false);
});

test("validasi menolak kartu diaktifkan, kode kartu, jenis asing, id ganda, tanpa QRIS", () => {
  const ubah = (f: (k: KonfigPembayaran) => void) => { const k = structuredClone(asli); f(k); return () => validasiKonfigPembayaran(k); };
  assert.throws(ubah((k) => { k.kartu_diizinkan = true; }), /kartu/);
  assert.throws(ubah((k) => { k.metode.push({ id: "cc", nama: "Kartu", jenis: "ewallet", xendit: "CREDIT_CARD", tripay: null }); }), /kartu/);
  assert.throws(ubah((k) => { k.metode.push({ id: "x", nama: "X", jenis: "kartu" as never, xendit: null, tripay: null }); }), /jenis/);
  assert.throws(ubah((k) => { k.metode.push({ ...k.metode[0] }); }), /ganda/);
  assert.throws(ubah((k) => { k.metode = k.metode.filter((m) => m.jenis !== "qris"); }), /QRIS/);
});
