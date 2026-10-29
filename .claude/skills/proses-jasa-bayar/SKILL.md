---
name: proses-jasa-bayar
description: Proses order Jasa Bayar (bayar layanan luar negeri pakai Rupiah) — hitung kurs + fee, buat invoice JBY, catat ke ClickUp list "Jasa Bayar". Gunakan saat ada pembeli minta dibayarkan Steam/Apple/Midjourney/ChatGPT/Claude dll.
---
# Proses Jasa Bayar

1. Baca `docs/11-jasa-bayar.md`. Tolak jika kategori terlarang (`docs/04-rules-syarat-ketentuan.md` §Barang terlarang)
   atau pembeli baru > Rp2.000.000.
2. Data: nama, WA, layanan, paket, harga USD, email akun layanan (milik pembeli), berulang atau sekali.
3. Kurs: cari kurs USD/IDR hari ini (WebSearch), `kurs_jual = kurs × 1,03`. `fee = maks(25000, 10% × USD × kurs_jual)`.
   Bulatkan total ke atas ribuan.
4. Kode `JBY-YYMMDD-NN` (tanggal dari `clickup_get_user.current_time`). Isi template `jasa-bayar-invoice`.
5. Buat task ClickUp list **Jasa Bayar** (`1100360000162010`): `[Layanan] Nama – KODE`, status MENUNGGU_BAYAR di deskripsi,
   isi USD, kurs, fee, total. JANGAN tulis password.
6. Setelah lunas & dibayarkan: template `jasa-bayar-selesai`, komentar bukti. Jika berulang → due date = tanggal tagihan berikut − 2 hari.
