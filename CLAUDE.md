# CLAUDE.md — Aturan kerja bisnis JASA

Bahasa: balas pemilik dalam Bahasa Indonesia santai, jelas, singkat.

## Mulai & akhiri sesi (backup ingatan)
- **Mulai**: baca `STATUS.md` (keputusan, persen pendapatan, langkah berikutnya) — jangan mulai dari nol.
- **Akhiri**: perbarui `STATUS.md` + `docs/CHANGELOG.md`, jalankan QA, commit & push.

## Konteks
Bisnis digital yang **meniru penuh struktur, mekanisme, aturan, dan fee joinbareng.com** (keputusan pemilik 2026-10-30);
tampilan web dibuat sendiri paling akhir. 5 pilar: **Patungan** (batch plan resmi + grup host), **Jasa Bayar**, **Marketplace escrow**,
**Papan Permintaan/Penawaran**, **Jadi Penjual**. Urutan jalan: Patungan → Jasa Bayar → Marketplace.

Sumber kebenaran:
- Benchmark joinbareng (acuan utama): `docs/09-benchmark-joinbareng.md` · harga pembanding: `data/harga-pembanding.json`
- **Fee & timer (satu-satunya tempat angka)**: `config/fee.json` · kalkulator: `scripts/hitung.py`
- Katalog patungan: `site/produk.json` · Model bisnis: `docs/01-model-bisnis.md` · Sitemap: `docs/02-struktur-website.md`
- Alur patungan: `docs/03-workflow-order.md` + `docs/15-patungan-batch.md`
- Rules/S&K semua pengguna: `docs/04-rules-syarat-ketentuan.md` · Privasi: `docs/17-kebijakan-privasi.md` · FAQ: `docs/18-faq.md`
- SOP admin & jam layanan: `docs/05-sop-admin.md` · Legal & plan yang diizinkan: `docs/06-legal-risiko.md` · Marketing: `docs/07-marketing.md`
- ClickUp (ID list): `docs/08-clickup.md`
- Marketplace & escrow: `docs/10-marketplace-escrow.md` · Jasa Bayar: `docs/11-jasa-bayar.md`
- Papan permintaan: `docs/12-papan-permintaan.md` · Seller/KYC/payout: `docs/13-seller-kyc-payout.md`
- Arsitektur teknis & roadmap: `docs/14-arsitektur-teknis.md`
- **QA & QC**: `docs/16-qa-qc.md` · cek otomatis: `scripts/qa_check.py` (GitHub Actions `QA`)
- Template pesan: `templates/pesan-whatsapp.md`
- **Persen pendapatan (pembeli vs penjual)**: `docs/19-pendapatan.md` · Pusat bantuan (63 artikel ditiru): `docs/20-pusat-bantuan.md`
- Kategori marketplace, papan penawaran, blog: `docs/22-marketplace-kategori.md` · data: `data/kategori-marketplace.json`
- Katalog Jasa Bayar, layanan lain, ulasan & ticker semua pilar: `docs/23-jasa-bayar-katalog.md` · data: `data/jasa-bayar-katalog.json` · ambang: `config/kepercayaan.json`
- **Standar enterprise** (RBAC, audit, keamanan, backup/DR, insiden, kepatuhan): `docs/21-enterprise.md` · keputusan: `docs/adr/`
- **Platform** (Next.js + Prisma, domain murni + test): `app/` — `app/README.md`

## Aturan
1. Jangan pernah menyimpan password/email akun pelanggan, akun induk, data KTP/KYC, nomor kartu atau rekening di repo
   maupun ClickUp. Kredensial hanya di password manager. Repo boleh berisi kode slot saja (mis. `NFX-4`).
2. Angka fee/timer hanya diubah di `config/fee.json` (default = sama dengan joinbareng). Setiap perubahan harga/fee/aturan:
   ubah file sumbernya, catat di `docs/CHANGELOG.md`, jalankan `python3 scripts/qa_check.py`, commit.
3. Setiap order/kejadian → task ClickUp di list yang sesuai (Order Aktif, Jasa Bayar, Sengketa & Escrow, Seller & KYC, QA & QC)
   dengan due date = tanggal habis / batas tindakan. Tanggal dihitung dari `clickup_get_user.current_time`.
4. Tiru joinbareng sepenuhnya, **kecuali** yang dicatat di `docs/09-benchmark-joinbareng.md` §10: patungan plan pribadi/single-user
   (mis. akun AI pribadi — arahkan ke Jasa Bayar), konten dewasa, akun keuangan ber-KYC, ulasan palsu. Teks/desain mereka tidak disalin
   mentah; tulis ulang dengan kata kita.
5. Komponen Claude pihak luar (review PR, rekonsiliasi) & aturan keamanannya: `.claude/VENDORED.md`. Pakai skill di `.claude/skills/`: `proses-order`, `cek-renewal`, `komplain-garansi`, `update-katalog`, `proses-jasa-bayar`,
   `onboarding-seller`, `mediasi-sengketa`, `riset-kompetitor`, `qc-harian`, `qa-uji-alur`, `qc-listing-host`.
6. Riset situs lain: hanya baca halaman publik (WebFetch dulu, Claude in Chrome bila perlu); jangan login/isi form/beli.
7. Git: branch utama dilindungi ruleset — kerja di branch baru → push → buka PR → merge (squash) begitu check `Cek repo` & `Platform`
   hijau; jika merah, perbaiki dulu sampai hijau baru merge. Push langsung ke branch utama akan ditolak.
8. Kode: uang = integer Rupiah; mutasi saldo hanya lewat ledger (`app/src/domain/ledger.ts`); setiap fitur baru wajib test
   (`cd app && npm test`); angka fee dibaca dari `config/fee.json`, tidak pernah ditulis di kode.
