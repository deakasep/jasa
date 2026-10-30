# STATUS — backup progres (baca ini PERTAMA di setiap sesi baru)

Terakhir diperbarui: 2026-10-30 (sesi Claude Code). Perbarui file ini di akhir setiap sesi kerja.

## Keputusan pemilik (jangan diulang/ditanyakan lagi)
1. Tiru **penuh** joinbareng.com: struktur, mekanisme, rules, skill, QA/QC — **kecuali tampilan web** (dibuat sendiri paling akhir). ADR `docs/adr/0001`.
2. **Fee sama dengan joinbareng** → `config/fee.json` (satu-satunya tempat angka).
3. Target **enterprise** (`docs/21-enterprise.md`), kerjakan satu per satu, pakai Claude Code otomatis bila perlu.
4. Pengecualian yang tidak ditiru: patungan akun AI pribadi/plan single-user (→ jasa bayar), konten dewasa, akun keuangan ber-KYC, ulasan palsu.
5. Git: push → PR langsung di-merge bila check `QA` hijau; merah = perbaiki dulu.

## INGAT: berapa persen yang kita dapat (detail `docs/19-pendapatan.md`, angka live: `python3 scripts/hitung.py pendapatan`)
| Dari | Pilar | Fee |
|---|---|---|
| **Pembeli** | Patungan bulanan | 10% harga slot + Rp8.000 (≈15–39% di atas harga slot) |
| **Pembeli** | Patungan tahunan | (20% harga slot/bulan + Rp6.500) × 12 |
| **Penjual** (host) | Connection fee | 25% maks Rp5.000 (bulanan) / 20% maks Rp6.000 (tahunan), **hanya bulan pertama per joiner baru**; pribadi 0 |
| **Pembeli** | Jasa Bayar | < $70 Rp50.000 · $70–500 4% · > $500 3,5% + spread kurs 1,5% |
| **Penjual** (seller) | Marketplace | 5% min Rp1.000 (sementara — joinbareng tidak publikasi) |

## Sudah selesai
- Riset joinbareng lengkap via Chrome: 5 pilar, S&K, legalitas, privasi, FAQ, halaman listing/layanan, **63 artikel pusat bantuan** (`docs/09`, `docs/20`).
- Dokumen 01–21 + ADR + post-mortem template + SECURITY.md + CODEOWNERS + Dependabot + PR template.
- Katalog patungan dengan harga plan resmi Indonesia per 2026-10-30 (Netflix Premium 186rb/4, Spotify Platinum 119rb/3, YouTube Family 139rb/5,
  M365 Family 169rb/6, Apple One Family 199rb/6, Disney+ Super 99rb/4) — semua lebih murah dari joinbareng.
- Skrip: `scripts/hitung.py` (fee, host, pendapatan), `scripts/qa_check.py` (QA otomatis, pemindai rahasia).
- **Platform `app/`** (fondasi Tahap 1): domain murni + 42 test (fee, ledger berpasangan, escrow, patungan batch/host/renewal, jasa bayar,
  promo/referral, RBAC + empat mata, filter chat, skor kepercayaan, audit, cron), verifikasi webhook Xendit/Tripay, skema Prisma lengkap,
  API `quote`, `webhooks/tripay`, `webhooks/xendit`, `cron`, `health`. CI GitHub Actions `QA` (repo + app), error tampil sebagai anotasi.
- Stack terbaru (via Dependabot, semua hijau): **Next.js 16, Prisma 7** (`prisma.config.ts` + adapter `pg`, client di `src/generated/prisma`),
  **TypeScript 7** (`"types": ["node"]` wajib), @types/node 26, actions v7. PR Dependabot: 6 merge, 2 digantikan migrasi Prisma 7.
- ClickUp folder **JASA – Patungan Premium** (ID di `docs/08-clickup.md`): 10 list, pengingat setup, roadmap, QA/QC.

## Langkah berikutnya (urut) — task ClickUp sudah dibuat untuk semua
0. Pemilik: aktifkan **branch protection** GitHub (wajib check QA + CODEOWNERS).
1. Pemilik: daftar **NIB** (OSS) → **PSE** Komdigi → akun payment gateway (Xendit/Tripay) mode sandbox.
2. Pemilik: beli plan induk pertama (Netflix/YouTube Family), siapkan vault password + 2FA.
3. Claude: sambungkan Xendit invoice (buat tagihan) + pengolah pesanan bersama untuk webhook Xendit; halaman checkout minimal.
4. Claude: dashboard admin (antrian aksi cron, batch, refund) dengan RBAC; eksekusi aksi cron (`?jalankan=1`) + notifikasi WA/email.
5. Claude: migrasi database pertama + seed katalog dari `site/produk.json`.
6. QA rilis Tahap 1 (skill `qa-uji-alur`), lalu desain web (paling akhir).

## Kendala lingkungan yang diketahui
- Sesi cloud Claude: registry npm diblokir kebijakan jaringan (403) → test domain jalan dengan `node --experimental-strip-types --test`
  tanpa dependensi; install/typecheck/build Next.js diverifikasi di GitHub Actions.
- Fee seller marketplace joinbareng belum dipublikasikan (task ClickUp konfirmasi).
