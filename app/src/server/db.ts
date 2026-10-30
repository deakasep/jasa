// Prisma 7: client dibuat dari src/generated/prisma dan wajib memakai driver adapter (PostgreSQL via `pg`).
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalUntukPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buatClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL belum diatur");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }), log: ["warn", "error"] });
}

export const prisma: PrismaClient = globalUntukPrisma.prisma ?? buatClient();

if (process.env.NODE_ENV !== "production") globalUntukPrisma.prisma = prisma;
