# 22 — Kategori Marketplace, Papan Penawaran & Blog (tiruan joinbareng)

Sumber: halaman publik joinbareng.com yang dibaca 2026-10-30 (`/jual-beli`, `/jual-beli/kategori/joki`, `/jual-beli/kategori/top-up-login`,
`/penawaran/jual`, `/blog`). Melengkapi `10-marketplace-escrow.md` dan `02-struktur-website.md`. Data mesin: `data/kategori-marketplace.json`.

## 1. Taksonomi kategori (19 + "Semua")
| # | Kategori (nama tampil kita) | Slug | Jumlah listing mereka (30 Okt) | Status di JASA |
|---|---|---|---|---|
| 1 | Top Up Game | `top-up` | 219 | Ditiru |
| 2 | Game Key | `game-key` | 246 | Ditiru (hanya key resmi/retail; key grey-market ditolak QC) |
| 3 | Roblox Games | `rbl-games` | 191 | Ditiru (item/gamepass dalam game) |
| 4 | Akun | `akun` | 210 | **Perlu keputusan pemilik** (lihat §5) |
| 5 | Voucher | `voucher-code` | 67 | Ditiru |
| 6 | Koin Game | `koin-game` | 82 | Ditiru |
| 7 | Item | `item` | 197 | Ditiru |
| 8 | Joki | `joki` | 142 game | **Perlu keputusan pemilik** (lihat §5) |
| 9 | Top Up Login | `top-up-login` | 69 game | **Perlu keputusan pemilik** (lihat §5) |
| 10 | Streaming | `streaming` | 64 | Ditiru, tunduk aturan plan resmi `06-legal-risiko.md` |
| 11 | Pulsa & Utilitas | `pulsa-utilitas` | 31 | Ditiru |
| 12 | Aplikasi & Software | `aplikasi-software` | 587 | Ditiru, tanpa akun AI pribadi berbagi (§10 benchmark) |
| 13 | Jasa Freelance & Digital | `jasa-freelance` | 16 | Ditiru |
| 14 | Lisensi Software & Cloud | `lisensi-software` | 8 | Ditiru (lisensi resmi saja) |
| 15 | Aset & Template Kreatif | `aset-kreatif` | 17 | Ditiru (karya sendiri / lisensi jual-ulang) |
| 16 | Course & Edukasi Digital | `course-edukasi` | 14 | Ditiru (materi milik seller) |
| 17 | Server, Hosting & Domain | `server-hosting` | 9 | Ditiru |
| 18 | Source Code & Tools Developer | `source-code` | 11 | Ditiru (tanpa malware/cheat) |
| 19 | Bahan Konten Siap Upload | `konten-siap-upload` | 9 | Ditiru (hak pakai jelas) |

## 2. Struktur halaman
- **`/jual-beli`**: dropdown "Semua Kategori" + daftar kategori, blok **Game Populer**, urutan **Terpopuler · Termurah · Terbaru · Rating Tertinggi**,
  24 listing per halaman ("Menampilkan 1–24 dari N listing"), judul menyebut jumlah listing dari seller terverifikasi.
- **Kartu listing**: judul, harga Rupiah, nama toko, jumlah terjual (jika ada), rating + jumlah ulasan (jika ada). Tanpa badge di kartu.
- **Halaman kategori game** (`/jual-beli/kategori/<slug>`): daftar game A–Z dengan bilah lompat huruf (huruf kosong nonaktif), ubin = gambar + nama
  game → **hub game per kategori** `/jual-beli/<game>/<kategori>`. Teks penjelasan + FAQ per kategori (harga dari seller, bisa berubah; transaksi
  wajib di platform agar escrow berlaku; garansi seller mis. 3–7 hari; durasi beberapa jam s.d. hari).
- **Listing**: `/jual-beli/<slug>-i.<seller_id>.<item_id>` (detail di `10-marketplace-escrow.md`).
- **Metode bayar yang ditampilkan** (joinbareng): QRIS, VA 8 bank, kartu kredit Visa/Mastercard, Indomaret. **Kita: tanpa kartu kredit** — QRIS, VA, e-wallet, Indomaret/Alfamart lewat Xendit/Tripay (`config/pembayaran.json`).

## 3. Alur kategori "Top Up Login" (mereka)
1. Pilih listing (tertera metode login yang dibutuhkan + estimasi proses) → 2. bayar lewat escrow → 3. setelah lunas, berikan data yang diminta seller
   **lewat chat platform** → 4. konfirmasi setelah saldo masuk → dana cair ke seller.
Peringatan mereka: pakai password sementara lalu ganti, jangan beri akses email utama, jangan konfirmasi sebelum masuk, simpan bukti, laporkan ajakan
transfer langsung. Rata-rata 15 menit–2 jam. Seller lewat batas → batal + refund; sengketa dari menu pesanan.

## 4. Papan Penawaran Custom (`/penawaran/jual`)
Kebalikan Papan Permintaan (`12-papan-permintaan.md`): **seller** memasang penawaran bebas (judul, harga, umur posting, nama seller, status online,
tautan detail), filter kategori (mis. "AI") + jumlah entri. Pembelian tetap lewat escrow marketplace. Di JASA: dokumen `12` §Penawaran.

## 5. Kategori yang butuh keputusan pemilik sebelum dibuka
Mereka membukanya; kita tiru strukturnya, tapi **aktif hanya setelah pemilik memutuskan** karena risikonya nyata:
- **Joki** & **Top Up Login**: pembeli menyerahkan login akun game ke orang lain. Melanggar ToS banyak game (akun bisa diblokir) dan berisiko pencurian
  akun. Jika dibuka: kredensial hanya lewat chat platform yang **otomatis disamarkan & dihapus setelah pesanan selesai** (tidak pernah ke repo/ClickUp,
  aturan CLAUDE.md #1), banner peringatan wajib, garansi keamanan akun tidak diberikan, sengketa standar.
- **Akun** (jual-beli akun game/aplikasi): sama — ToS penyedia umumnya melarang pindah tangan. Larangan tetap: akun keuangan ber-KYC, "Gmail old"
  massal, akun hasil curian/cracking (`09` §10).
Tanpa keputusan, kategori ini **disembunyikan** (flag `aktif: false` di `data/kategori-marketplace.json`).

## 6. Keputusan pemilik 31 Okt 2026 — marketplace ramping
- **Urutan produk**: Rekomendasi (default) · Terpopuler · Termurah · Terbaru · Rating tertinggi. Skor Rekomendasi = 40% penjualan 30 hari + 30% rating
  (rata-rata dengan prior, supaya 1 ulasan bintang 5 tidak langsung juara) + 20% skor kepercayaan seller + 10% kecepatan respon. Tanpa iklan berbayar;
  seller dengan skor kepercayaan < 50 tidak masuk tab ini. Bobot di `data/kategori-marketplace.json` → `rekomendasi`; kode `app/src/domain/rekomendasi.ts`.
- **Game fokus (hanya yang paling banyak dimainkan di Indonesia)** — survei APJII 2026 (8.700 responden, Feb–Mar 2026): Mobile Legends 40,5% · Free Fire 24,2% ·
  Roblox 11,3% · PUBG 9,3% · FIFA/EA FC Mobile 2,3% · Minecraft 1,8%; Brawl Stars masuk daftar trending Sep 2026.

  | Game | Kategori yang dibuka |
  |---|---|
  | Mobile Legends: Bang Bang | Top Up · Voucher · Item |
  | Free Fire | Top Up · Voucher · Item |
  | Roblox (Grow a Garden, Blox Fruits, Adopt Me!, Brookhaven RP, Murder Mystery 2) | Top Up Robux · Gamepass/Item/Pets · Voucher |
  | PUBG Mobile | Top Up · Voucher · Item |
  | EA SPORTS FC Mobile | Top Up · Koin |
  | Minecraft | Game Key · Voucher |
  | Brawl Stars | Top Up |

  Listing untuk game di luar daftar ditolak otomatis (`listingGameDiizinkan`). Candy Crush tidak dimasukkan (tidak ada pasar item antarpemain).
  Daftar ditinjau tiap kuartal dari data penjualan + survei terbaru. Joki / Top Up Login / Akun tetap **tutup** sampai pemilik memutuskan (§5).
- **Rak beranda**: Trending Bulan Ini (otomatis) · Top Up Game Favorit · Gamepass Roblox · Item & Pets Roblox · Akun Premium & Streaming.
  Rak "Gift Item" dan "Lainnya" dari banyak game kecil **tidak ditiru**.

## 7. Blog (`/blog`)
Kolom cari blog, 6 kategori (Tutorial ±996, Entertainment 81, Education 22, News 6, Netflix 3, Lecture 1), daftar "Semua artikel" berhalaman (±93
halaman), tanpa nama penulis. Isinya mayoritas tutorial SEO seputar layanan langganan (cara berhenti langganan, gagal bayar, metode bayar di
Indonesia). Rencana kita: `07-marketing.md` §Blog SEO — artikel ditulis sendiri, tidak disalin.

## 8. Yang TIDAK bisa disimpan (butuh login — dilarang aturan #6)
Dashboard & saldo, form buat listing seller, ruang chat, checkout & keranjang setelah login, panel KYC, halaman toko milik seller. Strukturnya sudah
kita rancang sendiri dari artikel pusat bantuan (`20`) dan S&K (`04`); detail layar menyusul saat tampilan dibuat.
