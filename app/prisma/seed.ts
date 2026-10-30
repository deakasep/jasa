/**
 * Isi/perbarui tabel Service & Package dari site/produk.json (idempoten: upsert).
 * Jalankan: cd app && npm run db:seed   (butuh DATABASE_URL)
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { katalogKeBaris, type Katalog } from "../src/domain/katalog.ts";
import { prisma } from "../src/server/db.ts";

async function main(): Promise<void> {
  const katalog = JSON.parse(readFileSync(path.resolve(process.cwd(), "..", "site", "produk.json"), "utf8")) as Katalog;
  const { services, packages } = katalogKeBaris(katalog);
  await prisma.$transaction(async (tx) => {
    for (const s of services) {
      await tx.service.upsert({ where: { id: s.id }, create: s, update: s });
    }
    for (const p of packages) {
      await tx.package.upsert({ where: { kode: p.kode }, create: p, update: p });
    }
  });
  console.log(`seed selesai: ${services.length} layanan, ${packages.length} paket`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
