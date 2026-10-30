// Konfigurasi Prisma 7: URL database dibaca dari environment (tidak lagi di schema.prisma).
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
