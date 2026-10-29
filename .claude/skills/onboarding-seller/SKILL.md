---
name: onboarding-seller
description: Verifikasi dan aktifkan seller baru marketplace (KYC, level, sanksi) dan catat di ClickUp "Seller & KYC". Gunakan saat ada yang mau buka toko/jadi penjual atau saat menilai level/sanksi seller.
---
# Onboarding Seller

1. Ikuti `docs/13-seller-kyc-payout.md`. Cek: nama KTP = nama rekening, selfie cocok, kategori jualan tidak terlarang.
2. Data KTP/selfie hanya dilihat di storage privat — JANGAN disalin ke repo, ClickUp, atau chat.
3. Buat/ubah task `[SELLER] Nama toko` di list **Seller & KYC** (`1100360000162011`): status KYC (menunggu/lulus/ditolak),
   level, kategori, tanggal daftar.
4. Lulus → template `seller-diterima`. Ditolak → `seller-ditolak` + alasan.
5. Review level tiap bulan (pesanan selesai, rating, % sengketa). Sanksi: catat tingkat & tanggal di komentar task.
