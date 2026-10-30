import { test } from "node:test";
import assert from "node:assert/strict";
import { cekHalamanHarga, judulTaskPantau, teksDariHtml } from "./pantauHarga.ts";
import { muatKatalogJasaBayar } from "./jasaBayarKatalog.ts";

const claude = muatKatalogJasaBayar().produk.find((x) => x.slug === "claude")!;
const isi = (s: string) => `${"Plans and pricing for individuals and teams. ".repeat(6)} ${s}`;

test("semua harga paket masih ada → cocok", () => {
  assert.deepEqual(cekHalamanHarga(claude, isi("Pro $20 / month. Max from $100. Max 20x US$200.00 per month")), { status: "cocok" });
});

test("harga berubah → produk dijeda + judul task", () => {
  const h = cekHalamanHarga(claude, isi("Pro $25 / month. Max from $100. Max 20x $200"));
  assert.deepEqual(h, { status: "berubah", hilang: [{ paket: "Pro", harga: 20 }] });
  assert.match(judulTaskPantau(claude, h)!, /Pro \$20 tidak ditemukan — produk dijeda/);
  assert.equal(judulTaskPantau(claude, { status: "cocok" }), null);
});

test("$20 tidak tertukar dengan $200 atau $20.50", () => {
  assert.equal(cekHalamanHarga({ ...claude, paket: [{ nama: "Pro", harga: 20 }] }, isi("only $200 and $20.50 here")).status, "berubah");
});

test("halaman kosong / tanpa harga USD → tidak terbaca (cek manual)", () => {
  assert.equal(cekHalamanHarga(claude, null).status, "tidak_terbaca");
  assert.equal(cekHalamanHarga(claude, isi("Rp 329.000 per bulan")).status, "tidak_terbaca");
});

test("teksDariHtml membuang script/style dan tag", () => {
  assert.equal(teksDariHtml("<style>a{}</style><p>Pro&nbsp;<b>&#36;20</b>/mo</p><script>x()</script>"), "Pro $20 /mo");
});
