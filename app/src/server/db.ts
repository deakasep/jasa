import { PrismaClient } from "@prisma/client";

const globalUntukPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalUntukPrisma.prisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") globalUntukPrisma.prisma = prisma;
