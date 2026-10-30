import { test } from "node:test";
import assert from "node:assert/strict";
import { muatFeeConfig } from "./config.ts";
import { median, pilihKurs, type KandidatKurs } from "./kurs.ts";

const cfg = muatFeeConfig();
const now = new Date("2026-10-30T10:00:00Z");
const jam = (h: number) => new Date(now.getTime() - h * 3_600_000);
const k = (sumber: string, nilai: number, umurJam = 2): KandidatKurs => ({ sumber, nilai, waktu: jam(umurJam) });

test("median dua sumber dipakai, beda kecil tanpa peringatan", () => {
  const h = pilihKurs([k("frankfurter", 16500), k("erapi", 16520)], { nilai: 16480, waktu: jam(24), sumber: "x" }, now, cfg);
  assert.equal(h.status, "baru");
  assert.ok(h.status === "baru" && h.kurs.nilai === 16510 && h.kurs.sumber === "erapi+frankfurter");
  assert.deepEqual(h.peringatan, []);
  assert.equal(median([3, 1, 2]), 2);
});

test("angka rusak & data basi diabaikan", () => {
  const h = pilihKurs([k("a", 1.65), k("b", 1_650_000), k("c", 16500, 48), k("d", 16490)], null, now, cfg);
  assert.ok(h.status === "baru" && h.kurs.nilai === 16490);
  assert.equal(h.peringatan.length, 3);
});

test("lonjakan > 2% ditahan: pakai kurs terakhir + peringatan", () => {
  const terakhir = { nilai: 16500, waktu: jam(3), sumber: "x" };
  const h = pilihKurs([k("a", 17200), k("b", 17210)], terakhir, now, cfg);
  assert.equal(h.status, "pakai_terakhir");
  assert.ok(h.status === "pakai_terakhir" && h.kurs.nilai === 16500);
  assert.ok(h.peringatan.some((p) => p.includes("melonjak")));
});

test("sumber mati: pakai kurs terakhir selama belum basi, lalu harga otomatis mati", () => {
  assert.equal(pilihKurs([], { nilai: 16500, waktu: jam(10), sumber: "x" }, now, cfg).status, "pakai_terakhir");
  const h = pilihKurs([], { nilai: 16500, waktu: jam(40), sumber: "x" }, now, cfg);
  assert.equal(h.status, "tidak_ada");
  assert.equal(pilihKurs([], null, now, cfg).status, "tidak_ada");
});

test("beda antar sumber > 1% diberi peringatan", () => {
  const h = pilihKurs([k("a", 16300), k("b", 16600)], null, now, cfg);
  assert.ok(h.peringatan.some((p) => p.includes("beda antar sumber")));
});
