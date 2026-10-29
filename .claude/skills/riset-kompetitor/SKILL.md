---
name: riset-kompetitor
description: Riset ulang joinbareng.com atau kompetitor lain (harga, fitur, aturan) lewat WebFetch/Chrome lalu perbarui docs/09-benchmark-joinbareng.md. Gunakan saat pemilik minta cek kompetitor atau update harga pasar.
---
# Riset Kompetitor

1. WebFetch halaman publik: `/`, `/patungan`, `/jasa-bayar`, `/jadi-penjual`, `/terms-and-conditions`.
   Halaman yang ditolak WebFetch (mis. `/perlindungan-pembeli`) → buka lewat Claude in Chrome (`get_page_text`), tab baru, tutup setelahnya.
2. Jangan login, jangan isi form, jangan beli apa pun di situs kompetitor.
3. Catat: pilar/fitur baru, perubahan fee, aturan perlindungan, contoh harga per layanan.
4. Tulis dengan kata-kata sendiri (jangan salin teks/gambar) ke `docs/09-benchmark-joinbareng.md`, beri tanggal riset.
5. Bila harga pasar berubah → jalankan skill `update-katalog`. Catat di `docs/CHANGELOG.md`, commit `riset: <ringkas>`.
