# 11 — Jasa Bayar (bayar layanan luar negeri pakai Rupiah)

Pembeli tidak punya kartu luar negeri → kita bayarkan dengan kartu/akun kita, pembeli transfer Rupiah.

## Produk cocok
Langganan & pembelian digital yang dibeli **atas nama/akun pembeli sendiri**: Steam wallet/game, Apple/Google Play,
Midjourney, Claude, ChatGPT, Canva, domain/hosting luar, kursus online, API credit, dll.

## Harga
```
total = (harga_USD × kurs_jual) + fee_jasa
kurs_jual = kurs tengah BI/Google hari ini + 2–3% (selisih kartu & biaya FX)
fee_jasa  = maks(Rp25.000, 10% × harga_rupiah)   # usulan; joinbareng mulai Rp50.000
```
Kurs ditulis di invoice dan berlaku 1×24 jam.

## Alur
1. Pembeli isi form: layanan, paket, harga (USD), email akun layanan, catatan.
2. Admin cek: layanan aman? harga benar? → kirim invoice (kode `JBY-YYMMDD-NN`).
3. Pembeli bayar → verifikasi mutasi/webhook.
4. Admin bayarkan:
   - **Disarankan:** pembeli login di sesi screen-share / kirim link pembayaran; atau pakai gift card/voucher resmi.
   - Jika pembeli memberi akses akun: hanya untuk sekali bayar, minta pembeli ganti password setelahnya. Jangan simpan kredensial.
5. Kirim bukti (invoice penyedia) → status SELESAI. Langganan berulang → buat pengingat ClickUp sebelum tagihan berikutnya.

## Status
`MENUNGGU_BAYAR → DIBAYAR → DIPROSES → SELESAI` · `GAGAL → REFUND`

## Aturan
- Gagal dibayar karena kartu ditolak/penyedia menolak → refund 100%.
- Sudah berhasil dibayar → tidak bisa refund (ikuti kebijakan refund penyedia; bantu ajukan bila bisa).
- Tolak: judi, konten dewasa, kripto/forex, top-up akun keuangan, layanan yang melanggar hukum RI, pembelian untuk pihak ketiga yang mencurigakan.
- Batas transaksi per pembeli baru: maks Rp2.000.000 sampai riwayat ≥ 3 transaksi lancar (cegah carding/penipuan).
- Catat setiap transaksi (tanggal, layanan, USD, kurs, fee) untuk pembukuan & pajak.
