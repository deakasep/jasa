# 09 — Benchmark: joinbareng.com (acuan utama, ditiru penuh kecuali tampilan)

Riset 2026-10-30 lewat WebFetch + Claude in Chrome (halaman publik saja). Keputusan pemilik: **tiru semua struktur,
mekanisme, aturan, dan fee joinbareng**; tampilan web dibuat sendiri di akhir. Semua teks ditulis ulang dengan kata kita.
Ulangi riset dengan skill `riset-kompetitor`.

## 1. Identitas & operasional
- PT berbadan hukum + NIB tercantum di halaman kontak. Kita: daftar NIB dulu (task ClickUp "Daftar NIB di OSS").
- Kanal: WhatsApp CS, email, Instagram, LinkedIn, siaran pers, blog. Chat dalam aplikasi untuk pesanan.
- Jam layanan mereka: CS chat Senin–Jumat 10.00–18.00, WhatsApp 08.00–16.00 WIB; tim jasa bayar 09.00–22.00 WIB.
  Kita tetapkan di `05-sop-admin.md` §Jam layanan.
- Payment gateway masuk: **Tripay** (mitra PJP berizin BI). Invoice jasa bayar & pencairan seller: **Xendit**. Platform tidak menyimpan data kartu.
- Klaim kepercayaan: rating 4,9/5, 12.000+ joiner, 1.000+ listing, 10.000+ transaksi jasa bayar, "zero permanent ban".

## 2. Lima pilar
| Pilar | URL | Dokumen kita |
|---|---|---|
| Patungan (batch plan resmi + grup host) | `/patungan`, `/patungan/<layanan>` | `15-patungan-batch.md`, `03-workflow-order.md` |
| Jasa Bayar | `/jasa-bayar`, `/jasa-bayar/<layanan>` | `11-jasa-bayar.md` |
| Marketplace escrow | `/jual-beli`, `/jual-beli/<slug>-i.<seller>.<item>` | `10-marketplace-escrow.md` |
| Papan Permintaan & Penawaran | `/permintaan/beli`, `/penawaran/jual` | `12-papan-permintaan.md` |
| Jadi Penjual | `/jadi-penjual` | `13-seller-kyc-payout.md` |

## 3. Fee (DISAMAKAN untuk kita)
| Layanan | Fee joinbareng = fee kita |
|---|---|
| Patungan bulanan (joiner) | 10% harga per orang + Rp8.000 |
| Patungan tahunan (joiner) | 20% harga per orang per bulan + Rp6.500 per bulan |
| Connection fee host | bulanan 25% maks Rp5.000 · tahunan 20% maks Rp6.000 · hanya bulan pertama per joiner baru · pribadi 0 |
| Jasa Bayar < US$70 | Rp50.000 flat |
| Jasa Bayar US$70–500 | 4% |
| Jasa Bayar > US$500 | 3,5% |
| Kurs Jasa Bayar | mid-market + spread 1,5%, terkunci jika invoice dibayar ≤ 30 menit |
| Seller marketplace | "fee transaksi kecil" saat terjual, tanpa biaya bulanan/posting (persen tidak dipublikasi → kita pakai 5% sementara, cek ulang saat daftar seller di sana) |
| Payout seller | ke rekening ≤ 1×24 jam kerja setelah diminta |
Sumber angka terpusat: `config/fee.json`.

## 4. Patungan — cara kerja mereka
- **Batch "Resmi"**: platform membeli plan multi-user resmi atas nama sendiri, buka batch preorder, pembeli bayar bagiannya,
  dana ditahan sampai batch penuh & diaktivasi, lalu akses dikirim otomatis ke email + dashboard. Bulan berikutnya ditagih via invoice otomatis.
  Layanan AI tertentu memakai **auto-provision** (aktif langsung tanpa menunggu penuh).
- **Grup host komunitas**: pengguna lain menjadi host (harga lebih murah, contoh Netflix 4 slot Rp27.500), joiner bisa chat host;
  kendala tidak selesai → eskalasi ke platform. (Halaman legalitas mereka justru menyatakan tidak menjadi perantara P2P —
  kita jalankan host komunitas hanya setelah verifikasi host, lihat `15-patungan-batch.md`.)
- Halaman layanan: rating & jumlah ulasan, harga "mulai", jumlah user per paket, tipe akses, info produk, benefit, pilihan paket
  (mis. 4 user Rp64.000 / 5 user Rp52.000), sisa slot, **kode promo**, tombol gabung grup WhatsApp, daftar grup Tersedia/Aktif
  dengan nama anggota disensor + "butuh N orang lagi", produk serupa, FAQ per layanan.
- Aturan per layanan (contoh Netflix): maks 4 anggota, 1 perangkat per joiner, kredensial tampil di dashboard setelah bayar,
  dilarang ubah email/password/pengaturan → dicabut permanen tanpa refund.
- Klaim akun bermasalah: refund penuh atau slot pengganti, diproses 1–3 hari kerja lewat dashboard.

## 5. Jasa Bayar — cara kerja mereka
Form: estimasi harga produk (USD, sebelum pajak), email akun produk, nama, WhatsApp, email bukti bayar, catatan →
WhatsApp terbuka dengan pesan terisi → admin konfirmasi harga final 1–3 menit → invoice (QRIS/VA/e-wallet), bayar ≤ 30 menit
untuk kunci kurs → diproses 1–5 menit → bukti/konfirmasi via WhatsApp & email. Akun tetap milik pembeli; kredensial hanya
dipakai saat proses dan tidak disimpan. H-3 sebelum perpanjangan dikonfirmasi lanjut/upgrade/stop. Upgrade tengah periode tanpa fee
tambahan. Refund 100% bila penyedia menolak. Akun JoinBareng dibuat otomatis untuk pembeli baru. Ticker "transaksi terbaru".
Setiap layanan punya halaman panjang (apa itu, kenapa butuh jasa bayar, alur, tips pilih paket, lama proses, testimoni, FAQ, artikel blog).

## 6. Marketplace — cara kerja mereka
- Halaman listing: kode produk (`JB-<id>`), harga, rating, terjual, jumlah, keranjang/beli sekarang, kartu seller (rating, chat, toko),
  badge perlindungan (escrow, refund saldo, garansi 7 hari, seller terverifikasi), statistik (dilihat, dalam antrian, % order sukses,
  waktu respon, terakhir diperbarui), jaminan penjual (garansi seller mis. 30 hari, batas kirim maks 24 jam), tab deskripsi/FAQ/ulasan.
- Perlindungan pembeli: dana ditahan sampai "Sudah bisa dipakai" atau masa cek habis · seller diam 1 jam / lewat batas kirim → batal, refund penuh ·
  masa cek ≥ 3 hari, 7 hari bila bergaransi (> 7 hari = garansi toko) · laporan diputus ≤ 1×24 jam (kirim ulang / refund sebagian / penuh) ·
  refund ke saldo, tidak bisa ditarik · hanya transaksi di platform · chat menolak ajakan pindah aplikasi · notifikasi + email tiap tahap.
- Seller: daftar gratis (email + WA, verifikasi singkat), listing langsung tayang & masuk pencarian tanpa iklan, boleh jual akun premium,
  voucher, slot patungan, jasa digital; produk fisik & ilegal dilarang.

## 7. Halaman wajib (sitemap)
Beranda · Marketplace · Patungan · Jasa Bayar · Permintaan · Penawaran · Jadi Penjual · Keranjang · Dashboard (Pesanan Saya, saldo) ·
Masuk/Daftar · Legalitas · Blog · Siaran Pers · Temukan Kami · Pusat Bantuan · Perlindungan Pembeli · Hubungi Kami · Kebijakan Privasi ·
S&K · newsletter. Detail di `02-struktur-website.md`.

## 8. Legalitas & privasi mereka (ditiru → `06-legal-risiko.md`, `17-kebijakan-privasi.md`)
- Posisi: pengelola plan resmi multi-user, bukan reseller akun bajakan; hanya plan yang ToS-nya mengizinkan multi-user
  (Spotify Family/Duo, YouTube Family, Apple One Family, M365 Family, Netflix multi-screen); plan single-user ketat tidak disediakan;
  tidak memakai akun OG/kartu curian/cracking; pengguna tetap wajib patuh ToS layanan.
- Mengacu UU 8/1999 Perlindungan Konsumen, UU 27/2022 PDP, UU ITE.
- Privasi: data yang dikumpulkan, cara, tujuan, pihak ketiga (pembayaran, aparat), keamanan, retensi, hak pengguna (akses, koreksi,
  hapus, tarik persetujuan), email promo maks 1/hari + berhenti langganan, cookie, tidak untuk anak < 13 th.

## 9. S&K mereka (ditiru → `04-rules-syarat-ketentuan.md`)
Data benar; < 18 th izin wali · anggota grup dianggap satu rumah tangga · host wajib akun aktif & legal · dilarang berbagi di luar
platform, jual ulang tanpa izin, akses untuk non-anggota · pembayaran final kecuali kesalahan platform · berhenti kapan saja tanpa refund
periode berjalan · mediasi ≤ 3 hari kerja, putusan platform mengikat, lalu hukum RI · sanksi bertingkat sampai ban + lapor · tidak
bertanggung jawab atas blokir penyedia · kompensasi diskresi untuk error sistem.

## 10. Yang tetap TIDAK kita tiru (alasan: bertentangan dengan halaman legalitas mereka sendiri / ToS penyedia / hukum)
- Patungan **akun AI pribadi** dengan berbagi email+password (mereka menjual "Claude Pro sharing account", "Development Mode (Credential)").
  Ini plan single-user — ToS Anthropic/OpenAI melarang berbagi, riwayat chat antar anggota saling terlihat, akun rawan diblokir.
  Ganti dengan: **Jasa Bayar** ke akun pembeli sendiri (diizinkan) atau seat Team/Business resmi.
- Jasa bayar layanan konten dewasa (OnlyFans, Fansly), akun keuangan ber-KYC (Airwallex dll.), akun "Gmail old" massal.
- Testimoni "representatif" yang bukan pembeli nyata → kita hanya pakai ulasan asli.

## 12. Pusat bantuan (63 artikel) — ditiru di `20-pusat-bantuan.md`
Temuan penting: fee host (connection fee 25% maks Rp5.000 / 20% maks Rp6.000, bulan pertama per joiner), fee joiner tahunan dihitung per bulan,
penerimaan instan & batas 48 jam host, batal permintaan setelah 2 menit, dompet (top-up min Rp50.000, tidak bisa ditarik, tidak kedaluwarsa),
referral Rp10.000, kode promo, skor kepercayaan 0–100, faktur opsional, publik vs pribadi (pribadi tanpa connection fee), custom sharing,
waiting list, KYC ≤ 72 jam (KTP/paspor/izin tinggal/SIM, dasar TPPU/TPPT), satu rekening bank, refund ≤ 48 jam (kredensial rusak ≤ 72 jam),
kode etik host/joiner, login Google/Facebook/X/email, satu orang satu akun, S&K versi bantuan (usia min 18 th, platform sebagai mediator).

## 11. Contoh harga pembanding (Okt 2026)
Lihat `data/harga-pembanding.json`.
