---
name: update-katalog
description: Tambah/ubah produk, harga, atau stok slot di site/produk.json. Gunakan saat pemilik minta ganti harga, tambah produk, atau update stok.
---
# Update Katalog

1. Baca `site/produk.json`.
2. Untuk produk baru, cek dulu `docs/06-legal-risiko.md` (skema resmi/seat?). Field wajib:
   `id, nama, kategori, harga_bulan, harga_resmi, slot_total, slot_tersedia, akses, catatan`.
3. Harga: pakai rumus di `docs/01-model-bisnis.md`. Pastikan `harga_bulan < harga_resmi`.
4. Validasi JSON: `python3 -m json.tool site/produk.json > /dev/null`.
5. Tambah baris di `docs/CHANGELOG.md`, commit `katalog: <ringkas>`.
