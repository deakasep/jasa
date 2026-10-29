---
name: cek-renewal
description: Cek pelanggan yang slotnya akan habis (≤3 hari) atau lewat jatuh tempo di ClickUp, lalu siapkan pesan reminder. Gunakan saat pemilik minta cek renewal/perpanjangan atau rutinitas harian.
---
# Cek Renewal

1. `clickup_get_user` → ambil tanggal hari ini (zona waktu akun).
2. Filter task list **Order Aktif** yang due date ≤ hari ini + 3 dan belum selesai.
3. Kelompokkan:
   - H-3 s/d H-0 → isi template `reminder-h3` per pelanggan.
   - Lewat H+1 → isi template `slot-dilepas`, sarankan pindah task ke status selesai/lepas
     dan tambah `slot_tersedia` di `site/produk.json`.
4. Tampilkan tabel ringkas: nama, produk, tanggal habis, aksi.
5. Jika diperpanjang: update due date task + durasi baru, komentar nominal pembayaran.
