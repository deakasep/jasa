# ADR 0003 — Mengadopsi mekanisme marketplace GamsGo

- Tanggal: 2026-11-01 · Status: **diusulkan** (menunggu pemilik) · Sumber: `docs/25-benchmark-gamsgo-shopee.md`
- Konteks: ADR 0001 menetapkan joinbareng sebagai acuan penuh. Untuk **marketplace**, joinbareng tipis (295 listing, fee seller tidak
  dipublikasikan, garansi listing 0–7 hari). GamsGo menjalankan marketplace langganan yang jauh lebih matang dengan aturan terbuka.
  Marketplace baru jalan setelah Patungan dan Jasa Bayar, jadi keputusan ini tidak menghambat Tahap 1.

## Bagian A — diadopsi langsung (tidak mengubah fee/timer yang dikunci)
1. Filter listing: waktu kirim, seller online, plan, durasi, cara berbagi, garansi, % sukses seller.
2. Aturan judul listing: atribut SKU wajib; larangan klaim official/lifetime/never banned/termurah; maks 2 emoji; tanpa ejaan pelesetan.
3. Rentang harga wajar dipakai sebagai cek QC listing (skill `qc-listing-host`), belum sebagai penolakan otomatis.
4. Kategori berisiko (top up, item, koin, voucher) butuh tinjauan kedua; ditolak → jeda 30 hari.
5. Afiliasi (bila dibuka): ikatan referral permanen, komisi dipotong saat refund.

## Bagian B — butuh keputusan pemilik (mengubah aturan/angka di `config/fee.json`)
| # | Usulan | Sekarang | Alasan |
|---|---|---|---|
| B1 | Garansi minimum produk langganan = 1/3 masa layanan (1/4 untuk 1 tahun) | garansi 0–7 hari, masa cek 3–7 hari | pembeli terlindungi lebih lama → beda nyata dari Shopee |
| B2 | Dana seller cair setelah garansi, dengan kuota "head" per level | cair saat SELESAI | float kas + seller ikut menanggung risiko akun dicabut |
| B3 | Seller wajib menyelesaikan laporan ≤ 48 jam, lewat → refund otomatis; refund prorata sisa hari | putusan sengketa 24 jam, seller respon 1 jam | keluhan terbesar GamsGo justru refund lambat → jadikan USP |
| B4 | Level seller (`docs/13-seller-kyc-payout.md`) menentukan fee seller & kecepatan cair, dievaluasi tiap tanggal 1 | level usulan, fee 4% hanya untuk Unggulan | insentif kualitas |
| B5 | Fee seller marketplace per kategori, pembanding GamsGo 7,9–9,9% | 5% min Rp1.000 (sementara) | joinbareng tidak publikasi; GamsGo satu-satunya data terbuka |

Tidak diusulkan: fee bayar tambahan ke pembeli dan potongan "service fee" pada refund (bertentangan dengan keputusan biaya gateway
kita tanggung dan merusak kepercayaan; contoh keluhan GamsGo).

## Konsekuensi bila B disetujui
- Ubah `config/fee.json` (timer garansi, kuota cair, fee per kategori), `docs/10-marketplace-escrow.md`, `docs/13-seller-kyc-payout.md`,
  `docs/04-rules-syarat-ketentuan.md`, `docs/19-pendapatan.md`; tambah test di `app/src/domain/escrow.ts`.
- Menahan dana seller lebih lama memperbesar dana pihak ketiga yang kita pegang → cek aspek regulasi pembayaran (`docs/06-legal-risiko.md`)
  bersama akuntan/konsultan sebelum skala besar.
