import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bolehMengulas, labelTransaksi, muatKepercayaan, namaTestimoni, namaTicker, pilihTestimoni, ringkasRating,
  stripKepercayaan, tickerTransaksi, waktuRelatif,
} from "./ulasan.ts";

const cfg = muatKepercayaan();

test("ulasan hanya dari pesanan selesai, satu kali per pesanan", () => {
  assert.equal(bolehMengulas("SELESAI", false).ok, true);
  assert.equal(bolehMengulas("DIPROSES", false).ok, false);
  assert.equal(bolehMengulas("SELESAI", true).ok, false);
});

test("nama disamarkan: testimoni 'Andra S.', ticker 'Sonn***'", () => {
  assert.equal(namaTestimoni("Andra Saputra"), "Andra S.");
  assert.equal(namaTestimoni("  budi  "), "budi");
  assert.equal(namaTicker("Sonny Wijaya"), "Sonn***");
  assert.equal(namaTicker("Al"), "A***");
  assert.ok(!namaTicker("Rina").includes("Rina"));
});

test("rating rata-rata 1 desimal, nilai tidak sah diabaikan", () => {
  assert.deepEqual(ringkasRating([5, 5, 4, 0, 6, 4.5]), { rata: 4.7, jumlah: 3 });
  assert.deepEqual(ringkasRating([]), { rata: null, jumlah: 0 });
});

test("label transaksi dibulatkan ke bawah ke anak tangga, di bawah ambang tidak tampil", () => {
  assert.equal(labelTransaksi(99, cfg), null);
  assert.equal(labelTransaksi(100, cfg), "100+");
  assert.equal(labelTransaksi(10_437, cfg), "10.000+");
});

test("strip kepercayaan: toko baru → label jujur, bukan angka karangan", () => {
  const strip = stripKepercayaan("jasa_bayar", { transaksiSelesai: 3, ratings: [5, 5], menitProses30Hari: [2, 3] }, cfg);
  assert.deepEqual(strip.map((b) => b.kunci), ["transaksi", "garansi", "kecepatan"]); // rating disembunyikan
  assert.equal(strip.find((b) => b.kunci === "transaksi")?.dariData, false);
  assert.match(strip.find((b) => b.kunci === "kecepatan")!.teks, /^Target/);
});

test("strip kepercayaan: setelah data cukup, angka dari data asli", () => {
  const strip = stripKepercayaan("jasa_bayar", {
    transaksiSelesai: 12_000,
    ratings: [...Array(40).fill(5), ...Array(10).fill(4)],
    menitProses30Hari: Array.from({ length: 60 }, (_, i) => 2 + (i % 3)),
  }, cfg);
  assert.equal(strip[0].teks, "10.000+ transaksi sukses");
  assert.equal(strip.find((b) => b.kunci === "rating")?.teks, "Rating 4,8/5 dari 50 ulasan");
  assert.equal(strip.find((b) => b.kunci === "kecepatan")?.teks, "Rata-rata aktif 3 menit");
  assert.ok(strip.filter((b) => b.kunci !== "garansi").every((b) => b.dariData));
});

test("kecepatan lebih lambat dari target → tetap tampil sebagai target, bukan klaim", () => {
  const strip = stripKepercayaan("jasa_bayar", { transaksiSelesai: 0, ratings: [], menitProses30Hari: Array(60).fill(30) }, cfg);
  assert.equal(strip.find((b) => b.kunci === "kecepatan")?.dariData, false);
});

test("testimoni hanya ulasan asli berkomentar dengan bintang tinggi, terbaru dulu", () => {
  const t = (nama: string, rating: number, komentar: string, hari: number) =>
    ({ nama, rating, komentar, createdAt: new Date(2026, 9, hari) });
  const hasil = pilihTestimoni([
    t("Aldo Pratama", 5, "Prosesnya cepat, upgrade Max langsung aktif.", 1),
    t("Sasha Lestari", 4, "Lumayan, CS ramah dan jelas jelasin kurs.", 3),
    t("Reno Hadi", 2, "Kurang cepat, nunggu agak lama sekali.", 4),
    t("Tia Nur", 5, "ok", 5),
    t("Bima Sakti", 5, "Bayar AWS tanpa kartu kredit, aman banget.", 2),
  ], cfg);
  assert.deepEqual(hasil.map((x) => x.nama), ["Sasha L.", "Bima S.", "Aldo P."]);
});

test("ticker: pesanan selesai terbaru, nama disamarkan, waktu relatif", () => {
  const now = new Date("2026-10-30T10:00:00Z");
  const hasil = tickerTransaksi([
    { namaPembeli: "Sonny W", produk: "Claude", selesaiAt: new Date("2026-10-30T09:48:00Z") },
    { namaPembeli: "Dewi", produk: "AWS", selesaiAt: new Date("2026-10-30T07:00:00Z") },
    { namaPembeli: "Masa Depan", produk: "X", selesaiAt: new Date("2026-10-30T11:00:00Z") },
  ], now, cfg);
  assert.deepEqual(hasil, [
    { nama: "Sonn***", produk: "Claude", waktu: "12 menit lalu" },
    { nama: "Dew***", produk: "AWS", waktu: "3 jam lalu" },
  ]);
  assert.equal(waktuRelatif(new Date("2026-10-28T10:00:00Z"), now), "2 hari lalu");
});
