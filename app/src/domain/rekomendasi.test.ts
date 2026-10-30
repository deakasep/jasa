import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { listingGameDiizinkan, ratingTerkoreksi, urutkanRekomendasi, validasiAturan, type AturanRekomendasi, type GameFokus, type ListingSkor } from "./rekomendasi.ts";

const data = JSON.parse(readFileSync(path.resolve(process.cwd(), "..", "data", "kategori-marketplace.json"), "utf8")) as {
  urutan: string[];
  rekomendasi: AturanRekomendasi;
  game_fokus: { game: GameFokus[] };
  kategori: { slug: string; aktif: boolean }[];
};
const a = data.rekomendasi;
const L = (id: string, o: Partial<ListingSkor> = {}): ListingSkor => ({ id, terjual30Hari: 10, ratingRata: 4.5, jumlahUlasan: 20, skorKepercayaanSeller: 80, medianResponMenit: 5, ...o });

test("data asli: Rekomendasi jadi tab pertama, bobot sah, game fokus memakai kategori aktif", () => {
  assert.equal(data.urutan[0], "rekomendasi");
  validasiAturan(a);
  const aktif = new Set(data.kategori.filter((k) => k.aktif).map((k) => k.slug));
  assert.ok(data.game_fokus.game.length <= 10, "game fokus dibatasi supaya item tidak terlalu banyak");
  for (const g of data.game_fokus.game) for (const k of g.kategori) assert.ok(aktif.has(k), `${g.slug}: kategori ${k} tidak aktif`);
});

test("rating sedikit ulasan ditarik ke prior", () => {
  assert.ok(ratingTerkoreksi(L("a", { ratingRata: 5, jumlahUlasan: 1 }), a) < ratingTerkoreksi(L("b", { ratingRata: 4.8, jumlahUlasan: 200 }), a));
});

test("urutan: laris + rating + seller tepercaya + respon cepat menang; seller di bawah ambang dikeluarkan", () => {
  const hasil = urutkanRekomendasi([
    L("lambat", { medianResponMenit: 60 }),
    L("juara", { terjual30Hari: 300, ratingRata: 4.9, jumlahUlasan: 150 }),
    L("tidak-dipercaya", { terjual30Hari: 999, skorKepercayaanSeller: 20 }),
    L("baru", { terjual30Hari: 0, jumlahUlasan: 0, ratingRata: 0, medianResponMenit: null }),
  ], a).map((l) => l.id);
  assert.deepEqual(hasil, ["juara", "lambat", "baru"]);
});

test("bobot tidak berjumlah 1 ditolak", () => {
  assert.throws(() => urutkanRekomendasi([], { ...a, bobot: { ...a.bobot, rating: 0.9 } }), /total bobot/);
});

test("listing game di luar game fokus ditolak", () => {
  const g = data.game_fokus.game;
  assert.equal(listingGameDiizinkan("mobile-legends", "top-up", g), true);
  assert.equal(listingGameDiizinkan("roblox", "rbl-games", g), true);
  assert.equal(listingGameDiizinkan("toram-online", "item", g), false);
  assert.equal(listingGameDiizinkan("mobile-legends", "joki", g), false);
});
