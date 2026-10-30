/** Menyimpan Jurnal ke database secara idempoten (ref unik) dan atomik. */
import type { Prisma } from "@prisma/client";
import type { Jurnal } from "../domain/ledger.ts";
import { prisma } from "./db.ts";

export type Tx = Prisma.TransactionClient;

export async function simpanJurnal(j: Jurnal, tx: Tx = prisma, oleh?: string): Promise<{ baru: boolean }> {
  const ada = await tx.journal.findUnique({ where: { ref: j.ref }, select: { id: true } });
  if (ada) return { baru: false };
  await tx.journal.create({
    data: {
      ref: j.ref,
      keterangan: j.keterangan,
      createdBy: oleh,
      lines: { create: j.baris.map((b) => ({ akun: b.akun, debit: b.debit, kredit: b.kredit })) },
    },
  });
  return { baru: true };
}

/** Saldo akun sesuai saldo normal (lihat domain/ledger.ts). */
export async function saldoAkun(akun: string): Promise<number> {
  const agg = await prisma.journalLine.aggregate({ where: { akun }, _sum: { debit: true, kredit: true } });
  const s = (agg._sum.kredit ?? 0) - (agg._sum.debit ?? 0);
  return akun.startsWith("kas:") || akun.startsWith("biaya:") ? -s : s;
}

export function keJson(v: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
}
