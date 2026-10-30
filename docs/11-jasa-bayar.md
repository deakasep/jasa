# 11 — Jasa Bayar (bayar layanan luar negeri pakai Rupiah)

Pembeli tidak punya kartu luar negeri → kita bayarkan dengan kartu/akun kita, pembeli transfer Rupiah.

## Produk cocok
Langganan & pembelian digital yang dibeli **atas nama/akun pembeli sendiri**: Steam wallet/game, Apple/Google Play,
Midjourney, Claude, ChatGPT, Canva, domain/hosting luar, kursus online, API credit, dll.

## Harga (sama dengan joinbareng — angka di `config/fee.json`)
```
kurs_jual   = kurs mid-market hari ini × 1,015            # spread 1,5%
harga_rp    = harga_USD (sebelum pajak penyedia) × kurs_jual
fee_jasa    = Rp50.000 flat      jika harga_USD < 70
            = 4%   × harga_rp    jika 70 ≤ harga_USD ≤ 500
            = 3,5% × harga_rp    jika harga_USD > 500
total       = harga_rp + PPN/pajak yang ditagih penyedia (jika ada) + fee_jasa   → bulatkan ke atas ribuan
```
Kurs **terkunci 30 menit**: invoice tidak dibayar dalam 30 menit → hitung ulang. Hitung otomatis: `python3 scripts/hitung.py jasa-bayar <USD> <kurs>`.

## Katalog & layanan lain
Katalog 39 kategori + halaman per layanan, jalur **Layanan lain** (nama + link wajib) untuk apa pun di luar katalog, lima cara bayar
(termasuk cloud pascabayar AWS/Azure), ulasan & ticker: `23-jasa-bayar-katalog.md`.

Harga otomatis, kurs, pantau harga, cek checkout, kartu virtual per order, cloud pascabayar nonaktif: `23-jasa-bayar-katalog.md` §3 & §6.

## Form order (field wajib)
Estimasi harga produk (USD, sebelum pajak) · email akun produk (milik pembeli) · nama lengkap · nomor WhatsApp · email untuk bukti bayar ·
catatan (paket/tier, sekali/berulang). Pembeli baru otomatis dibuatkan akun.

## Alur
1. Pembeli isi form → WhatsApp terbuka dengan pesan pesanan terisi otomatis.
2. Admin konfirmasi harga final ≤ 3 menit, cek layanan tidak terlarang → kirim invoice (kode `JBY-YYMMDD-NN`, QRIS/VA/e-wallet).
3. Pembeli bayar ≤ 30 menit → verifikasi webhook/mutasi. Target proses **1–5 menit** setelah bayar (5–15 menit bila perlu OTP/2FA dari pembeli).
4. Admin bayarkan:
   - **Disarankan:** pembeli login di sesi screen-share / kirim link pembayaran; atau pakai gift card/voucher resmi.
   - Jika pembeli memberi akses akun: hanya untuk sekali bayar, minta pembeli ganti password setelahnya. Jangan simpan kredensial.
5. Kirim bukti (invoice penyedia) via WhatsApp + email → status SELESAI.
6. Langganan berulang: H-3 sebelum perpanjangan, konfirmasi lanjut / upgrade / downgrade / stop. Stop → pastikan auto-renew dibatalkan
   di sisi penyedia. Upgrade di tengah periode: tanpa fee jasa tambahan (hanya selisih harga penyedia).
7. Untuk API credit (mis. Anthropic Console / OpenAI): top-up saldo ke akun pembeli sendiri.
8. Bonus layanan: konsultasi singkat setup tools (mis. MCP) via WhatsApp — opsional.

## Status
`MENUNGGU_BAYAR → DIBAYAR → DIPROSES → SELESAI` · `GAGAL → REFUND`

## Aturan
- Gagal dibayar karena kartu ditolak/penyedia menolak → refund 100%.
- Sudah berhasil dibayar → tidak bisa refund (ikuti kebijakan refund penyedia; bantu ajukan bila bisa).
- Kartu/billing yang dipakai: kartu bisnis milik kita sendiri yang sah. Dilarang memakai kartu orang lain, VCC hasil beli gelap, atau trik region.
- Tolak: judi, konten dewasa (termasuk OnlyFans/Fansly), kripto/forex, top-up akun keuangan, layanan yang melanggar hukum RI, pembelian untuk pihak ketiga yang mencurigakan.
- Batas transaksi per pembeli baru: maks Rp2.000.000 sampai riwayat ≥ 3 transaksi lancar (cegah carding/penipuan).
- Catat setiap transaksi (tanggal, layanan, USD, kurs, fee) untuk pembukuan & pajak.
