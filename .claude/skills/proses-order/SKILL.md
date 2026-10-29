---
name: proses-order
description: Proses order baru patungan premium — pilih batch/paket, hitung harga + fee, buat kode order, tagihan, aktivasi, dan catat ke ClickUp list "Order Aktif". Gunakan saat pemilik bilang ada order/pembeli baru untuk patungan.
---
# Proses Order Patungan

1. Data: nama, WA, email (untuk undangan / kirim akses), layanan, paket (`kode` di `site/produk.json`), periode, kode promo (jika ada).
2. Cek `site/produk.json`: paket ada & `slot_tersedia` > 0. Penuh → tawarkan batch berikutnya / waiting list (template `stok-habis`).
   Layanan ada di `dialihkan_ke_jasa_bayar` → arahkan ke skill `proses-jasa-bayar`.
3. Hitung: `python3 scripts/hitung.py patungan <harga_per_slot> <bulanan|tahunan>` → total = harga + fee. Kurangi promo bila valid
   (`docs/15-patungan-batch.md` §Kode promo).
4. Kode `JSA-YYMMDD-NN` (tanggal dari `clickup_get_user.current_time`). Isi template `tagihan` (rincian harga slot + fee).
5. Lunas → status batch: belum penuh = MENUNGGU_BATCH (template `batch-menunggu`); penuh = aktivasi semua anggota (template `aktivasi`).
6. Task ClickUp list **Order Aktif** (`1100360000161998`): `[Produk] Nama – KODE`, due = tanggal aktivasi + periode,
   deskripsi: kontak, kode slot, harga, fee, batch. JANGAN tulis password. Tag: id produk.
7. Kurangi `slot_tersedia`, jalankan `python3 scripts/qa_check.py`, commit `order: KODE`.
