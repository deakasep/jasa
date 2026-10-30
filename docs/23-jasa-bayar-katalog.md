# 23 — Katalog Jasa Bayar, Layanan Lain, Ulasan & Bukti Transaksi

Sumber: joinbareng.com/jasa-bayar, /jasa-bayar/claude-code, /jasa-bayar/spotify (halaman publik, dibaca 2026-10-30).
Data: `data/jasa-bayar-katalog.json` · logika: `app/src/domain/jasaBayarKatalog.ts`, `app/src/domain/ulasan.ts` · ambang: `config/kepercayaan.json`.

## 1. Rahasia joinbareng melayani "layanan apa saja"
Mereka **tidak** membuat sistem khusus per layanan. Ada ±2.379 halaman produk dalam 39 kategori (SVOD, Music, Cloud, AI Coding, Video games,
eLearning, Travel & Visa, Studi Luar Negeri, Gift Card Region Luar, dst.). Setiap halaman isinya: deskripsi + paket/harga patokan, cara kerja
khusus layanan itu, FAQ, ulasan, ticker, artikel blog terkait. Tapi **form-nya sama untuk semua**:

`Estimasi Harga Produk (USD)` · `Email Akun Produk` · `Nama Lengkap` · `Nomor WhatsApp` · `Email` (bukti bayar) · `Catatan tambahan`
→ tombol **Lanjut bayar** / **Tanya CS dulu lewat WhatsApp**.

Setelah form masuk, CS mengonfirmasi harga final (1–3 menit), kirim invoice (kurs terkunci 30 menit), proses, kirim bukti. Harga dalam Rupiah
(mis. Spotify) selalu dihitung CS. Halaman produk = pintu masuk SEO; layanan yang tidak ada halamannya tetap bisa lewat CS WhatsApp.

## 2. Yang kita bangun (tiru + rapikan)
| Bagian | JASA |
|---|---|
| Katalog | 39 kategori sama; benih 35 produk (Claude, Claude Code, ChatGPT, Gemini, Cursor, Copilot, API Anthropic/OpenAI/OpenRouter, AWS, Azure, Google Cloud, Vercel, domain, Roblox, Steam, PlayStation, Spotify, Netflix, YouTube, Canva, Adobe, M365, Notion, Figma, Coursera, Udemy, Duolingo, IELTS/TOEFL, biaya aplikasi kampus, eSIM, Patreon, dll.). Ditambah bertahap lewat skill `update-katalog`. |
| Halaman produk | `/jasa-bayar/<slug>`: paket & harga patokan, cara bayar, butuh login atau tidak, FAQ, ulasan, ticker, strip kepercayaan, cross-sell patungan bila ada (`patungan`). |
| **Layanan lain** | `/jasa-bayar/lainnya`: **nama layanan + link halaman harga/checkout wajib** + estimasi harga. Dicek daftar tolak otomatis, CS kirim harga final sebelum bayar. Tidak perlu menunggu produk masuk katalog. |
| Katalog tumbuh sendiri | Layanan lain yang sudah selesai dipesan ≥ 3 kali (domain sama) → muncul di laporan QC sebagai usulan halaman baru (`usulanKatalog`). |
| Cari | cari nama/kategori; tidak ketemu → tombol "Bayar layanan lain". |

## 3. Lima cara bayar (menentukan risiko & apakah perlu login)
| Cara | Dipakai untuk | Login pembeli? |
|---|---|---|
| `kartu_di_akun_pembeli` | langganan (Claude, ChatGPT, Cursor, Spotify…): kartu bisnis kita dipasang di akun pembeli 1 periode | ya, + OTP bila ada; password sementara, tidak disimpan |
| `topup_saldo` | API credit, saldo registrar domain | tergantung; utamakan undangan sebagai billing member |
| `gift_card` | Roblox, Steam, PlayStation, eSIM | tidak — kirim kode resmi |
| `invoice_sekali` | kursus, tes bahasa, biaya aplikasi kampus: pembeli kirim link checkout | tidak |
| `tagihan_sekali` | **cloud pascabayar (AWS, Azure, Google Cloud)**: bayar tagihan yang sudah terbit sekali, **kartu dilepas setelah lunas** | ya, sebentar |

Aturan cloud (tambahan kita, joinbareng tidak menjelaskan): tidak boleh ada kartu kita yang tertinggal di akun pascabayar — tagihan bisa
membengkak tanpa batas. Pembeli wajib pasang budget alert; tagihan berikutnya = order baru.

## 4. Ulasan & rating — terlihat publik di semua pilar
- **Marketplace**: model `Review` per pesanan (bintang 1–5 + komentar, seller balas sekali), rating listing & toko (`10-marketplace-escrow.md`).
- **Patungan & Jasa Bayar**: model `UlasanLayanan` (pilar, pesanan, produk, paket, kota opsional). Satu pesanan SELESAI = satu ulasan.
- Tampil di halaman produk: **rating rata-rata + jumlah ulasan**, daftar ulasan (nama disingkat "Andra S.", kota, paket, tanggal), 3 testimoni
  = ulasan asli terbaru berkomentar dengan bintang ≥ 4 (tidak ditulis tangan).
- Ulasan buruk tetap tampil. Disembunyikan hanya bila melanggar aturan (SARA, data pribadi, spam) dan tercatat di audit.
- **Ticker "Transaksi terbaru"** lintas produk: pesanan selesai nyata, nama disamarkan ("Sonn***"), "12 menit lalu".
- **Strip kepercayaan** per pilar dihitung dari data (ambang di `config/kepercayaan.json`, detail `02` §Strip kepercayaan).

## 5. Ditolak tetap ditolak
Daftar tolak `11-jasa-bayar.md` §Aturan berlaku untuk katalog **dan** layanan lain (judi, konten dewasa, kripto/forex, akun keuangan ber-KYC,
"Development Mode (Credential)" / akun AI berbagi kredensial).
