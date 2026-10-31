# JASA — Patungan, Jasa Bayar & Marketplace Digital

Repo ini berisi **seluruh struktur bisnis** yang meniru penuh joinbareng.com (struktur, mekanisme, aturan, fee), ditulis ulang
dengan kata sendiri. Tampilan web dibuat terakhir. Panduan kerja Claude: `CLAUDE.md`.

## Struktur

| Path | Isi |
|---|---|
| `docs/01-model-bisnis.md` | 5 pilar, sumber pendapatan, rumus harga slot + fee |
| `docs/02-struktur-website.md` | Sitemap & halaman |
| `docs/03-workflow-order.md` | Alur order patungan (batch) |
| `docs/04-rules-syarat-ketentuan.md` | S&K semua pengguna: akun, larangan, garansi, refund, sanksi, barang terlarang |
| `docs/05-sop-admin.md` | SOP harian/mingguan/bulanan, jam layanan |
| `docs/06-legal-risiko.md` | Pernyataan legalitas, plan yang diizinkan, risiko |
| `docs/07-marketing.md` | Kanal, konten SEO, promo, retensi |
| `docs/08-clickup.md` | Struktur & ID list ClickUp |
| `docs/09-benchmark-joinbareng.md` | Bedah lengkap joinbareng (acuan utama) |
| `docs/10-marketplace-escrow.md` | Marketplace, status & timer escrow, halaman listing |
| `docs/11-jasa-bayar.md` | Jasa bayar: fee bertingkat, kurs, form, alur |
| `docs/12-papan-permintaan.md` | Papan permintaan & penawaran |
| `docs/13-seller-kyc-payout.md` | Seller, KYC, level, payout, sanksi |
| `docs/14-arsitektur-teknis.md` | Stack, model data, roadmap tahap 0–5 |
| `docs/15-patungan-batch.md` | Sistem batch, grup host, kode promo |
| `docs/16-qa-qc.md` | QA otomatis & manual, QC harian/mingguan, KPI, tindakan korektif |
| `docs/17-kebijakan-privasi.md` | Draf kebijakan privasi (UU PDP) |
| `docs/18-faq.md` | FAQ pembeli, joiner, seller |
| `docs/19-pendapatan.md` | **Berapa persen kita dapat dari pembeli & penjual** |
| `docs/20-pusat-bantuan.md` | Pusat bantuan (63 artikel joinbareng ditiru) |
| `docs/21-enterprise.md` | RBAC, audit, keamanan, backup/DR, insiden, kepatuhan |
| `docs/25-benchmark-gamsgo-shopee.md` | Bedah GamsGo (fee 4 lapis, garansi, head/tail payout, level seller) + pengamatan Shopee |
| `docs/adr/`, `docs/postmortem/` | Catatan keputusan & template post-mortem |
| `STATUS.md` | **Backup progres** — baca pertama tiap sesi |
| `app/` | Platform Next.js + Prisma: domain uang & alur + 42 test, webhook, cron |
| `config/fee.json` | Semua fee & timer (sama dengan joinbareng) |
| `data/harga-pembanding.json` | Harga publik joinbareng untuk pembanding |
| `scripts/hitung.py` | Kalkulator fee patungan / jasa bayar / seller |
| `scripts/qa_check.py` | Cek otomatis (dijalankan GitHub Actions `QA`) |
| `site/` | Landing statis sementara (`index.html` + `produk.json`) |
| `templates/pesan-whatsapp.md` | Template balasan WA / DM |
| `.claude/skills/` | 11 skill: order, renewal, komplain, katalog, jasa bayar, seller, sengketa, riset, QC harian, QA alur, QC listing/host |

## Mulai cepat
1. Baca `STATUS.md`. Lalu `python3 scripts/qa_check.py` → harus "SEMUA CEK LULUS"; `cd app && npm test`.
2. Cek harga plan resmi di `site/produk.json` (skill `update-katalog`).
3. Hitung harga: `python3 scripts/hitung.py patungan 50000 bulanan` · `python3 scripts/hitung.py jasa-bayar 20 16500`.
4. Jalankan SOP `docs/05-sop-admin.md`; pengingat ada di ClickUp folder **JASA – Patungan Premium**.
