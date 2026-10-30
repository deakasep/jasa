# 24 — Audit menu footer joinbareng (31 Okt 2026) + halaman yang belum ada spesifikasinya

Audit ulang per menu footer joinbareng.com (dibuka langsung lewat browser, 2026-10-31) dibandingkan isi repo.
Teks ditulis ulang dengan kata kita; tampilan tetap dirancang sendiri di akhir (ADR 0001).

## 1. Hasil per menu

| Menu | URL joinbareng | Status di repo | Dokumen |
|---|---|---|---|
| **Belanja** · Marketplace | `/jual-beli` | ✅ lengkap | `10`, `22` |
| Patungan | `/patungan` | ✅ lengkap | `15`, `03` |
| Jasa Bayar | `/jasa-bayar` | ✅ lengkap (catatan §3.4) | `11`, `23` |
| Permintaan & Penawaran | `/permintaan/beli`, `/penawaran/jual` | ✅ lengkap | `12` |
| **Perusahaan** · Legalitas | `/legalitas` | ✅ lengkap | `06` |
| Blog | `/blog` | ✅ rencana ada | `07`, `22` |
| Siaran Pers | `/press-release` | ❌ **baru disebut di sitemap → ditutup di §2.1** | ini |
| Temukan Kami | `/temukan-kami` | ❌ **belum ada → ditutup di §2.2** | ini |
| **Bantuan** · Pusat Bantuan | `/help` (7 kategori) | ✅ 63 artikel | `20` |
| Perlindungan Pembeli | `/perlindungan-pembeli` | ✅ aturan lengkap; tombol aksi dilengkapi §2.4 | `10` |
| Hubungi Kami | `/contact-us` | ⚠️ kurang blok identitas & lowongan → §2.3 | ini, `05` |
| Kebijakan Privasi | `/privacy-policy` | ✅ | `17` |
| Syarat & Ketentuan | `/terms-and-conditions` | ✅ | `04` |
| **Akun** · Masuk / Daftar | `/login`, `/sign-up` | ⚠️ cara daftar berubah → §2.5 | `20` §B |
| Dasbor | `/dashboard` | ✅ (dirancang sendiri, perlu login) | `02`, `14` |
| Pesanan Saya | `/dashboard/orders` | ✅ | `02`, `10` |

## 2. Spesifikasi halaman yang ditambahkan

### 2.1 Siaran Pers (`/siaran-pers`)
- Isi joinbareng saat ini: pengantar singkat "area pers", ajakan media menghubungi kantor pers, tombol **Kirim Email**. Belum ada daftar rilis.
- Kita: pengantar + **daftar rilis** (judul, tanggal, ringkasan, tautan PDF) + **kit media** (logo, deskripsi perusahaan 1 paragraf,
  angka resmi dari data asli saja) + email pers khusus (`pers@<domain>`). Rilis pertama: peluncuran JASA setelah NIB & PSE terbit.
- Aturan: angka di rilis wajib sama dengan strip kepercayaan otomatis (`02` §Strip) — tidak boleh angka tulisan tangan.

### 2.2 Temukan Kami (`/temukan-kami`)
Fungsi ganda di joinbareng: (a) **daftar akun resmi** supaya pengguna bisa memastikan akun asli, (b) **jaringan tautan** untuk SEO.
- Bagian: tanggal "terakhir diperbarui" · paragraf tujuan halaman · **peringatan akun palsu** (akun atas nama kita yang tidak tercantum = bukan milik kita,
  tanya dulu lewat Hubungi Kami) · daftar isi · per bagian: nama platform — handle — keterangan — badge **Resmi** (bila dikelola sendiri) — "Ditambahkan <tanggal>".
- Bagian joinbareng: Akun Resmi & Sosial Media (TikTok, X, Instagram) dan **Tools Open Source** (11 kalkulator/alat gratis berbahasa Indonesia,
  masing-masing punya halaman dokumentasi GitHub Pages + repo GitHub, plus satu direktori tools). Bagian liputan media & direktori disebut di pengantar.
- Kita tiru strukturnya: Akun Resmi · Tools Gratis · Liputan Media · Direktori & Komunitas. Tools gratis = taktik SEO/backlink: bikin alat kecil yang
  relevan dengan pembeli kita (contoh: kalkulator hemat patungan, kalkulator kurs + fee jasa bayar, pengingat tanggal perpanjangan, kalkulator split tagihan),
  open source di akun GitHub perusahaan, tiap tool menautkan balik ke situs. Rencana konten → `07-marketing.md` §SEO.
- Juga pasang **data terstruktur schema.org** (Organization: nama, logo, deskripsi, `sameAs` = akun resmi, contactPoint ke Hubungi Kami;
  WebSite, bahasa `id-ID` saja) di semua halaman — joinbareng memakainya.

### 2.3 Hubungi Kami (`/hubungi-kami`) — tambahan
- Kartu: **Mulai percakapan** (chat CS, jam operasional), **Lowongan** (tautan LinkedIn perusahaan), **Siaran Pers** (ke §2.1).
- Blok **Kontak resmi**: nama PT, alamat kantor lengkap, **NIB**, WhatsApp CS + jam, email. Diisi setelah NIB terbit (task ClickUp "Daftar NIB di OSS").
- Jam joinbareng sebagai acuan: chat CS Senin–Jumat 10.00–18.00, WhatsApp 08.00–16.00 WIB (`05` §Jam layanan).

### 2.4 Perlindungan Pembeli — tombol aksi di Pesanan Saya
Alur joinbareng (ditiru, lengkapi `10-marketplace-escrow.md`):
1. Belum dikirim → tombol **Ingatkan seller**; bila seller diam 1 jam / lewat batas kirim → **Batalkan & refund** (dana penuh ke saldo).
2. Sudah dikirim tapi bermasalah → **Ada masalah?** sebelum masa cek habis → pilih kategori masalah → lampirkan bukti (screenshot).
3. Keputusan tim di chat pesanan ≤ 1×24 jam: kirim ulang / refund sebagian / refund penuh (ke saldo, tidak bisa ditarik).
4. Notifikasi + email pada 4 titik: pembayaran diterima, pesanan dikirim, **mendekati akhir masa cek**, dana dikembalikan.

### 2.5 Daftar / Masuk — berubah sejak riset 30 Okt
- Sekarang hanya **Google** dan **email** (Facebook & X tidak tampil lagi). Kita: Google + email (+ OTP WhatsApp untuk host, `14`).
- Di bawah form ada 3 pernyataan: setuju S&K; data diproses platform sebagai pengendali data (tautan Kebijakan Privasi);
  pengguna bisa menerima email promo dan **berhenti kapan saja** lewat tautan di email atau halaman Profil (sesuai UU PDP, `17`).

## 3. Temuan lain di beranda & halaman pilar

1. **Tab urutan produk** di beranda: Rekomendasi · Terlaris · Termurah · Terbaru · Rating tertinggi (kita belum punya "Rekomendasi").
2. **Rak produk beranda** setelah "Beli langsung dari seller terverifikasi": Akun Premium Trending Bulan Ini · Lainnya · Gamepass · Gift Item · Akun · Pets,
   lalu Permintaan & Penawaran Custom (Lagi Dicari / Lagi Ditawarkan, label "Bisa nego"), Cara Belanja Aman (4 langkah), "Lebih dari sekadar beli"
   (Patungan + Jasa Bayar), Ulasan Asli Pembeli, Metode Bayar, Blog, FAQ, Newsletter. Kotak sambutan dengan tombol Daftar/Masuk untuk tamu.
3. **Metode bayar yang ditampilkan:** QRIS; VA BNI, BSI, BRI, Mandiri, Permata, Sahabat Sampoerna, BJB, CIMB; kartu kredit Visa/Mastercard; Indomaret.
4. **Jasa Bayar** sekarang mengklaim **2.370+ produk** (kita: 39 kategori, 35 produk benih + jalur Layanan lain). Fee "mulai Rp50.000" — sama dengan `config/fee.json`.
5. Klaim beranda: "hemat hingga 80%", "100+ layanan patungan", "1.000+ listing seller terverifikasi", "live chat 24/7". Kita tampilkan klaim sejenis **hanya bila
   datanya ada** (aturan strip kepercayaan `02`).
6. Pilihan bahasa (id/en) di header → situs dwibahasa. **Kita: Bahasa Indonesia saja** (keputusan pemilik 31 Okt); schema.org `inLanguage` = `id-ID`.
7. Situs memakai piksel iklan (Facebook dll.) untuk iklan berbayar → wajib disebut di Kebijakan Privasi & banner cookie (`17`).

## 3b. Keputusan pemilik atas temuan §3 (31 Okt 2026)
| Temuan | Keputusan | Di repo |
|---|---|---|
| Tab Rekomendasi | **Ditiru**, skor dari data asli tanpa iklan | `22` §6, `app/src/domain/rekomendasi.ts` |
| Rak Trending/Gamepass/Gift Item/Pets | **Ramping**: hanya game paling laku di Indonesia (7 game) | `22` §6, `data/kategori-marketplace.json` |
| Metode bayar | **Tanpa kartu kredit/debit**; QRIS, VA, e-wallet, Indomaret/Alfamart lewat gateway Indonesia (Xendit/Tripay) | `config/pembayaran.json`, `app/src/domain/metodeBayar.ts` |
| Pilihan bahasa | **Bahasa Indonesia saja** (tidak ada id/en) | §3 butir 6 diganti |
| schema.org + piksel iklan | **Ditiru**; piksel hanya setelah persetujuan cookie | `17` §9, §2.2 |

## 4. Fee — dicek ulang 31 Okt 2026: TIDAK berubah
- Artikel bantuan "Berapa biaya yang harus saya bayar" masih versi **29/05/2026**: joiner bulanan 10% + Rp8.000, tahunan 20% + Rp6.500 per bulan,
  connection fee host 25% maks Rp5.000 / 20% maks Rp6.000 hanya bulan pertama per joiner baru (berlaku lagi bila joiner pindah grup). = `config/fee.json`.
- Jadi Penjual: "pendaftaran gratis, hanya fee transaksi kecil saat terjual, tanpa biaya bulanan/posting" — **persen tetap tidak dipublikasikan**
  (kita tetap 5% min Rp1.000 sementara). Pencairan saldo ke bank ≤ 1×24 jam kerja, penarikan min Rp50.000 — sama dengan `config/fee.json`.
- Jasa Bayar: fee mulai Rp50.000 — sama.
