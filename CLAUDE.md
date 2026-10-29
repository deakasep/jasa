# CLAUDE.md — Aturan kerja bisnis JASA

Bahasa: balas pemilik dalam Bahasa Indonesia santai, jelas, singkat.

## Konteks
Bisnis digital ala joinbareng.com dengan 4 pilar: **Patungan** (slot langganan), **Jasa Bayar** (bayar layanan luar
negeri pakai Rupiah), **Marketplace escrow** (multi-seller), **Papan Permintaan**. Urutan jalan: Patungan → Jasa Bayar → Marketplace.

Sumber kebenaran:
- Katalog & harga patungan: `site/produk.json`
- Model bisnis & fee: `docs/01-model-bisnis.md`
- Struktur website & sitemap: `docs/02-struktur-website.md`
- Alur order patungan: `docs/03-workflow-order.md`
- Rules pembeli/seller (semua pilar): `docs/04-rules-syarat-ketentuan.md`
- SOP admin: `docs/05-sop-admin.md` · Legal & risiko: `docs/06-legal-risiko.md` · Marketing: `docs/07-marketing.md`
- ClickUp (ID list): `docs/08-clickup.md`
- Benchmark joinbareng: `docs/09-benchmark-joinbareng.md`
- Marketplace & escrow: `docs/10-marketplace-escrow.md` · Jasa Bayar: `docs/11-jasa-bayar.md`
- Papan permintaan: `docs/12-papan-permintaan.md` · Seller/KYC/payout: `docs/13-seller-kyc-payout.md`
- Arsitektur teknis & roadmap: `docs/14-arsitektur-teknis.md`
- Template pesan: `templates/pesan-whatsapp.md`

## Aturan
1. Jangan pernah menyimpan password/email akun pelanggan, akun induk, data KTP/KYC, nomor kartu atau rekening di repo
   maupun ClickUp. Kredensial hanya di password manager. Repo boleh berisi kode slot saja (mis. `NFX-03`).
2. Setiap perubahan harga/fee: ubah file sumbernya, catat di `docs/CHANGELOG.md`, commit.
3. Setiap order/kejadian → task ClickUp di list yang sesuai (Order Aktif, Jasa Bayar, Sengketa & Escrow, Seller & KYC)
   dengan due date = tanggal habis / batas tindakan. Tanggal dihitung dari `clickup_get_user.current_time`.
4. Utamakan produk dengan skema resmi (family/duo/team, reseller resmi). Jangan jual patungan akun yang ToS-nya melarang
   berbagi (mis. akun AI pribadi). Baca `docs/06-legal-risiko.md` sebelum menambah produk/kategori.
5. Pakai skill di `.claude/skills/`: `proses-order`, `cek-renewal`, `komplain-garansi`, `update-katalog`,
   `proses-jasa-bayar`, `onboarding-seller`, `mediasi-sengketa`, `riset-kompetitor`.
6. Riset situs lain: hanya baca halaman publik (WebFetch dulu, Chrome bila perlu); jangan login/isi form/beli; tulis ulang
   dengan kata sendiri.
7. Git: setelah push, PR langsung di-merge; jika ada check merah, perbaiki dulu sampai hijau baru merge.
