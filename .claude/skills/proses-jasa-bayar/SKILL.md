---
name: proses-jasa-bayar
description: Proses order Jasa Bayar (bayar layanan luar negeri pakai Rupiah) — hitung kurs + fee, buat invoice JBY, catat ke ClickUp list "Jasa Bayar". Gunakan saat ada pembeli minta dibayarkan Steam/Apple/Midjourney/ChatGPT/Claude dll.
---
# Proses Jasa Bayar

1. Baca `docs/11-jasa-bayar.md`. Tolak jika kategori terlarang (`docs/04-rules-syarat-ketentuan.md` §Barang terlarang)
   atau pembeli baru > Rp2.000.000.
2. Data: nama, WA, layanan, paket, harga USD, email akun layanan (milik pembeli), berulang atau sekali.
3. Kurs: cari kurs mid-market USD/IDR hari ini (WebSearch), lalu `python3 scripts/hitung.py jasa-bayar <USD> <kurs>`
   (spread 1,5%; fee < $70 Rp50.000, $70–500 4%, > $500 3,5% — sama dengan joinbareng). Tambahkan pajak penyedia jika ditagih.
   Invoice berlaku 30 menit (kurs terkunci).
4. Kode `JBY-YYMMDD-NN` (tanggal dari `clickup_get_user.current_time`). Isi template `jasa-bayar-invoice`.
5. Buat task ClickUp list **Jasa Bayar** (`1100360000162010`): `[Layanan] Nama – KODE`, status MENUNGGU_BAYAR di deskripsi,
   isi USD, kurs, fee, total. JANGAN tulis password.
6. Setelah lunas & dibayarkan: template `jasa-bayar-selesai`, komentar bukti. Jika berulang → due date = tanggal tagihan berikut − 2 hari.
