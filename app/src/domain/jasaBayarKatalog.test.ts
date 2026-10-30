import { test } from "node:test";
import assert from "node:assert/strict";
import { cariProduk, checklistProses, kunciLayanan, muatKatalogJasaBayar, rencanakanOrder, usulanKatalog, validasiKatalog } from "./jasaBayarKatalog.ts";

const k = muatKatalogJasaBayar();

test("katalog asli valid: slug unik, kategori dikenal, tidak ada layanan terlarang", () => {
  assert.deepEqual(validasiKatalog(k), []);
  assert.equal(k.kategori.length, 39);
  for (const s of ["claude", "chatgpt", "gemini", "aws", "azure", "roblox"]) assert.ok(k.produk.some((p) => p.slug === s), s);
});

test("katalog menolak layanan terlarang & kategori asing", () => {
  const rusak = { ...k, produk: [...k.produk, { ...k.produk[0], slug: "onlyfans", nama: "OnlyFans" },
    { ...k.produk[0], slug: "x-baru", kategori: "Tidak Ada" },
    { ...k.produk[0], slug: "x-ppn", ppn_persen: 0.11, sumber_ppn: undefined },
    { ...k.produk[0], slug: "x-mati", aktif: false, alasan_nonaktif: undefined }] };
  const salah = validasiKatalog(rusak);
  assert.ok(salah.some((s) => s.includes("onlyfans")));
  assert.ok(salah.some((s) => s.includes("kategori tidak dikenal")));
  assert.ok(salah.some((s) => s.includes("x-ppn: ppn_persen wajib punya sumber_ppn")));
  assert.ok(salah.some((s) => s.includes("x-mati: nonaktif wajib punya alasan_nonaktif")));
});

test("cari produk: nama, kategori", () => {
  assert.ok(cariProduk(k, "claude code").some((p) => p.slug === "claude-code"));
  assert.ok(cariProduk(k, "", "Cloud").every((p) => p.kategori === "Cloud"));
  assert.equal(cariProduk(k, "zzz-tidak-ada").length, 0);
});

test("produk katalog USD dengan estimasi → harga langsung; IDR → dihitung CS", () => {
  const claude = rencanakanOrder(k, { slugProduk: "claude", estimasiHarga: 20 });
  assert.ok(claude.ok && !claude.rencana.hargaDihitungCs && claude.rencana.butuhLogin);
  const spotify = rencanakanOrder(k, { slugProduk: "spotify", estimasiHarga: 5 });
  assert.ok(spotify.ok && spotify.rencana.hargaDihitungCs);
});

test("cloud pascabayar (AWS/Azure/GCP) nonaktif — juga tidak bisa lewat Layanan lain", () => {
  const r = rencanakanOrder(k, { slugProduk: "azure", estimasiHarga: 150 });
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.alasan.includes("kartu virtual"));
  assert.equal(rencanakanOrder(k, { namaLayanan: "Tagihan AWS", urlLayanan: "https://console.aws.amazon.com/billing" }).ok, false);
  assert.equal(rencanakanOrder(k, { namaLayanan: "bayar azure", urlLayanan: "https://portal.azure.com" }).ok, false);
  assert.equal(rencanakanOrder(k, { namaLayanan: "Google Cloud", urlLayanan: "https://example.com/x" }).ok, false);
  // tidak salah tangkap layanan lain dari perusahaan yang sama
  assert.equal(rencanakanOrder(k, { namaLayanan: "Google Play Books", urlLayanan: "https://play.google.com/store/books" }).ok, true);
  assert.equal(rencanakanOrder(k, { namaLayanan: "Amazon Kindle", urlLayanan: "https://www.amazon.com/kindle" }).ok, true);
});

test("checklist admin: kartu virtual berlimit + matikan perpanjangan otomatis", () => {
  const c = checklistProses("kartu_di_akun_pembeli");
  assert.ok(c.some((x) => x.includes("kartu virtual")) && c.some((x) => x.includes("bekukan")));
  assert.ok(c.some((x) => x.includes("perpanjangan otomatis")));
  assert.ok(!checklistProses("gift_card").some((x) => x.includes("kartu virtual")));
});

test("Roblox lewat gift card resmi, tanpa login", () => {
  const r = rencanakanOrder(k, { slugProduk: "roblox" });
  assert.ok(r.ok && r.rencana.caraBayar === "gift_card" && !r.rencana.butuhLogin);
});

test("layanan lain: wajib nama + link https, dicek daftar tolak", () => {
  const ok = rencanakanOrder(k, { namaLayanan: "Hetzner Cloud", urlLayanan: "https://www.hetzner.com/cloud" });
  assert.ok(ok.ok && ok.rencana.jalur === "layanan_lain" && ok.rencana.hargaDihitungCs);
  assert.equal(rencanakanOrder(k, { namaLayanan: "Hetzner" }).ok, false);
  assert.equal(rencanakanOrder(k, { namaLayanan: "Fansly", urlLayanan: "https://fansly.com" }).ok, false);
  assert.equal(rencanakanOrder(k, { slugProduk: "tidak-ada" }).ok, false);
});

test("layanan lain yang sering dipesan diusulkan masuk katalog", () => {
  const pesanan = [
    { url: "https://www.hetzner.com/cloud", nama: "Hetzner" },
    { url: "https://hetzner.com/pricing", nama: "Hetzner Cloud" },
    { url: "https://www.hetzner.com", nama: "hetzner" },
    { url: "https://linear.app/pricing", nama: "Linear" },
  ];
  assert.equal(kunciLayanan("https://www.hetzner.com/cloud"), "hetzner.com");
  assert.deepEqual(usulanKatalog(k, pesanan, 3), [{ kunci: "hetzner.com", contohNama: "Hetzner", jumlah: 3 }]);
});
