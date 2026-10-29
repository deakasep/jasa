---
name: mediasi-sengketa
description: Tangani sengketa pesanan marketplace escrow (barang tidak terkirim/tidak sesuai, minta refund) dan putuskan kirim ulang/refund sebagian/penuh. Gunakan saat pembeli lapor "ada masalah" pada pesanan marketplace.
---
# Mediasi Sengketa

1. Baca `docs/10-marketplace-escrow.md`. Buat task `[SENGKETA] KODE – masalah` di **Sengketa & Escrow**
   (`1100360000162012`), due = sekarang + 24 jam, prioritas high. Kirim template `sengketa-diterima`.
2. Kumpulkan bukti: chat pesanan, screenshot pembeli, bukti kirim seller, deskripsi & garansi listing.
3. Putusan:
   - Seller tidak kirim / lewat batas → **refund penuh**.
   - Barang tidak sesuai & seller bisa ganti → **kirim ulang** (beri 12 jam).
   - Sebagian bisa dipakai → **refund sebagian** = total × bagian tidak berfungsi (atau prorata sisa hari garansi).
   - Pembeli melanggar aturan (ubah password akun, dll.) → dana ke seller.
4. Template `sengketa-putusan`. Catat nominal & alasan di komentar task, tutup task.
5. Seller kalah ≥ 3 kali/bulan → tambahkan sanksi via skill `onboarding-seller`.
