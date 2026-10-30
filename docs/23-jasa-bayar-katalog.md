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

**Keputusan pemilik 2026-10-30 — pengaman kartu (wajib sebelum Jasa Bayar dibuka):**
1. **Kartu virtual per order**: setiap order memakai kartu virtual sendiri, limit = total checkout, **dibekukan** setelah bayar. Kartu yang
   tertinggal di akun klien tidak bisa ditagih lagi (perpanjangan, upgrade, add-on). Di DB hanya disimpan `kartuVirtualRef` (id/alias), tidak
   pernah nomor kartu. Kandidat penyedia (perlu dicek pemilik): Mekari Expense corporate card (kartu virtual tanpa batas jumlah, limit per kartu,
   bekukan instan), kartu korporat virtual Paper.id, kartu virtual bank.
2. **Perpanjangan otomatis dimatikan** setelah aktif; perpanjangan = order baru (bayar dulu, H-3).
3. **Cloud pascabayar (AWS, Azure, Google Cloud) NONAKTIF** — juga tertolak lewat Layanan lain (dikenali dari domain & kata kunci). Alasannya:
   akun pascabayar wajib punya kartu aktif, jadi kartu kita sulit dilepas, dan tagihan mengikuti pemakaian tanpa batas. Dibuka lagi hanya
   bila kartu virtual berlimit + deposit di muka siap. Cloud prabayar (isi saldo) tetap lewat `topup_saldo`.
4. Checklist admin per order (`checklistProses`): order tidak bisa SELESAI sebelum semua langkah dicentang.

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

## 6. Harga otomatis, kurs, pantau harga, cek checkout (keputusan pemilik 2026-10-30)
**Harga tampil langsung dalam Rupiah** untuk paket berharga pasti (`domain/hargaOtomatis.ts`, API `GET /api/harga/jasa-bayar`):
`total = ke atas ribuan( USD × kurs_jual + USD × PPN penyedia × kurs_jual + fee )`, `kurs_jual = kurs tengah × 1,015`, dikunci 30 menit.
Contoh kurs 16.500: Claude Pro $20 (PPN 11%) = **Rp422.000** · ChatGPT Plus $20 (PPN 0) = Rp385.000.
Tampil otomatis hanya bila: produk aktif · harga USD · paket ada · `ppn_persen` sudah diverifikasi (ada `sumber_ppn`) · `harga_dicek` ≤ 30 hari ·
tidak dijeda · kurs sah ada. Selain itu tombol **"Hitung harga via CS"** — sistem tidak pernah menebak.

PPN penyedia (cek ulang berkala, sumber di katalog): Anthropic 11% · Perplexity 11% (ditunjuk pemungut PPN PMSE 2026) · OpenAI 0 (dicabut
dari daftar pemungut April 2026; tetap dicek di checkout). Produk lain `null` sampai diverifikasi.

| Pengaman | Cara kerja | Angka (config/fee.json) |
|---|---|---|
| Kurs otomatis | `/api/cron/kurs` tiap 30 menit: Frankfurter (ECB) + open.er-api, median; angka tidak wajar/basi dibuang | `jasa_bayar.kurs` |
| Lonjakan kurs | beda > 2% dari kurs terakhir → **ditahan**, pakai kurs terakhir, admin dicek; sumber mati > 30 jam → harga otomatis mati | `maks_lonjakan`, `maks_umur_jam` |
| Pantau harga penyedia | `/api/cron/pantau-harga` harian baca halaman harga resmi; paket hilang → produk **dijeda** + task ClickUp; tidak terbaca → cek manual | `harga_dicek_maks_hari` |
| Cek checkout | sebelum bayar, total di halaman penyedia dibanding USD yang dibayar klien: ≤ Rp5.000 ditanggung, lebih → **tahan** (klien tambah / refund penuh) | `toleransi_selisih_checkout` |
| Bocor kurs bank | Rp yang benar-benar terpotong dicatat per order; rata-rata markup bank > spread 1,5% → peringatan | `spread_kurs` |
| Untung bersih | `python3 scripts/hitung.py jasa-bayar-bersih <usd> <kurs> [ppn] [total|fee]` (sama dengan `domain/checkout.ts`) | `estimasi_pajak` |

Catatan untung: order besar lewat QRIS (0,7%) memakan untung — Claude Max $200 hanya ±2,3% bersih via QRIS; arahkan order ≥ Rp1 juta ke VA
(flat ±Rp4.250).
