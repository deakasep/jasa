import { test } from "node:test";
import assert from "node:assert/strict";
import { muatFeeConfig } from "./config.ts";
import { rencanaEksekusi, type KonteksAksi } from "./eksekusiCron.ts";
import type { Pesanan } from "./escrow.ts";
import { cekSeimbang } from "./ledger.ts";
import { buatNotifikasi, isiTemplate, modeNotif, pilihPengirim, rupiahPesan, tanggalPesan } from "./notifikasi.ts";

const cfg = muatFeeConfig();
const now = new Date("2026-10-31T12:00:00Z");
const HARI = 86_400_000;

function pesanan(p: Partial<Pesanan>): Pesanan {
  return { id: "o1", total: 100_000, status: "DIKIRIM", metodeBayar: "qris", batasKirimJam: 24, garansiHari: 0, dibuatAt: new Date(now.getTime() - 10 * HARI), ...p };
}
const ktxPesanan = (p: Pesanan): KonteksAksi => ({ jenis: "pesanan", pesanan: p, kode: "MKT-261031-001", buyerId: "u-beli", sellerId: "u-jual", produk: "Diamond ML 86" });

test("notifikasi: template terisi, placeholder kosong = error, tanpa nomor HP/email", () => {
  assert.match(isiTemplate("slot-dilepas", { PRODUK: "Netflix", KODE: "JSA-261031-01" }), /slot Netflix \(JSA-261031-01\) sudah kami lepas/);
  assert.throws(() => isiTemplate("reminder-h3", { PRODUK: "Netflix", KODE: "X" }), /TANGGAL_HABIS/);
  const n = buatNotifikasi("K", "u1", "batch-7-hari", { PRODUK: "Netflix" });
  assert.deepEqual(n.map((x) => x.kanal), ["wa", "email"]);
  assert.equal(new Set(n.map((x) => x.kunci)).size, 2);
  assert.deepEqual(Object.keys(n[0]).sort(), ["isi", "kanal", "kunci", "template", "userId"]);
});

test("notifikasi: mode default uji; kirim ditolak sampai penyedia dipilih", () => {
  assert.equal(modeNotif(undefined), "uji");
  assert.equal(modeNotif("apa saja"), "uji");
  assert.equal(pilihPengirim("uji").mode, "uji");
  assert.throws(() => pilihPengirim("kirim"), /belum didukung/);
  assert.equal(rupiahPesan(1_234_567), "Rp1.234.567");
  assert.equal(tanggalPesan(new Date("2026-10-31T20:00:00Z")), "01/11/2026"); // WITA
});

test("eksekusi: auto selesai → status SELESAI bersyarat + jurnal lepas escrow seimbang + notif pembeli & penjual", () => {
  const r = rencanaEksekusi({ jenis: "PESANAN_AUTO_SELESAI", id: "o1" }, ktxPesanan(pesanan({ dikirimAt: new Date(now.getTime() - 8 * HARI) })), now, cfg);
  assert.equal(r.lewati, undefined);
  assert.deepEqual(r.ubah, { model: "order", id: "o1", dari: ["DIKIRIM"], ke: "SELESAI", selesaiAt: now, feeSeller: 5_000 });
  assert.ok(r.jurnal && cekSeimbang([r.jurnal]));
  assert.equal(r.jurnal?.ref, "lepas:o1");
  const baris = Object.fromEntries((r.jurnal?.baris ?? []).map((b) => [b.akun, b.debit || b.kredit]));
  assert.deepEqual(baris, { "escrow:o1": 100_000, "saldo_penjual:u-jual": 95_000, "pendapatan:marketplace": 5_000 });
  assert.deepEqual([...new Set(r.notifikasi.map((n) => n.userId))], ["u-beli", "u-jual"]);
  assert.match(r.notifikasi.find((n) => n.userId === "u-jual")?.isi ?? "", /Rp95\.000/);
});

test("eksekusi: auto selesai setelah refund sebagian hanya melepas sisa escrow", () => {
  const r = rencanaEksekusi({ jenis: "PESANAN_AUTO_SELESAI", id: "o1" }, ktxPesanan(pesanan({ refund: 40_000, dikirimAt: new Date(now.getTime() - 8 * HARI) })), now, cfg);
  const escrow = r.jurnal?.baris.find((b) => b.akun === "escrow:o1");
  assert.equal(escrow?.debit, 60_000);
  assert.ok(r.jurnal && cekSeimbang([r.jurnal]));
});

test("eksekusi: status sudah berubah / masa cek belum habis / data hilang → dilewati, tanpa jurnal & notif", () => {
  const sudahSelesai = rencanaEksekusi({ jenis: "PESANAN_AUTO_SELESAI", id: "o1" }, ktxPesanan(pesanan({ status: "SELESAI" })), now, cfg);
  const belumHabis = rencanaEksekusi({ jenis: "PESANAN_AUTO_SELESAI", id: "o1" }, ktxPesanan(pesanan({ dikirimAt: new Date(now.getTime() - HARI) })), now, cfg);
  const hilang = rencanaEksekusi({ jenis: "LEPAS_SLOT", id: "s1" }, null, now, cfg);
  for (const r of [sudahSelesai, belumHabis, hilang]) {
    assert.ok(r.lewati);
    assert.equal(r.jurnal, undefined);
    assert.equal(r.notifikasi.length, 0);
  }
  assert.throws(() => rencanaEksekusi({ jenis: "LEPAS_SLOT", id: "o1" }, ktxPesanan(pesanan({})), now, cfg), /tidak cocok/);
});

test("eksekusi: kadaluarsa pesanan & permintaan, boleh batal hanya notif", () => {
  const kd = rencanaEksekusi({ jenis: "PESANAN_KADALUARSA", id: "o1" }, ktxPesanan(pesanan({ status: "MENUNGGU_BAYAR" })), now, cfg);
  assert.deepEqual(kd.ubah, { model: "order", id: "o1", dari: ["MENUNGGU_BAYAR"], ke: "KADALUARSA" });
  assert.equal(kd.jurnal, undefined);

  const bb = rencanaEksekusi({ jenis: "BERI_TAHU_PEMBELI_BOLEH_BATAL", id: "o1" }, ktxPesanan(pesanan({ status: "DIBAYAR" })), now, cfg);
  assert.equal(bb.ubah, undefined);
  assert.ok(bb.notifikasi.every((n) => n.userId === "u-beli" && n.template === "pembeli-boleh-batal"));

  const pk = rencanaEksekusi({ jenis: "PERMINTAAN_KADALUARSA", id: "r1" }, { jenis: "permintaan", id: "r1", status: "MENUNGGU", joinerId: "u-j", hostId: "u-h", produk: "Spotify" }, now, cfg);
  assert.deepEqual(pk.ubah, { model: "joinRequest", id: "r1", dari: ["MENUNGGU"], ke: "KADALUARSA", decidedAt: now });
  assert.deepEqual([...new Set(pk.notifikasi.map((n) => n.template))], ["permintaan-kadaluarsa", "permintaan-kadaluarsa-host"]);
});

test("eksekusi: renewal H-3 → H3_RENEWAL sekali; kunci notif ikut tanggal habis; lepas slot", () => {
  const habisAt = new Date(now.getTime() + 2 * HARI);
  const l = { jenis: "langganan" as const, id: "s1", kode: "JSA-261001-01", userId: "u1", produk: "Netflix", habisAt };
  const aktif = rencanaEksekusi({ jenis: "KIRIM_PENGINGAT_RENEWAL", id: "s1" }, { ...l, status: "AKTIF" }, now, cfg);
  assert.deepEqual(aktif.ubah, { model: "subscription", id: "s1", dari: ["AKTIF"], ke: "H3_RENEWAL" });
  assert.ok(aktif.notifikasi[0].kunci.includes(habisAt.toISOString()));
  assert.match(aktif.notifikasi[0].isi, /02\/11\/2026/);
  const sudahH3 = rencanaEksekusi({ jenis: "KIRIM_PENGINGAT_RENEWAL", id: "s1" }, { ...l, status: "H3_RENEWAL" }, now, cfg);
  assert.equal(sudahH3.ubah, undefined);
  assert.equal(sudahH3.notifikasi[0].kunci, aktif.notifikasi[0].kunci); // dedup di pelaksana
  const lepas = rencanaEksekusi({ jenis: "LEPAS_SLOT", id: "s1" }, { ...l, status: "H3_RENEWAL" }, now, cfg);
  assert.deepEqual(lepas.ubah, { model: "subscription", id: "s1", dari: ["AKTIF", "H3_RENEWAL"], ke: "LEPAS" });
  assert.ok(rencanaEksekusi({ jenis: "LEPAS_SLOT", id: "s1" }, { ...l, status: "DIPERPANJANG" }, now, cfg).lewati);
});

test("eksekusi: tawaran pindah batch ke tiap anggota unik", () => {
  const r = rencanaEksekusi({ jenis: "TAWARKAN_PINDAH_BATCH", id: "b1" }, { jenis: "batch", id: "b1", status: "BUKA", produk: "Netflix", anggota: ["a", "b", "a"] }, now, cfg);
  assert.equal(r.notifikasi.length, 4); // 2 anggota × (wa + email)
  assert.ok(rencanaEksekusi({ jenis: "TAWARKAN_PINDAH_BATCH", id: "b1" }, { jenis: "batch", id: "b1", status: "BUKA", produk: "Netflix", anggota: [] }, now, cfg).lewati);
});
