/**
 * Isi/perbarui tabel Service & Package dari site/produk.json dan JasaBayarProduct dari data/jasa-bayar-katalog.json
 * (idempoten: upsert).
 * Jalankan: cd app && npm run db:seed   (butuh DATABASE_URL)
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { katalogKeBaris, type Katalog } from "../src/domain/katalog.ts";
import { muatKatalogJasaBayar } from "../src/domain/jasaBayarKatalog.ts";
import { prisma } from "../src/server/db.ts";

async function main(): Promise<void> {
  const katalog = JSON.parse(readFileSync(path.resolve(process.cwd(), "..", "site", "produk.json"), "utf8")) as Katalog;
  const { services, packages } = katalogKeBaris(katalog);
  const jasaBayar = muatKatalogJasaBayar();
  await prisma.$transaction(async (tx) => {
    for (const s of services) {
      await tx.service.upsert({ where: { id: s.id }, create: s, update: s });
    }
    for (const p of packages) {
      await tx.package.upsert({ where: { kode: p.kode }, create: p, update: p });
    }
    for (const j of jasaBayar.produk) {
      const data = {
        nama: j.nama,
        kategori: j.kategori,
        mataUang: j.mata_uang,
        caraBayar: j.cara_bayar,
        butuhLogin: j.butuh_login,
        paket: j.paket,
        catatan: j.catatan ?? null,
        patungan: j.patungan ?? null,
        aktif: j.aktif,
        ppnPersen: j.ppn_persen,
        urlHarga: j.url_harga,
        hargaDicek: j.harga_dicek ? new Date(`${j.harga_dicek}T00:00:00+08:00`) : null,
      };
      await tx.jasaBayarProduct.upsert({ where: { slug: j.slug }, create: { slug: j.slug, ...data }, update: data });
    }
  });
  console.log(`seed selesai: ${services.length} layanan, ${packages.length} paket, ${jasaBayar.produk.length} produk jasa bayar`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
