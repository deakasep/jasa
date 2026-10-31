import { test } from "node:test";
import assert from "node:assert/strict";
import { muatFeeConfig } from "../domain/config.ts";
import type { KonteksAksi, RencanaEksekusi } from "../domain/eksekusiCron.ts";
import type { AksiCron } from "../domain/jobs.ts";
import { PengirimUji, type Notifikasi } from "../domain/notifikasi.ts";
import { jalankanAksiCron, type PortCron } from "./cron.ts";

const cfg = muatFeeConfig();
const now = new Date("2026-10-31T12:00:00Z");
const HARI = 86_400_000;

/** Database palsu di memori: status, jurnal, catatan notifikasi. */
function portPalsu(konteks: Record<string, KonteksAksi>, opsi: { statusBerubah?: string[]; rusak?: string[] } = {}) {
  const tercatat = new Map<string, Notifikasi>();
  const diterapkan: RencanaEksekusi[] = [];
  const port: PortCron = {
    async muatKonteks(_jenis, id) {
      if (opsi.rusak?.includes(id)) throw new Error("koneksi putus");
      return konteks[id] ?? null;
    },
    async kunciTercatat(kunci) {
      return new Set(kunci.filter((k) => tercatat.has(k)));
    },
    async terapkan(r, notifBaru) {
      if (r.ubah && opsi.statusBerubah?.includes(r.ubah.id)) return false;
      diterapkan.push(r);
      for (const n of notifBaru) tercatat.set(n.kunci, n);
      return true;
    },
  };
  return { port, tercatat, diterapkan };
}

const pesanan = (id: string, status: "DIBAYAR" | "DIKIRIM" | "MENUNGGU_BAYAR", lain: object = {}): KonteksAksi => ({
  jenis: "pesanan", kode: `MKT-261031-${id}`, buyerId: "beli", sellerId: "jual", produk: "Voucher",
  pesanan: { id, total: 50_000, status, metodeBayar: "qris", batasKirimJam: 24, garansiHari: 0, dibuatAt: new Date(now.getTime() - 9 * HARI), ...lain },
});

test("cron eksekusi: jalankan, lewati, gagal per aksi — satu gagal tidak menghentikan yang lain", async () => {
  const { port, diterapkan } = portPalsu(
    {
      o1: pesanan("o1", "DIKIRIM", { dikirimAt: new Date(now.getTime() - 8 * HARI) }),
      o2: pesanan("o2", "MENUNGGU_BAYAR"),
      o3: pesanan("o3", "MENUNGGU_BAYAR"),
    },
    { statusBerubah: ["o3"], rusak: ["o9"] },
  );
  const aksi: AksiCron[] = [
    { jenis: "PESANAN_AUTO_SELESAI", id: "o1" },
    { jenis: "PESANAN_KADALUARSA", id: "o9" }, // gagal: koneksi putus
    { jenis: "PESANAN_KADALUARSA", id: "o2" },
    { jenis: "PESANAN_KADALUARSA", id: "o3" }, // pembeli keburu bayar
    { jenis: "LEPAS_SLOT", id: "tidak-ada" },
  ];
  const pengirim = new PengirimUji();
  const r = await jalankanAksiCron(aksi, port, pengirim, now, cfg);
  assert.equal(r.mode, "uji");
  assert.deepEqual(r.hasil.map((h) => h.status), ["dijalankan", "gagal", "dijalankan", "dilewati", "dilewati"]);
  assert.match(r.hasil[1].alasan ?? "", /koneksi putus/);
  assert.deepEqual([r.dijalankan, r.dilewati, r.gagal], [2, 2, 1]);
  assert.equal(diterapkan[0].jurnal?.ref, "lepas:o1");
  // o1: pembeli + penjual × 2 kanal; o2: pembeli × 2 kanal. Hanya yang transaksinya sukses masuk kotak keluar.
  assert.equal(pengirim.kotakKeluar.length, 6);
  assert.ok(!pengirim.kotakKeluar.some((n) => n.kunci.includes("o3")));
});

test("cron eksekusi: notifikasi tanpa ubah status tidak dikirim dua kali", async () => {
  const { port } = portPalsu({
    o1: pesanan("o1", "DIBAYAR"),
    b1: { jenis: "batch", id: "b1", status: "BUKA", produk: "Netflix", anggota: ["x", "y"] },
  });
  const aksi: AksiCron[] = [{ jenis: "BERI_TAHU_PEMBELI_BOLEH_BATAL", id: "o1" }, { jenis: "TAWARKAN_PINDAH_BATCH", id: "b1" }];
  const pengirim = new PengirimUji();
  const pertama = await jalankanAksiCron(aksi, port, pengirim, now, cfg);
  const kedua = await jalankanAksiCron(aksi, port, pengirim, now, cfg);
  assert.deepEqual(pertama.hasil.map((h) => h.notifikasi), [2, 4]);
  assert.deepEqual(kedua.hasil.map((h) => h.status), ["dilewati", "dilewati"]);
  assert.equal(pengirim.kotakKeluar.length, 6);
});

test("cron eksekusi: pengingat renewal sekali per periode, periode berikutnya dapat lagi", async () => {
  const habis1 = new Date(now.getTime() + 2 * HARI);
  const ktx = (habisAt: Date, status: "AKTIF" | "H3_RENEWAL"): KonteksAksi => ({ jenis: "langganan", id: "s1", kode: "JSA-261001-01", status, userId: "u1", produk: "Netflix", habisAt });
  const konteks: Record<string, KonteksAksi> = { s1: ktx(habis1, "AKTIF") };
  const { port } = portPalsu(konteks);
  const pengirim = new PengirimUji();
  const aksi: AksiCron[] = [{ jenis: "KIRIM_PENGINGAT_RENEWAL", id: "s1" }];
  assert.equal((await jalankanAksiCron(aksi, port, pengirim, now, cfg)).dijalankan, 1);
  konteks.s1 = ktx(habis1, "H3_RENEWAL");
  assert.equal((await jalankanAksiCron(aksi, port, pengirim, now, cfg)).dilewati, 1);
  konteks.s1 = ktx(new Date(habis1.getTime() + 30 * HARI), "H3_RENEWAL");
  assert.equal((await jalankanAksiCron(aksi, port, pengirim, now, cfg)).dijalankan, 1);
  assert.equal(pengirim.kotakKeluar.length, 4);
});
