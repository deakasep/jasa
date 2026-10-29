---
name: qc-harian
description: Jalankan quality control harian/mingguan bisnis JASA — cek SLA chat, pesanan tertunda, sengketa terbuka, sampel pesanan, dan kebocoran data di ClickUp. Gunakan saat pemilik minta QC, cek kualitas, atau rutinitas malam.
---
# QC Harian

1. `clickup_get_user` → tanggal & jam sekarang.
2. Tarik task folder **JASA – Patungan Premium** (`1100360000156419`) yang belum selesai; kelompokkan per list.
3. Periksa sesuai `docs/16-qa-qc.md` §C:
   - Order Aktif / Jasa Bayar berstatus dibayar tapi belum diproses > 1 jam (jasa bayar > 5 menit).
   - Komplain / Sengketa & Escrow terbuka > 24 jam (lewat due).
   - Order Aktif due ≤ 3 hari tanpa komentar reminder → jalankan `cek-renewal`.
   - Ambil 3 task selesai kemarin: ada kode, nominal, fee, tanggal habis, komentar aktivasi?
   - Cari pola sensitif di deskripsi/komentar (password, PIN, 16 digit, "KTP") → minta pemilik hapus, catat CAPA.
4. Senin: tambahkan §D (audit akun induk via list **Stok Slot**, sampel listing/host, harga pembanding).
5. Laporkan tabel: temuan, task terkait (link), tindakan. Temuan berulang → buat task di list **QA & QC** (`docs/08-clickup.md`), prioritas high.
