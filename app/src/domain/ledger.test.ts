import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buatJurnal,
  cekSeimbang,
  jurnalBayarDariDompet,
  jurnalBayarEscrow,
  jurnalBonusReferral,
  jurnalLepasEscrow,
  jurnalPatunganHost,
  jurnalPayout,
  jurnalRefundEscrow,
  jurnalTopupDompet,
  saldo,
  tambahIdempoten,
  type Jurnal,
} from "./ledger.ts";

test("jurnal tidak seimbang ditolak", () => {
  assert.throws(() => buatJurnal("x", "x", [{ akun: "a", debit: 100, kredit: 0 }, { akun: "b", debit: 0, kredit: 99 }]));
  assert.throws(() => buatJurnal("x", "x", [{ akun: "a", debit: 1.5, kredit: 0 }, { akun: "b", debit: 0, kredit: 1.5 }]));
  assert.throws(() => buatJurnal("", "x", []));
});

test("alur marketplace: bayar → selesai → payout; semua saldo konsisten", () => {
  let buku: Jurnal[] = [];
  buku.push(jurnalBayarEscrow("O1", 50000));
  assert.equal(saldo(buku, "escrow:O1"), 50000);
  buku.push(jurnalLepasEscrow("O1", "S1", 50000, 2500));
  assert.equal(saldo(buku, "escrow:O1"), 0);
  assert.equal(saldo(buku, "saldo_penjual:S1"), 47500);
  assert.equal(saldo(buku, "pendapatan:marketplace"), 2500);
  buku.push(jurnalPayout("P1", "S1", 47500, 50000 - 2500));
  assert.equal(saldo(buku, "saldo_penjual:S1"), 0);
  assert.equal(saldo(buku, "kas:gateway"), 2500); // tersisa = pendapatan platform
  assert.ok(cekSeimbang(buku));
});

test("refund penuh masuk dompet, bukan rekening", () => {
  const buku = [jurnalBayarEscrow("O2", 13000), jurnalRefundEscrow("O2", "B1", 13000)];
  assert.equal(saldo(buku, "escrow:O2"), 0);
  assert.equal(saldo(buku, "dompet:B1"), 13000);
});

test("refund sebagian + sisa ke penjual", () => {
  const buku = [jurnalBayarEscrow("O3", 100000), jurnalRefundEscrow("O3", "B1", 40000), jurnalLepasEscrow("O3", "S1", 60000, 3000)];
  assert.equal(saldo(buku, "escrow:O3"), 0);
  assert.equal(saldo(buku, "dompet:B1"), 40000);
  assert.equal(saldo(buku, "saldo_penjual:S1"), 57000);
});

test("dompet: topup lalu bayar; idempoten untuk webhook ganda", () => {
  let buku: Jurnal[] = [];
  const t = jurnalTopupDompet("T1", "B1", 50000);
  ({ buku } = tambahIdempoten(buku, t));
  const ulang = tambahIdempoten(buku, t);
  assert.equal(ulang.baru, false);
  assert.equal(saldo(ulang.buku, "dompet:B1"), 50000);
  buku = [...buku, jurnalBayarDariDompet("O4", "B1", "escrow:O4", 13000)];
  assert.equal(saldo(buku, "dompet:B1"), 37000);
});

test("patungan host: contoh Netflix Rp46.500 bulan pertama", () => {
  const buku = [
    { ref: "x", keterangan: "bayar", baris: [{ akun: "kas:gateway", debit: 59150, kredit: 0 }, { akun: "escrow:L1", debit: 0, kredit: 59150 }] },
    jurnalPatunganHost({ ref: "L1", escrowAkun: "escrow:L1", hostId: "H1", hargaSlot: 46500, feeJoiner: 12650, connectionFee: 5000 }),
  ];
  assert.equal(saldo(buku, "saldo_penjual:H1"), 41500);
  assert.equal(saldo(buku, "pendapatan:patungan_joiner"), 12650);
  assert.equal(saldo(buku, "pendapatan:patungan_host"), 5000);
  assert.equal(saldo(buku, "escrow:L1"), 0);
});

test("payout di bawah minimal ditolak; referral = biaya", () => {
  assert.throws(() => jurnalPayout("P", "S", 10000, 50000));
  const j = jurnalBonusReferral("R1", "U1", 10000);
  assert.equal(saldo([j], "biaya:referral"), 10000);
  assert.equal(saldo([j], "dompet:U1"), 10000);
});
