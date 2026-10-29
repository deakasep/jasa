---
name: proses-order
description: Proses order baru patungan premium — buat kode order, tagihan, aktivasi, dan catat ke ClickUp list "Order Aktif". Gunakan saat pemilik bilang ada order/pembeli baru.
---
# Proses Order

1. Minta data: nama, kontak WA, email (jika undangan), produk, durasi, tanggal bayar.
2. Cek `site/produk.json`: produk ada & `slot_tersedia` > 0. Hitung total (diskon durasi di file).
3. Buat kode `JSA-YYMMDD-NN` (tanggal dari `clickup_get_user.current_time`).
4. Isi template `templates/pesan-whatsapp.md` bagian `tagihan` → berikan ke pemilik untuk dikirim.
5. Setelah pemilik konfirmasi lunas: isi template `aktivasi`.
6. Buat task ClickUp di list **Order Aktif** (folder JASA – Patungan Premium):
   - Nama: `[Produk] Nama – KODE`
   - Due date: tanggal aktivasi + durasi
   - Deskripsi: kontak, email, slot, total, durasi. JANGAN tulis password.
   - Tag: nama produk
7. Kurangi `slot_tersedia` di `site/produk.json`, commit `order: KODE`.
