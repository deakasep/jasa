# STATUS — backup progres (baca ini PERTAMA di setiap sesi baru)

Terakhir diperbarui: 2026-10-31 (sesi Claude Code). Perbarui file ini di akhir setiap sesi kerja.

## Keputusan pemilik (jangan diulang/ditanyakan lagi)
1. Tiru **penuh** joinbareng.com: struktur, mekanisme, rules, skill, QA/QC — **kecuali tampilan web** (dibuat sendiri paling akhir). ADR `docs/adr/0001`.
2. **Fee sama dengan joinbareng** → `config/fee.json` (satu-satunya tempat angka).
3. Target **enterprise** (`docs/21-enterprise.md`), kerjakan satu per satu, pakai Claude Code otomatis bila perlu.
4. Pengecualian yang tidak ditiru: patungan akun AI pribadi/plan single-user (→ jasa bayar), konten dewasa, akun keuangan ber-KYC, ulasan palsu.
5. Git: push → PR langsung di-merge bila check `QA` hijau; merah = perbaiki dulu.
6. **Perintah pemilik di chat = persetujuan**; tidak ada langkah konfirmasi terpisah (30 Okt).
7. Skill/plugin hanya yang aman, **bukan pihak ketiga**, dan berguna; dikunci commit di `.claude/VENDORED.md` (30 Okt).
8. JASA dan CLAU AI **tidak dicampur** (repo, ClickUp folder "JASA – Patungan Premium" vs "CLAW AI"). JASA tiru joinbareng; CLAU tiru Sintra.
9. **Backup di GitHub** (file ini) supaya akun Claude baru langsung nyambung. Akun GitHub: `deakasep`. Kalau sesi berhenti karena
   batas kuota: sesi berikutnya / tugas terjadwal "Lanjutkan antrian Claude" melanjutkan dari **Antrian Claude** di bawah.
11. **Tanpa kartu kredit/debit** — hanya QRIS, VA, e-wallet, Indomaret/Alfamart lewat Xendit/Tripay (`config/pembayaran.json`). Situs **Bahasa Indonesia saja**.
    Marketplace game **ramping**: 7 game paling laku (ML, FF, Roblox, PUBG, EA FC, Minecraft, Brawl Stars), tab **Rekomendasi**, schema.org + piksel iklan
    setelah persetujuan cookie (31 Okt, `docs/22` §6, `docs/24` §3b).
10. Saat omzet besar → model fee diubah seperti Shopee (`docs/19` §Banding Shopee).

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
- **Branch protection aktif** (ruleset "main", 30 Okt): branch utama wajib lewat PR, check `Cek repo` + `Platform` harus hijau,
  tidak bisa dihapus/force-push. Push langsung ke branch utama ditolak → selalu: branch baru → PR → merge saat hijau.
- **Pembayaran siap disambungkan** (30 Okt siang): pengolah pembayaran bersama Xendit+Tripay (`domain/pembayaran.ts` + `server/payments/proses.ts`;
  nominal beda / pesanan kadaluarsa → masuk audit `pembayaran.perlu_tinjau`, tidak error), klien invoice Xendit & Tripay
  (`server/payments/invoice.ts`, diuji dengan fetch palsu), seed katalog (`npm run db:seed`). Total 57 test.
- **Harga otomatis Jasa Bayar + pengaman** (30 Okt malam): harga Rupiah final di web (Claude Pro $20 = Rp422.000 @16.500), kurs otomatis,
  pantau harga penyedia, cek checkout, untung bersih (`hitung.py jasa-bayar-bersih`). Cloud pascabayar nonaktif. 96 test (`docs/23` §6).
  **Syarat buka Jasa Bayar:** kartu virtual per order (pemilik pilih penyedia) + konfirmasi akuntan soal dasar pajak.
- **Jasa Bayar layanan apa saja + ulasan semua pilar** (30 Okt malam): katalog 39 kategori, jalur Layanan lain, cara bayar per jenis
  (cloud AWS/Azure: bayar tagihan sekali, kartu dilepas), ulasan & testimoni & ticker dari data asli, strip kepercayaan otomatis (`docs/23`). 74 test.
- **Audit kelengkapan joinbareng** (30 Okt sore): halaman publik dibandingkan dengan repo; celah kategori marketplace, papan penawaran,
  blog ditutup di `docs/22`. Yang tidak bisa ditiru tanpa login (dashboard, form listing, chat, checkout) dirancang sendiri.
  **Menunggu keputusan pemilik:** buka kategori Joki / Top Up Login / Akun atau tidak.
- **Audit ulang menu footer** (31 Okt, lewat browser): semua menu Belanja/Perusahaan/Bantuan/Akun dicocokkan. Fee **tidak berubah**
  (artikel fee masih versi 29/05/2026; fee seller marketplace tetap tidak dipublikasi). Celah ditutup di `docs/24`: Siaran Pers,
  Temukan Kami (akun resmi + tools gratis SEO + schema.org), blok identitas & lowongan di Hubungi Kami, daftar kini Google + email saja,
  tombol Ingatkan seller/Batalkan & refund/Ada masalah?, tab Rekomendasi, rak beranda, daftar metode bayar, klaim Jasa Bayar 2.370+ produk.
- **Keputusan 31 Okt diterapkan**: `config/pembayaran.json` + `domain/metodeBayar.ts` (invoice Xendit hanya kanal lokal, Tripay tolak kanal kartu),
  `domain/rekomendasi.ts` (tab Rekomendasi + tolak listing game di luar 7 game fokus), privasi §9 cookie & piksel. 113 test.
- ClickUp folder **JASA – Patungan Premium** (ID di `docs/08-clickup.md`): 10 list, pengingat setup, roadmap, QA/QC.

- **Keputusan 30 Okt:** omzet besar → model fee diubah seperti Shopee (pemicu & rincian `docs/19` §Banding Shopee).

## Langkah berikutnya (urut) — task ClickUp sudah dibuat untuk semua
1. Pemilik: daftar **NIB** (OSS) → **PSE** Komdigi → akun payment gateway (Xendit/Tripay) mode sandbox.
2. Pemilik: beli plan induk pertama (Netflix/YouTube Family), siapkan vault password + 2FA.
3. Claude: **tinggal isi key sandbox** → uji invoice & webhook nyata; lalu halaman checkout minimal (kode sudah siap, menunggu akun gateway).
4. Claude: dashboard admin (antrian aksi cron, batch, refund) dengan RBAC; eksekusi aksi cron (`?jalankan=1`) + notifikasi WA/email.
5. Claude: migrasi database pertama (`npm run db:migrate`) + `npm run db:seed` — menunggu DATABASE_URL (Supabase/Neon, gratis).
6. QA rilis Tahap 1 (skill `qa-uji-alur`), lalu desain web (paling akhir).

## Antrian Claude (dikerjakan AI tanpa menunggu pemilik; urut — `[x]` + nomor PR bila selesai)
- [x] Siapkan halaman checkout minimal + dashboard admin (RBAC, antrian aksi cron, batch, refund) dengan data contoh, tanpa gateway nyata — PR #19 (`/checkout`, `/admin`, 104 test)
- [ ] Eksekusi aksi cron (`?jalankan=1`) + notifikasi WA/email (mode uji, tanpa kirim ke pihak luar)
- [ ] Rekonsiliasi harian gateway ↔ ledger (skill `reconciliation`) sebagai fungsi domain + test
Butuh pemilik dulu (bukan antrian, semua sudah jadi task ClickUp tag `keputusan-pemilik`/`butuh-pemilik`): nama brand + domain + email resmi,
bentuk badan usaha → NIB → PSE → gateway sandbox, DATABASE_URL, kartu virtual, akuntan, penyedia WA API + email, akun iklan (ID piksel),
keputusan kategori Joki/Top Up Login/Akun, review kuartal 7 game fokus.

## Kendala lingkungan yang diketahui
- Sesi cloud Claude: registry npm diblokir kebijakan jaringan (403) → test domain jalan dengan `node --experimental-strip-types --test`
  tanpa dependensi; install/typecheck/build Next.js diverifikasi di GitHub Actions.
- Fee seller marketplace joinbareng belum dipublikasikan (task ClickUp konfirmasi).
