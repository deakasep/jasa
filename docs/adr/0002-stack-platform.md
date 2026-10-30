# ADR 0002 — Stack platform

- Tanggal: 2026-10-30 · Status: diterima
- Keputusan: TypeScript monolit modular di `app/` — Next.js (web + API route), Prisma + PostgreSQL, Zod untuk validasi, Vitest untuk test.
  Logika bisnis murni di `app/src/domain/` (tanpa I/O) supaya bisa diuji 100% dan dipakai ulang oleh web, cron, dan skrip.
- Alasan: satu bahasa untuk frontend & backend, hosting murah (Vercel + Supabase/Neon), ekosistem besar, mudah dikerjakan Claude Code.
- Uang: semua nominal integer Rupiah; setiap mutasi saldo = entri **ledger berpasangan** (debit = kredit), saldo tidak pernah di-update langsung.
- Konsekuensi: angka fee dibaca dari `config/fee.json` yang sama dengan skrip Python → satu sumber kebenaran; test lintas bahasa memastikan hasil sama.
