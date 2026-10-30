# 13 — Seller: Pendaftaran, KYC, Payout, Sanksi

## Daftar
1. Akun gratis (email + nomor WA terverifikasi OTP).
2. **KYC / pemeriksaan profil** (dasar: pencegahan TPPU/TPPT): salah satu KTP / paspor / izin tinggal / SIM (+ selfie), diverifikasi ≤ 72 jam;
   **satu** rekening bank dengan bukti kepemilikan atas nama yang sama, diverifikasi ≤ 72 jam (ganti rekening = verifikasi ulang). Ditolak → alasan
   ditampilkan, boleh unggah ulang.
   Data KYC disimpan terenkripsi, akses hanya admin, tidak pernah di repo/ClickUp (patuh UU PDP No. 27/2022).
3. Setujui S&K Seller → toko aktif. Listing langsung tayang, admin moderasi ≤ 24 jam setelahnya.

## Level seller (usulan)
| Level | Syarat | Benefit |
|---|---|---|
| Baru | KYC lulus | maks 10 listing, payout setelah 3 hari |
| Terpercaya | ≥ 20 pesanan selesai, rating ≥ 4,7, sengketa ≤ 3% | listing tak terbatas, payout 1 hari |
| Unggulan | ≥ 100 pesanan, rating ≥ 4,8 | badge, prioritas di beranda, fee 4% |

## Payout
Saldo penjualan bisa ditarik ke rekening KYC. Minimal Rp50.000. Diproses ≤ 1×24 jam kerja (sama dengan joinbareng), via disbursement Xendit.
Fee: hanya potongan transaksi saat terjual (`config/fee.json` → `marketplace`); daftar & posting gratis.
Boleh dijual: akun premium yang sah dijual/dibagi, voucher digital, slot patungan (host terverifikasi), jasa digital. Produk fisik & ilegal dilarang.
Biaya transfer ditanggung seller jika beda bank (sesuai tarif gateway disbursement).

## Kewajiban seller
Respon ≤ 1 jam, kirim ≤ batas kirim, barang sesuai deskripsi, garansi sesuai listing, tidak mengajak transaksi di luar platform.

## Sanksi bertingkat
1. Peringatan → 2. Listing diturunkan → 3. Suspend 7 hari → 4. Saldo dibekukan selama investigasi → 5. Ban permanen + lapor jika penipuan.
Penipuan terbukti: saldo dipakai untuk mengganti kerugian pembeli.
