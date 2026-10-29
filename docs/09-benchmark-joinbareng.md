# 09 — Benchmark: joinbareng.com

Hasil riset 2026-10-30 (dibaca via WebFetch + Chrome). Dipakai sebagai acuan struktur, **bukan untuk
disalin** (teks, logo, desain tetap milik mereka). Ulangi riset dengan skill `riset-kompetitor`.

## Identitas
- Badan usaha: PT (Garut, Jawa Barat). CS via WhatsApp + email + Instagram.
- Positioning: "marketplace patungan akun premium murah" — hemat sampai 80%, aman, bergaransi.
- Klaim kepercayaan: rating 4,9/5, 12.000+ joiner aktif, 1.000+ listing, seller terverifikasi (KYC).

## 5 pilar bisnis
| Pilar | URL | Inti | Sumber uang |
|---|---|---|---|
| Marketplace (Jual-Beli) | `/jual-beli` | Banyak seller jual akun/item/voucher/joki/top-up; dana ditahan escrow | Fee transaksi dari seller |
| Patungan | `/patungan` | Host punya langganan, joiner beli slot per bulan/tahun | Fee layanan dari joiner |
| Jasa Bayar | `/jasa-bayar` | Bayarkan layanan luar negeri (Steam, Apple, Midjourney, Claude, ChatGPT), pembeli bayar Rupiah | Fee jasa (mulai ±Rp50rb) + selisih kurs |
| Papan Permintaan & Penawaran | `/permintaan/beli`, `/penawaran/jual` | Pembeli posting kebutuhan + budget; seller menawar (bisa nego) | Mendorong transaksi marketplace |
| Jadi Penjual | `/jadi-penjual` | Onboarding seller: daftar gratis, verifikasi, listing langsung tayang | — |

## Sitemap
- Header: Logo · Akun · Keranjang · **Mulai Jualan** · menu (Marketplace, Patungan, Jasa Bayar, Permintaan) · bahasa
- Beranda: hero + 4 kartu pilar + kartu "Jadi Penjual" · CTA daftar · grid kategori (±20) · **ticker "baru saja beli"** (nama disensor) · tab produk (Rekomendasi/Terlaris/Termurah/Terbaru/Rating) · rak per kategori · papan permintaan & penawaran · **4 langkah belanja aman** · 4 badge kepercayaan · upsell Patungan & Jasa Bayar · ulasan asli · logo metode bayar · blog · FAQ · newsletter · footer
- Footer: Belanja · Perusahaan (Legalitas, Blog, Siaran Pers, Temukan Kami) · Bantuan (Pusat Bantuan, Perlindungan Pembeli, Hubungi Kami, Privasi, S&K) · Akun (Masuk, Daftar, Dasbor, Pesanan Saya)
- URL produk: `/jual-beli/<slug>-i.<sellerId>.<itemId>` · kategori `/jual-beli/kategori/<slug>`

## Kategori marketplace
Item, Akun, Roblox Games, Aplikasi & Software, Joki, Voucher, Streaming, Top Up Game, Jasa Freelance & Digital,
Pulsa & Utilitas, Koin Game, Server/Hosting/Domain, Top Up Login, Lisensi Software & Cloud, Source Code & Tools,
Aset & Template Kreatif, Game Key, Bahan Konten Siap Upload, Course & Edukasi Digital.
Kategori patungan: SVOD, Musik, Game, Software, eLearning, AI Coding, AI Video, AI Assistant, AI Productivity.

## Perlindungan pembeli (aturan sistem)
1. Dana ditahan; diteruskan ke seller saat pembeli tekan "Sudah bisa dipakai" **atau otomatis** saat masa cek habis tanpa laporan.
2. Setiap listing punya batas kirim (maks 24 jam). Seller diam 1 jam atau lewat batas → pembeli boleh batal, dana kembali penuh.
3. Masa cek minimal 3 hari, sampai 7 hari untuk listing bergaransi. Garansi > 7 hari = garansi toko.
4. Laporan ditinjau tim ≤ 1×24 jam → kirim ulang / refund sebagian / refund penuh. **Refund masuk saldo**, tidak bisa ditarik ke rekening.
5. Perlindungan hanya di dalam platform; chat otomatis menolak ajakan pindah ke WA/Telegram.
6. Notifikasi + email di tiap langkah: bayar diterima, dikirim, mendekati akhir masa cek, refund.
7. Tombol pembeli: "Ingatkan seller", "Batalkan & refund", "Ada masalah?" (kategori + screenshot).

## Biaya (dari S&K mereka)
- Patungan bulanan: 10% harga per orang + Rp8.000. Tahunan: 20% + Rp6.500. (Rp50.000 → fee Rp13.000.)
- Seller marketplace: hanya fee transaksi saat laku; tanpa biaya bulanan/listing (persen tidak dipublikasi).
- Jasa bayar: fee mulai Rp50.000; banyak produk "cek tarif".

## Poin S&K penting
Data akun wajib benar; < 18 th perlu izin wali · host wajib akun aktif & legal · dilarang berbagi di luar platform,
jual ulang tanpa izin, memberi akses ke non-anggota · pembayaran final kecuali kesalahan platform · berhenti kapan
saja tanpa refund periode berjalan · sengketa: mediasi ≤ 3 hari kerja, putusan platform mengikat, lalu hukum RI ·
sanksi bertingkat: peringatan → suspend → bekukan → ban + lapor · platform tidak bertanggung jawab atas blokir penyedia.
Catatan: S&K mereka tidak konsisten soal pemberitahuan perubahan — kita tulis satu aturan yang jelas.

## Pembayaran
Payment gateway: QRIS, VA (BNI, BSI, BRI, Mandiri, Permata, Sahabat Sampoerna, BJB, CIMB), kartu kredit, Indomaret.

## Contoh harga patungan (per bulan, Okt 2026)
Netflix 52rb · Spotify 91rb · YouTube Premium 85rb · ChatGPT Plus 91rb · Microsoft 365 48rb · Perplexity 74rb ·
Cursor Pro 137rb · Gemini 86rb · Apple Music 32rb · Prime Video 33rb · CapCut Pro 643rb/th · Duolingo 243rb/th.
Marketplace: Netflix 1 bln 13rb, Canva invite 3rb, Google AI Pro 1 th 50rb, GetContact 10–12rb.

## Yang TIDAK kita tiru
- Patungan/“credential” akun yang ToS-nya melarang berbagi (mis. Claude Pro/Max, Claude Code, ChatGPT Plus pribadi): risiko blokir tinggi dan melanggar ketentuan penyedia. Pakai skema seat resmi (lihat `06-legal-risiko.md`).
- Listing jual akun keuangan ber-KYC (mis. akun Airwallex/e-wallet terverifikasi), akun "old Gmail" massal, data pribadi — dilarang.
- Ulasan/ticker palsu. Ticker "baru saja beli" hanya dari order nyata.
