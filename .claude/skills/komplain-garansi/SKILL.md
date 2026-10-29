---
name: komplain-garansi
description: Tangani komplain/klaim garansi pembeli (akses error, tidak bisa login, keluar dari family). Gunakan saat ada keluhan pelanggan.
---
# Komplain & Garansi

1. Catat task di list **Komplain**: `KODE – masalah`, due date = sekarang + 24 jam, prioritas high.
2. Kirim template `komplain-diterima`.
3. Diagnosis:
   - Pelanggaran rules (`docs/04-rules-syarat-ketentuan.md`)? → jelaskan, slot dicabut tanpa refund.
   - Masalah akun induk/penyedia → perbaiki atau pindah ke slot cadangan.
   - Tidak bisa diperbaiki ≤ 24 jam → refund prorata: `total × sisa_hari / total_hari`.
4. Tutup task dengan komentar solusi. Jika akun induk bermasalah, buat task audit di **Stok Slot**.
