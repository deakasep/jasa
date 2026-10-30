# Changelog

- 2026-10-30 (3): **enterprise**. Fee host (connection fee) & fee joiner tahunan per bulan sesuai artikel resmi joinbareng; harga plan resmi
  terbaru (Spotify Family → Platinum 3 orang; Disney+ Super 4 layar; Canva Teams & Netflix 5 user dikeluarkan); 63 artikel pusat bantuan ditiru
  (`docs/20`); rekap persen pendapatan (`docs/19`, `hitung.py pendapatan`); standar enterprise (`docs/21`, SECURITY, CODEOWNERS, Dependabot,
  ADR, post-mortem); platform `app/` (domain + 42 test, Prisma, webhook, cron, CI); `STATUS.md` sebagai backup progres.
  Sumber harga: kompas/idntimes (Netflix Okt 2026), detik (Spotify Platinum Nov 2025, YouTube Apr 2026, Apple One Jul 2026),
  journalarta (M365 Jul 2026), joinbareng blog (Disney+ Mei 2026), literally-apps (Canva Agu 2026).

- 2026-10-30 (2): tiru penuh joinbareng (kecuali tampilan). Fee disamakan & dipusatkan di `config/fee.json`
  (patungan 10%+Rp8.000 / 20%+Rp6.500; jasa bayar <$70 Rp50.000, $70–500 4%, >$500 3,5%, spread kurs 1,5%; payout ≤ 1×24 jam kerja).
  Katalog diubah ke model paket per jumlah user (harga slot = plan ÷ slot, untung dari fee); diskon durasi diganti kode promo.
  Plan single-user (AI pribadi, CapCut login bersama) dikeluarkan dari patungan → jasa bayar. Dokumen baru: 15 batch/host/promo,
  16 QA/QC, 17 privasi, 18 FAQ; S&K & legalitas diperluas. Skrip `hitung.py`, `qa_check.py`, GitHub Actions `QA`.
  Skill baru: `qc-harian`, `qa-uji-alur`, `qc-listing-host`. ClickUp: list **QA & QC** + 6 pengingat.

- 2026-10-30: benchmark joinbareng lengkap; pilar Marketplace escrow, Jasa Bayar, Papan Permintaan, Seller/KYC;
  arsitektur teknis & roadmap; rules semua pilar + barang terlarang; 4 skill baru; template pesan baru;
  4 list ClickUp baru (Jasa Bayar, Seller & KYC, Sengketa & Escrow, Roadmap Platform).
- 2026-10-30: struktur awal bisnis, katalog contoh, skill, landing page.
