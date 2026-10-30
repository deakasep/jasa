# Changelog

- 2026-10-31 (2): keputusan pemilik — tanpa kartu kredit (`config/pembayaran.json`, invoice Xendit dibatasi kanal lokal, Tripay tolak kanal kartu);
  Bahasa Indonesia saja; marketplace game dibatasi 7 game paling laku di Indonesia (APJII 2026) + tab Rekomendasi + rak beranda ramping;
  schema.org & piksel iklan setelah persetujuan cookie. Test 108 → 113.

- 2026-10-31: audit ulang semua menu footer joinbareng lewat browser. Fee dicek ulang — tidak berubah. Dokumen baru `24-audit-menu-footer.md`
  (Siaran Pers, Temukan Kami, Hubungi Kami, daftar Google+email, tombol perlindungan pembeli, temuan beranda). Sitemap `02`, `07`, `09`, `10`, `20` diperbarui.

- 2026-10-30 (15): halaman `/checkout` minimal (ringkasan harga slot + fee dari `config/fee.json`, validasi slot habis & layanan
  Jasa Bayar, tombol bayar nonaktif) + `/admin` data contoh (bagian sesuai RBAC, antrian aksi cron mode rencana, batch, refund dengan
  batas ops Rp500.000 & empat mata). Domain `checkoutPatungan.ts`, `adminDashboard.ts`, `contohAdmin.ts`. 104 test. (Antrian Claude, PR #19)

- 2026-10-30 (14): STATUS: preferensi pemilik (chat = persetujuan, skill non-pihak-ketiga, backup GitHub) + Antrian Claude.

- 2026-10-30 (13): skill `frontend-design` buatan Anthropic (direview, commit ca45fc4) untuk tahap tampilan web.

- 2026-10-30 (12): pasang komponen Claude buatan Anthropic yang sudah direview & dikunci commit: `/code-review`, `/review-pr` + 6 agen
  pemeriksa, skill `reconciliation`; aturan keamanan komponen pihak luar di `.claude/VENDORED.md`.

- 2026-10-30 (11): banding fee & pajak joinbareng vs Shopee (PPh 22 marketplace 0,5%); keputusan pemilik: saat omzet besar model fee
  diubah seperti Shopee, pemicu review dicatat di `docs/19`.

- 2026-10-30 (10): **harga otomatis Jasa Bayar** (Rupiah final per paket termasuk PPN penyedia, `/api/harga/jasa-bayar`), kurs otomatis
  2 sumber + tahan lonjakan (`/api/cron/kurs`, model `Kurs`), pantau harga resmi penyedia (`/api/cron/pantau-harga`, produk dijeda),
  cek selisih checkout (toleransi Rp5.000), catat markup kurs bank, untung bersih (`hitung.py jasa-bayar-bersih`). Pengaman kartu:
  kartu virtual per order + perpanjangan otomatis dimatikan + checklist admin; **cloud pascabayar AWS/Azure/GCP nonaktif**. 96 test.

- 2026-10-30 (9): katalog Jasa Bayar (39 kategori ala joinbareng, 35 produk benih) + jalur **Layanan lain** (nama + link, cek daftar tolak,
  usulan katalog otomatis), lima cara bayar termasuk cloud pascabayar (kartu dilepas setelah bayar); ulasan Patungan & Jasa Bayar
  (`UlasanLayanan`), testimoni & ticker dari data asli, strip kepercayaan otomatis (`domain/ulasan.ts`, `config/kepercayaan.json`). 74 test.

- 2026-10-30 (8): strip kepercayaan per pilar (transaksi sukses, rating, garansi refund, kecepatan) ala joinbareng — angka otomatis
  dari data asli dengan ambang tampil; sebelum ambang tampil label jujur (`docs/02`).

- 2026-10-30 (7): audit kelengkapan tiruan joinbareng → celah ditutup: 19 kategori marketplace + hub game + urutan/paginasi,
  alur Top Up Login, Papan Penawaran Custom, struktur blog, metode bayar (`docs/22`, `data/kategori-marketplace.json`).
  Joki, Top Up Login, Akun disembunyikan sampai pemilik memutuskan (risiko ToS game & keamanan akun).

- 2026-10-30 (6): pengolah pembayaran bersama Xendit+Tripay (antrian tinjau untuk nominal tidak cocok), klien invoice Xendit/Tripay,
  seed katalog ke database. 57 test.

- 2026-10-30 (5): branch protection aktif (ruleset "main": wajib PR + check QA hijau). Alur git di CLAUDE.md & STATUS.md disesuaikan.

- 2026-10-30 (4): upgrade dependensi via Dependabot — Next.js 16, Prisma 7 (prisma.config.ts, adapter pg, generator prisma-client),
  TypeScript 7 (tsconfig types node), actions v7; `scripts/ci-run.sh` menampilkan error CI sebagai anotasi. ClickUp: task harga plan selesai,
  task baru branch protection, PSE, review hukum, uji pulihkan backup, 3 task Tahap 1 untuk Claude.

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
