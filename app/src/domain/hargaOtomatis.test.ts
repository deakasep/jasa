import { test } from "node:test";
import assert from "node:assert/strict";
import { muatFeeConfig } from "./config.ts";
import { hargaPaket, hitungRincian, tabelHarga } from "./hargaOtomatis.ts";
import { muatKatalogJasaBayar } from "./jasaBayarKatalog.ts";

const cfg = muatFeeConfig();
const k = muatKatalogJasaBayar();
const now = new Date("2026-10-30T10:00:00Z");
const kurs = { nilai: 16500, waktu: now, sumber: "uji" };
const p = (slug: string) => k.produk.find((x) => x.slug === slug)!;

test("Claude Pro $20 + PPN 11%: tampil Rupiah final, sama dengan rumus docs/11", () => {
  const h = hargaPaket(p("claude"), "Pro", kurs, now, cfg);
  assert.equal(h.status, "otomatis");
  if (h.status !== "otomatis") return;
  const r = h.rincian;
  assert.equal(r.kursJual, 16747.5);
  assert.equal(r.hargaRp, 334950);
  assert.equal(r.ppnRp, 36844); // 36.844,5 → pembulatan setengah-ke-genap (money.ts)
  assert.equal(r.fee, 50000); // < $70 flat
  assert.equal(r.total, 422000); // 334.950 + 36.844,5 + 50.000 → ke atas ribuan
  assert.equal(r.berlakuSampai.getTime() - now.getTime(), cfg.jasa_bayar.kunci_kurs_menit * 60_000);
});

test("Claude Max 20x $200: fee 4% dari harga sebelum pajak", () => {
  const h = hargaPaket(p("claude"), "Max 20x", kurs, now, cfg);
  assert.ok(h.status === "otomatis" && h.rincian.fee === Math.round(200 * 16747.5 * 0.04));
});

test("tanpa syarat lengkap → dihitung CS, tidak pernah menebak", () => {
  assert.equal(hargaPaket(p("cursor"), "Pro", kurs, now, cfg).status, "dihitung_cs"); // PPN belum diverifikasi
  assert.equal(hargaPaket(p("spotify"), "x", kurs, now, cfg).status, "dihitung_cs"); // harga Rupiah
  assert.equal(hargaPaket(p("claude"), "Ultra", kurs, now, cfg).status, "dihitung_cs"); // paket tidak ada
  assert.equal(hargaPaket(p("claude"), "Pro", null, now, cfg).status, "dihitung_cs"); // kurs tidak ada
  assert.equal(hargaPaket(p("claude"), "Pro", kurs, now, cfg, { dijeda: new Set(["claude"]) }).status, "dihitung_cs");
  const lama = new Date("2026-12-15T10:00:00Z"); // > 30 hari sejak harga_dicek
  assert.equal(hargaPaket(p("claude"), "Pro", kurs, lama, cfg).status, "dihitung_cs");
  assert.equal(hargaPaket(p("aws"), "x", kurs, now, cfg).status, "dihitung_cs"); // nonaktif
});

test("ChatGPT (PPN 0 setelah OpenAI dicabut dari pemungut) tetap otomatis", () => {
  const h = hargaPaket(p("chatgpt"), "Plus", kurs, now, cfg);
  assert.ok(h.status === "otomatis" && h.rincian.ppnRp === 0 && h.rincian.total === 385000);
});

test("tabel harga web hanya produk aktif", () => {
  const t = tabelHarga(k, kurs, now, cfg);
  assert.ok(!t.some((x) => x.slug === "aws"));
  assert.ok(t.find((x) => x.slug === "claude")!.paket.every((pk) => pk.harga.status === "otomatis"));
  assert.throws(() => hitungRincian(0, 0.11, 16500, now, cfg));
});
