---
name: update-katalog
description: Tambah/ubah layanan, paket, harga, atau stok slot di site/produk.json. Gunakan saat pemilik minta ganti harga, tambah produk, atau update stok.
---
# Update Katalog

1. Baca `site/produk.json` dan `docs/06-legal-risiko.md`. Layanan baru WAJIB plan resmi multi-user (family/duo/team/multi-screen).
   Plan single-user (mis. Claude Pro/Max, ChatGPT Plus) → masukkan ke `dialihkan_ke_jasa_bayar`, bukan patungan.
2. Field layanan: `id, nama, kategori, akses, aturan[], paket[]`. Field paket: `kode, slot, periode, harga_plan_resmi, harga_per_slot, slot_tersedia`.
3. `harga_per_slot` = `python3 scripts/hitung.py slot <harga_plan_resmi> <slot>` (bulat ke atas ribuan). Fee tidak ditulis di katalog
   (dihitung dari `config/fee.json`).
4. Bandingkan dengan `data/harga-pembanding.json` — harga bayar pembeli (slot + fee) sebaiknya ≤ joinbareng.
5. Jalankan `python3 scripts/qa_check.py` (harus lulus). Catat di `docs/CHANGELOG.md`, commit `katalog: <ringkas>`.
