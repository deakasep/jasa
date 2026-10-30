import { test } from "node:test";
import assert from "node:assert/strict";
import { jenisDariKode, kodeTopup, rencanakanPembayaranLunas, userDariKodeTopup } from "./pembayaran.ts";
import { cekSeimbang, saldo } from "./ledger.ts";

test("jenis pesanan dari kode", () => {
  assert.equal(jenisDariKode("MKT-261030-001"), "MKT");
  assert.equal(jenisDariKode("JSA-261030-01"), "JSA");
  assert.equal(jenisDariKode("XYZ-1"), undefined);
});

test("kode top-up bolak-balik", () => {
  const k = kodeTopup("261030", "user-abc");
  assert.equal(userDariKodeTopup(k), "user-abc");
  assert.throws(() => kodeTopup("2610", "u"));
});

test("marketplace lunas: escrow + DIBAYAR", () => {
  const r = rencanakanPembayaranLunas("MKT-261030-001", 50000, { id: "o1", status: "MENUNGGU_BAYAR", tagihan: 50000 });
  assert.equal(r.jenis, "PROSES");
  if (r.jenis !== "PROSES") return;
  assert.equal(r.statusBaru, "DIBAYAR");
  assert.equal(saldo([r.jurnal], "escrow:o1"), 50000);
  assert.ok(cekSeimbang([r.jurnal]));
});

test("patungan lunas → MENUNGGU_BATCH; jasa bayar → DIBAYAR", () => {
  const p = rencanakanPembayaranLunas("JSA-261030-01", 59150, { id: "s1", status: "MENUNGGU_BAYAR", tagihan: 59150 });
  assert.equal(p.jenis === "PROSES" && p.statusBaru, "MENUNGGU_BATCH");
  const j = rencanakanPembayaranLunas("JBY-261030-01", 385000, { id: "j1", status: "MENUNGGU_BAYAR", tagihan: 385000 });
  assert.equal(j.jenis === "PROSES" && j.statusBaru, "DIBAYAR");
});

test("webhook ulang: status sudah DIBAYAR → jurnal sama (ref sama), status tidak diubah", () => {
  const a = rencanakanPembayaranLunas("MKT-261030-001", 50000, { id: "o1", status: "MENUNGGU_BAYAR", tagihan: 50000 });
  const b = rencanakanPembayaranLunas("MKT-261030-001", 50000, { id: "o1", status: "DIBAYAR", tagihan: 50000 });
  assert.equal(b.jenis, "PROSES");
  if (a.jenis !== "PROSES" || b.jenis !== "PROSES") return;
  assert.equal(b.statusBaru, undefined);
  assert.equal(a.jurnal.ref, b.jurnal.ref); // simpanJurnal idempoten → tidak dobel
});

test("top-up dompet", () => {
  const r = rencanakanPembayaranLunas("TOP-261030-u9", 50000, null);
  assert.equal(r.jenis, "PROSES");
  if (r.jenis === "PROSES") assert.equal(saldo([r.jurnal], "dompet:u9"), 50000);
});

test("perlu tinjau: nominal beda, pesanan hilang, kode asing, dibayar setelah kadaluarsa, nominal pecahan", () => {
  const kasus = [
    rencanakanPembayaranLunas("MKT-261030-001", 49000, { id: "o1", status: "MENUNGGU_BAYAR", tagihan: 50000 }),
    rencanakanPembayaranLunas("MKT-261030-002", 50000, null),
    rencanakanPembayaranLunas("ABC-1", 50000, null),
    rencanakanPembayaranLunas("MKT-261030-003", 50000, { id: "o3", status: "KADALUARSA", tagihan: 50000 }),
    rencanakanPembayaranLunas("MKT-261030-004", 500.5, { id: "o4", status: "MENUNGGU_BAYAR", tagihan: 500 }),
  ];
  for (const k of kasus) assert.equal(k.jenis, "PERLU_TINJAU");
});
