/** Akses DB untuk harga otomatis Jasa Bayar: kurs terakhir yang sah & produk yang dijeda pemantau harga. */
import type { KursSah } from "../domain/kurs.ts";
import { prisma } from "./db.ts";

export async function kursTerakhir(): Promise<KursSah | null> {
  const r = await prisma.kurs.findFirst({ where: { status: { in: ["baru", "pakai_terakhir"] } }, orderBy: { createdAt: "desc" } });
  return r ? { nilai: Number(r.nilai), waktu: r.waktuData, sumber: r.sumber } : null;
}

export async function produkDijeda(): Promise<Set<string>> {
  const rows = await prisma.jasaBayarProduct.findMany({ where: { dijedaAlasan: { not: null } }, select: { slug: true } });
  return new Set(rows.map((r) => r.slug));
}

export function izinCron(req: Request): boolean {
  const rahasia = process.env.CRON_SECRET;
  return Boolean(rahasia) && req.headers.get("authorization") === `Bearer ${rahasia}`;
}
