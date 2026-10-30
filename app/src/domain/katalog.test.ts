import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { aksesAutoProvision, katalogKeBaris, type Katalog } from "./katalog.ts";

const katalogAsli = JSON.parse(readFileSync(path.resolve(process.cwd(), "..", "site", "produk.json"), "utf8")) as Katalog;

test("katalog asli site/produk.json bisa di-seed tanpa error", () => {
  const { services, packages } = katalogKeBaris(katalogAsli);
  assert.ok(services.length >= 1);
  assert.ok(packages.length >= services.length);
  const nfx = packages.find((p) => p.kode === "NFX-4");
  assert.ok(nfx);
  assert.equal(nfx.hargaPerSlot, 47000);
  assert.equal(nfx.autoProvision, false); // akun bersama → tunggu batch penuh
  assert.equal(packages.find((p) => p.kode === "YTB-5")?.autoProvision, true); // undangan family
});

test("auto-provision hanya untuk akses undangan/seat", () => {
  assert.equal(aksesAutoProvision("undangan family ke akun Google sendiri"), true);
  assert.equal(aksesAutoProvision("Family Sharing ke Apple ID sendiri"), true);
  assert.equal(aksesAutoProvision("akun bersama, 1 profil + PIN per slot"), false);
});

test("menolak kode ganda, harga slot salah, dan layanan jasa bayar", () => {
  const dasar = (paket: object[], id = "x"): Katalog => ({ produk: [{ id, nama: "X", kategori: "SVOD", akses: "akun bersama", aturan: [], paket: paket as never }] });
  const p = { kode: "X-4", slot: 4, periode: "bulanan", harga_plan_resmi: 100000, harga_per_slot: 25000, slot_tersedia: 4 };
  assert.throws(() => katalogKeBaris(dasar([p, p])), /ganda/);
  assert.throws(() => katalogKeBaris(dasar([{ ...p, harga_per_slot: 20000 }])), /harga_per_slot/);
  assert.throws(() => katalogKeBaris({ ...dasar([p], "claude"), dialihkan_ke_jasa_bayar: ["claude"] }), /jasa bayar/);
});
