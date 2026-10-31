import { test } from "node:test";
import assert from "node:assert/strict";
import { cekSeimbang, jurnalBayarEscrow, jurnalPayout, jurnalTopupDompet, saldo } from "./ledger.ts";
import { mutasiKasGateway, rekonsiliasiHarian, type BarisGateway, type MutasiLedger } from "./rekonsiliasi.ts";

const batas = new Date("2026-10-31T17:00:00Z"); // 00:00 WIB 1 Nov
const siang = new Date("2026-10-31T05:00:00Z");
const malam = new Date("2026-10-31T16:40:00Z"); // 20 menit sebelum batas
const opsi = { tanggal: "2026-10-31", batas };

function gw(p: Partial<BarisGateway>): BarisGateway {
  return { gateway: "xendit", kode: "JSA-261031-01", idGateway: "x1", arah: "MASUK", bruto: 50_000, biaya: 350, waktu: siang, ...p };
}
function lg(p: Partial<MutasiLedger>): MutasiLedger {
  return { ref: "bayar:o1", kode: "JSA-261031-01", nominal: 50_000, waktu: siang, ...p };
}

test("rekonsiliasi: semua cocok → BERES + usulan jurnal biaya per gateway", () => {
  const g = [gw({}), gw({ gateway: "tripay", kode: "MKT-261031-02", idGateway: "t1", bruto: 20_000, biaya: 750 }), gw({ kode: "payout:P1", arah: "KELUAR", bruto: 10_000, biaya: 2_500 })];
  const l = [lg({}), lg({ ref: "bayar:o2", kode: "MKT-261031-02", nominal: 20_000 }), lg({ ref: "payout:P1", kode: "payout:P1", nominal: -10_000 })];
  const h = rekonsiliasiHarian(g, l, opsi);
  assert.equal(h.status, "BERES");
  assert.equal(h.ringkasan.jumlahPerKategori.COCOK, 3);
  assert.equal(h.ringkasan.totalGatewayBersih, 60_000);
  assert.equal(h.ringkasan.selisih, 0);
  assert.deepEqual(h.ringkasan.biayaGateway, { xendit: 2_850, tripay: 750 });
  assert.deepEqual(h.usulanJurnal.map((j) => j.ref), ["biaya_gateway:xendit:2026-10-31", "biaya_gateway:tripay:2026-10-31"]);
  assert.ok(cekSeimbang(h.usulanJurnal));
  assert.equal(saldo(h.usulanJurnal, "biaya:gateway"), 3_600);
});

test("rekonsiliasi: biaya yang sudah dijurnal tidak diusulkan ulang; kelebihan = error", () => {
  const h = rekonsiliasiHarian([gw({})], [lg({})], { ...opsi, biayaSudahDijurnal: { xendit: 350 } });
  assert.equal(h.usulanJurnal.length, 0);
  assert.throws(() => rekonsiliasiHarian([gw({})], [lg({})], { ...opsi, biayaSudahDijurnal: { xendit: 400 } }), /melebihi/);
});

test("rekonsiliasi: webhook hilang → HANYA_GATEWAY, jurnal tanpa transaksi → HANYA_LEDGER", () => {
  const h = rekonsiliasiHarian([gw({ kode: "JBY-261031-07" })], [lg({ kode: "MKT-261031-09", ref: "bayar:o9", nominal: 15_000 })], opsi);
  assert.equal(h.status, "PERLU_TINJAU");
  const k = Object.fromEntries(h.item.map((i) => [i.kode, i.kategori]));
  assert.deepEqual(k, { "JBY-261031-07": "HANYA_GATEWAY", "MKT-261031-09": "HANYA_LEDGER" });
  assert.equal(h.ringkasan.selisihTakTerjelaskan, 35_000);
});

test("rekonsiliasi: beda waktu dekat batas hari tidak memicu tinjauan", () => {
  const h = rekonsiliasiHarian([gw({}), gw({ kode: "TOP-261031-u1", idGateway: "x2", bruto: 25_000, waktu: malam })], [lg({})], opsi);
  assert.equal(h.status, "BERES");
  assert.equal(h.item.find((i) => i.kode === "TOP-261031-u1")?.kategori, "BEDA_WAKTU");
  assert.equal(h.ringkasan.selisih, 25_000);
  assert.equal(h.ringkasan.selisihTakTerjelaskan, 0);
  // toleransi lebih sempit → jadi HANYA_GATEWAY
  const ketat = rekonsiliasiHarian([gw({ waktu: malam })], [], { ...opsi, toleransiWaktuMenit: 10 });
  assert.equal(ketat.item[0].kategori, "HANYA_GATEWAY");
  assert.equal(ketat.status, "PERLU_TINJAU");
});

test("rekonsiliasi: nominal beda dan pembayaran ganda ditandai", () => {
  const beda = rekonsiliasiHarian([gw({ bruto: 49_000 })], [lg({})], opsi);
  assert.equal(beda.item[0].kategori, "NOMINAL_BEDA");
  assert.equal(beda.item[0].selisih, -1_000);
  const ganda = rekonsiliasiHarian([gw({}), gw({ idGateway: "x2" })], [lg({})], opsi);
  assert.equal(ganda.item[0].kategori, "DUPLIKAT");
  assert.equal(ganda.status, "PERLU_TINJAU");
});

test("rekonsiliasi: input tidak valid ditolak", () => {
  assert.throws(() => rekonsiliasiHarian([gw({ bruto: 10.5 })], [], opsi), /bulat/);
  assert.throws(() => rekonsiliasiHarian([gw({ kode: "" })], [], opsi), /tanpa kode/);
  assert.throws(() => rekonsiliasiHarian([], [lg({ nominal: 1.2 })], opsi), /bulat/);
  assert.throws(() => rekonsiliasiHarian([], [], { ...opsi, tanggal: "31-10-2026" }), /YYYY-MM-DD/);
});

test("mutasiKasGateway: ambil arus kas:gateway dari jurnal, lewati jurnal tanpa kas", () => {
  const m = mutasiKasGateway(
    [
      { j: jurnalBayarEscrow("o1", 50_000), waktu: siang },
      { j: jurnalTopupDompet("TOP-261031-u1", "u1", 25_000), waktu: siang },
      { j: jurnalPayout("P1", "s1", 60_000, 50_000), waktu: siang },
    ],
    (ref) => (ref === "bayar:o1" ? "JSA-261031-01" : ref.slice(ref.indexOf(":") + 1)),
  );
  assert.deepEqual(m.map((x) => [x.kode, x.nominal]), [["JSA-261031-01", 50_000], ["TOP-261031-u1", 25_000], ["P1", -60_000]]);
});
