# JASA — Patungan Akun Premium

Repo ini berisi **seluruh struktur bisnis** jualan patungan / langganan premium bersama
(terinspirasi model marketplace seperti joinbareng.com): model bisnis, workflow order,
rules (syarat & ketentuan), SOP admin, template pesan, skill Claude, dan landing page.

## Struktur

| Path | Isi |
|---|---|
| `CLAUDE.md` | Aturan kerja untuk Claude saat membantu bisnis ini |
| `docs/01-model-bisnis.md` | Konsep, kategori produk, hitungan margin |
| `docs/02-struktur-website.md` | Halaman & section website |
| `docs/03-workflow-order.md` | Alur order dari chat sampai renewal |
| `docs/04-rules-syarat-ketentuan.md` | Syarat & ketentuan untuk pembeli (garansi, larangan, refund) |
| `docs/05-sop-admin.md` | SOP harian/mingguan/bulanan admin |
| `docs/06-legal-risiko.md` | Risiko ToS, legalitas, mitigasi |
| `docs/07-marketing.md` | Strategi promosi & konten |
| `docs/08-clickup.md` | Struktur ClickUp untuk pengingat |
| `docs/09-benchmark-joinbareng.md` | Bedah lengkap joinbareng: 5 pilar, sitemap, fee, perlindungan pembeli, S&K, harga |
| `docs/10-marketplace-escrow.md` | Marketplace multi-seller, status & timer escrow, saldo, ulasan |
| `docs/11-jasa-bayar.md` | Jasa bayar layanan luar negeri: kurs, fee, alur, aturan |
| `docs/12-papan-permintaan.md` | Papan permintaan & penawaran |
| `docs/13-seller-kyc-payout.md` | Daftar seller, KYC, level, payout, sanksi |
| `docs/14-arsitektur-teknis.md` | Stack, model data, keamanan, roadmap tahap 0–5 |
| `site/` | Landing page statis (`index.html` + `produk.json`) |
| `templates/pesan-whatsapp.md` | Template balasan WA / DM |
| `.claude/skills/` | Skill Claude: proses order, update katalog, cek renewal, komplain garansi, proses jasa bayar, onboarding seller, mediasi sengketa, riset kompetitor |

## Mulai cepat

1. Isi harga & stok di `site/produk.json` (lihat skill `update-katalog`).
2. Ganti nomor WA di `site/index.html` (cari `62XXXXXXXXXX`).
3. Deploy folder `site/` ke GitHub Pages / Netlify / Vercel.
4. Jalankan SOP harian di `docs/05-sop-admin.md`; pengingat ada di ClickUp.
