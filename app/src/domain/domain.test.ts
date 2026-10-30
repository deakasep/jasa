import { test } from "node:test";
import assert from "node:assert/strict";
import { muatFeeConfig } from "./config.ts";
import {
  aksesBolehDikirim, aksiRenewal, batchPerluTawaran, bolehBatalkanPermintaan, pembagianHost, permintaanKadaluarsa, perpanjang,
  tagihanJoiner, tambahAnggota, type Batch,
} from "./patungan.ts";
import { bonusReferral, terapkanPromo, type KodePromo } from "./promo.ts";
import { bolehPindah, buatKuotasi, cekBatasPembeli, cekLayanan, kuotasiMasihBerlaku, pendapatanJasaBayar } from "./jasaBayar.ts";
import { boleh, butuhEmpatMata, validasiEmpatMata } from "./rbac.ts";
import { sanksiChat, sensorChat } from "./chatFilter.ts";
import { buatKode, kodeValid, samarkanNama } from "./kode.ts";
import { dijaminSesuaiIklan, hitungSkor } from "./trustScore.ts";
import { buatAudit } from "./audit.ts";
import { rencanakan } from "./jobs.ts";

const cfg = muatFeeConfig();
const t0 = new Date("2026-11-01T00:00:00Z");
const plus = (ms: number) => new Date(t0.getTime() + ms);
const MENIT = 60_000, JAM = 60 * MENIT, HARI = 24 * JAM;

// ---------- Patungan ----------
test("tagihan joiner + promo memotong harga slot, fee dari harga setelah diskon", () => {
  assert.deepEqual(tagihanJoiner(46500, "bulanan", cfg), { hargaSlot: 46500, diskon: 0, fee: 12650, total: 59150 });
  const t = tagihanJoiner(50000, "bulanan", cfg, 10000);
  assert.deepEqual(t, { hargaSlot: 50000, diskon: 10000, fee: 12000, total: 52000 });
});

test("pembagian host: connection fee hanya bulan pertama; pribadi gratis", () => {
  assert.deepEqual(pembagianHost(46500, "bulanan", cfg, { bulanKe: 1, pribadi: false }), { diterimaHost: 41500, connectionFee: 5000 });
  assert.deepEqual(pembagianHost(46500, "bulanan", cfg, { bulanKe: 2, pribadi: false }), { diterimaHost: 46500, connectionFee: 0 });
  assert.deepEqual(pembagianHost(46500, "bulanan", cfg, { bulanKe: 1, pribadi: true }), { diterimaHost: 46500, connectionFee: 0 });
});

test("batch: penuh saat kapasitas tercapai; auto-provision boleh kirim akses lebih awal; tawaran 7 hari", () => {
  let b: Batch = { id: "B1", kapasitas: 2, anggota: [], status: "BUKA", dibukaAt: t0, autoProvision: false };
  b = tambahAnggota(b, "u1");
  assert.equal(aksesBolehDikirim(b), false);
  assert.throws(() => tambahAnggota(b, "u1"));
  b = tambahAnggota(b, "u2");
  assert.equal(b.status, "PENUH");
  assert.equal(aksesBolehDikirim(b), true);
  assert.throws(() => tambahAnggota(b, "u3"));
  const auto: Batch = { id: "B2", kapasitas: 6, anggota: ["x"], status: "BUKA", dibukaAt: t0, autoProvision: true };
  assert.equal(aksesBolehDikirim(auto), true);
  const lama: Batch = { id: "B3", kapasitas: 4, anggota: ["x"], status: "BUKA", dibukaAt: t0, autoProvision: false };
  assert.equal(batchPerluTawaran(lama, plus(6 * HARI), cfg), false);
  assert.equal(batchPerluTawaran(lama, plus(7 * HARI + 1), cfg), true);
});

test("permintaan gabung: batal setelah 2 menit, kadaluarsa setelah 48 jam", () => {
  const r = { id: "R1", status: "MENUNGGU" as const, dibuatAt: t0 };
  assert.equal(bolehBatalkanPermintaan(r, plus(1 * MENIT), cfg), false);
  assert.equal(bolehBatalkanPermintaan(r, plus(2 * MENIT), cfg), true);
  assert.equal(permintaanKadaluarsa(r, plus(47 * JAM), cfg), false);
  assert.equal(permintaanKadaluarsa(r, plus(49 * JAM), cfg), true);
});

test("renewal: H-3 pengingat, H+1 lepas slot; perpanjang dari tanggal habis", () => {
  const l = { id: "L1", habisAt: plus(10 * HARI), diperpanjang: false };
  assert.equal(aksiRenewal(l, t0, cfg), "TIDAK_ADA");
  assert.equal(aksiRenewal(l, plus(7 * HARI + 1), cfg), "KIRIM_PENGINGAT");
  assert.equal(aksiRenewal(l, plus(11 * HARI), cfg), "LEPAS_SLOT");
  assert.equal(perpanjang(l, "bulanan", plus(8 * HARI)).habisAt.toISOString(), "2026-12-11T00:00:00.000Z");
});

// ---------- Promo & referral ----------
test("promo: kedaluwarsa, kuota, 1x per pengguna, minimal transaksi, maks diskon", () => {
  const p: KodePromo = { kode: "HEMAT10", tipe: "persen", nilai: 0.1, kuota: 10, terpakai: 0, minTransaksi: 20000, berlakuSampai: plus(HARI), maksDiskon: 4000 };
  assert.deepEqual(terapkanPromo(p, { hargaSlot: 50000, now: t0, sudahPakaiKodeIni: false }), { ok: true, diskon: 4000 });
  assert.equal(terapkanPromo(p, { hargaSlot: 50000, now: plus(2 * HARI), sudahPakaiKodeIni: false }).ok, false);
  assert.equal(terapkanPromo({ ...p, terpakai: 10 }, { hargaSlot: 50000, now: t0, sudahPakaiKodeIni: false }).ok, false);
  assert.equal(terapkanPromo(p, { hargaSlot: 50000, now: t0, sudahPakaiKodeIni: true }).ok, false);
  assert.equal(terapkanPromo(p, { hargaSlot: 10000, now: t0, sudahPakaiKodeIni: false }).ok, false);
  assert.equal(terapkanPromo(undefined, { hargaSlot: 10000, now: t0, sudahPakaiKodeIni: false }).ok, false);
});

test("referral Rp10.000: tidak untuk diri sendiri, sekali, setelah transaksi pertama", () => {
  const base = { kode: "K", pemilikId: "A", penggunaBaruId: "B", penggunaBaruSudahTransaksi: true, penggunaBaruSudahPernahDipakai: false };
  assert.deepEqual(bonusReferral(base, cfg.dompet.referral_bonus), { ok: true, bonus: 10000 });
  assert.equal(bonusReferral({ ...base, penggunaBaruId: "A" }, 10000).ok, false);
  assert.equal(bonusReferral({ ...base, penggunaBaruSudahTransaksi: false }, 10000).ok, false);
  assert.equal(bonusReferral({ ...base, penggunaBaruSudahPernahDipakai: true }, 10000).ok, false);
});

// ---------- Jasa bayar ----------
test("jasa bayar: kurs terkunci 30 menit, layanan terlarang, batas pembeli baru, status", () => {
  const q = buatKuotasi(20, 16500, t0, cfg);
  assert.equal(kuotasiMasihBerlaku(q, plus(29 * MENIT)), true);
  assert.equal(kuotasiMasihBerlaku(q, plus(31 * MENIT)), false);
  assert.equal(pendapatanJasaBayar(q), q.fee + q.spreadRp);
  assert.equal(cekLayanan("onlyfans-premium").ok, false);
  assert.equal(cekLayanan("claude-pro").ok, true);
  assert.equal(cekBatasPembeli(2_500_000, 0).ok, false);
  assert.equal(cekBatasPembeli(2_500_000, 3).ok, true);
  assert.equal(bolehPindah("MENUNGGU_BAYAR", "DIBAYAR"), true);
  assert.equal(bolehPindah("SELESAI", "REFUND"), false);
});

// ---------- RBAC ----------
test("rbac: least privilege, batas refund ops, empat mata", () => {
  assert.equal(boleh(["cs"], "refund.setujui"), false);
  assert.equal(boleh(["admin_ops"], "refund.setujui", { nominal: 400_000 }), true);
  assert.equal(boleh(["admin_ops"], "refund.setujui", { nominal: 600_000 }), false);
  assert.equal(boleh(["finance"], "refund.setujui", { nominal: 600_000 }), true);
  assert.equal(boleh(["admin_ops"], "fee.ubah"), false);
  assert.equal(boleh(["buyer"], "pesanan.lihat_semua"), false);
  assert.equal(butuhEmpatMata("payout.setujui"), true);
  assert.equal(butuhEmpatMata("refund.setujui", { nominal: 100_000 }), false);
  const p = { aksi: "payout.setujui" as const, pengajuId: "u1", penyetujuId: "u1", diajukanAt: t0, disetujuiAt: plus(30 * MENIT) };
  assert.equal(validasiEmpatMata(p, { modeSatuOrang: false }).ok, false);
  assert.equal(validasiEmpatMata(p, { modeSatuOrang: true, alasan: "cek" }).ok, false);
  assert.equal(validasiEmpatMata({ ...p, disetujuiAt: plus(2 * JAM) }, { modeSatuOrang: true, alasan: "cek mutasi" }).ok, true);
  assert.equal(validasiEmpatMata({ ...p, penyetujuId: "u2" }, { modeSatuOrang: false }).ok, true);
});

// ---------- Chat filter ----------
test("chat: sensor nomor HP, wa.me, telegram, rekening, email, ajakan transfer", () => {
  const h = sensorChat("chat wa aja ke 0812-3456-7890 atau wa.me/628123456789, tf langsung ke BCA 1234567890 / a@b.com");
  assert.equal(h.melanggar, true);
  for (const j of ["nomor_hp", "tautan_chat_luar", "nomor_rekening", "email", "ajakan_transfer"]) assert.ok(h.jenis.includes(j as never), j);
  assert.ok(!h.teks.includes("0812"));
  assert.equal(sensorChat("Halo kak, akunnya sudah aktif ya, cek dashboard").melanggar, false);
  assert.equal(sanksiChat(1), "peringatan");
  assert.equal(sanksiChat(5), "ban");
});

// ---------- Kode, skor, audit ----------
test("kode pesanan memakai tanggal lokal UTC+8", () => {
  assert.equal(buatKode("JSA", new Date("2026-10-29T17:00:00Z"), 1), "JSA-261030-01");
  assert.equal(buatKode("MKT", t0, 7), "MKT-261101-007");
  assert.equal(kodeValid("JBY-261030-12"), true);
  assert.equal(kodeValid("XYZ-1"), false);
  assert.equal(samarkanNama("Ahmad Rizal"), "Ahm** Riz**");
});

test("skor kepercayaan 0–100 & jaminan sesuai iklan", () => {
  const penuh = { fotoProfil: true, emailTerverifikasi: true, hpTerverifikasi: true, kycLulus: true, rekeningTerverifikasi: true, fakturDiunggah: true, transaksiSelesai: 50, ratingRata: 5, sengketaKalah90Hari: 0 };
  assert.equal(hitungSkor(penuh), 100);
  assert.equal(hitungSkor({ ...penuh, sengketaKalah90Hari: 20 }), 0);
  assert.equal(dijaminSesuaiIklan(80, true), true);
  assert.equal(dijaminSesuaiIklan(80, false), false);
});

test("audit menyamarkan nilai sensitif", () => {
  const a = buatAudit({ aktorId: "u1", peran: ["owner"], aksi: "kredensial.akses", objek: "akun:NFX-4", sesudah: { token: "abc123", catatan: "ok", nested: { pin: "1234" } }, at: t0 });
  assert.deepEqual(a.sesudah, { token: "[disamarkan]", catatan: "ok", nested: { pin: "[disamarkan]" } });
  assert.throws(() => buatAudit({ aktorId: "", peran: [], aksi: "x", objek: "y", at: t0 }));
});

// ---------- Cron ----------
test("cron merencanakan semua aksi otomatis", () => {
  const aksi = rencanakan(
    {
      pesanan: [
        { id: "P-exp", total: 1000, status: "MENUNGGU_BAYAR", metodeBayar: "qris", batasKirimJam: 24, garansiHari: 0, dibuatAt: t0 },
        { id: "P-done", total: 1000, status: "DIKIRIM", metodeBayar: "qris", batasKirimJam: 24, garansiHari: 0, dibuatAt: t0, dibayarAt: t0, dikirimAt: t0 },
        { id: "P-late", total: 1000, status: "DIBAYAR", metodeBayar: "qris", batasKirimJam: 24, garansiHari: 0, dibuatAt: t0, dibayarAt: plus(3 * HARI) },
      ],
      permintaan: [{ id: "R-exp", status: "MENUNGGU", dibuatAt: t0 }],
      langganan: [{ id: "L-rem", habisAt: plus(5 * HARI), diperpanjang: false }, { id: "L-off", habisAt: plus(2 * HARI), diperpanjang: false }],
      batch: [{ id: "B-old", kapasitas: 4, anggota: ["a"], status: "BUKA", dibukaAt: t0, autoProvision: false }],
    },
    plus(3 * HARI + 2 * JAM),
    cfg,
  );
  const s = aksi.map((a) => `${a.jenis}:${a.id}`).sort();
  assert.deepEqual(s, [
    "BERI_TAHU_PEMBELI_BOLEH_BATAL:P-late",
    "KIRIM_PENGINGAT_RENEWAL:L-rem",
    "LEPAS_SLOT:L-off",
    "PERMINTAAN_KADALUARSA:R-exp",
    "PESANAN_AUTO_SELESAI:P-done",
    "PESANAN_KADALUARSA:P-exp",
  ]);
});
