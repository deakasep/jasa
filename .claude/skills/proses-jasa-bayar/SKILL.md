---
name: proses-jasa-bayar
description: Proses order Jasa Bayar (bayar layanan luar negeri pakai Rupiah) — hitung kurs + fee, buat invoice JBY, catat ke ClickUp list "Jasa Bayar". Gunakan saat ada pembeli minta dibayarkan Steam/Apple/Midjourney/ChatGPT/Claude dll.
---
# Proses Jasa Bayar

1. Baca `docs/11-jasa-bayar.md` dan `docs/23-jasa-bayar-katalog.md`. Cari layanan di `data/jasa-bayar-katalog.json`.
   - Tolak jika terlarang (`docs/04` §Barang terlarang), produk `aktif: false` (mis. cloud pascabayar AWS/Azure/GCP), atau pembeli baru
     > Rp2.000.000.
   - Tidak ada di katalog → jalur **Layanan lain**: wajib nama + link halaman harga/checkout.
2. Data: nama, WA, layanan, paket, email akun layanan (milik pembeli), berulang atau sekali.
3. Harga:
   - Produk katalog berharga pasti (USD, `ppn_persen` terisi, `harga_dicek` ≤ 30 hari): pakai harga otomatis
     `python3 scripts/hitung.py jasa-bayar-bersih <USD> <kurs> <ppn>` (baris "Tagihan klien") — sama dengan web.
   - Selain itu: cari kurs tengah USD/IDR hari ini (WebSearch), hitung dengan perintah yang sama, PPN penyedia sesuai checkout.
   - Invoice berlaku 30 menit (kurs terkunci). Order ≥ Rp1 juta: sarankan VA (biaya flat) daripada QRIS.
4. Kode `JBY-YYMMDD-NN` (tanggal dari `clickup_get_user.current_time`). Isi template `jasa-bayar-invoice`.
5. Buat task ClickUp list **Jasa Bayar** (`1100360000162010`): `[Layanan] Nama – KODE`, status MENUNGGU_BAYAR di deskripsi,
   isi USD, PPN, kurs, fee, total. JANGAN tulis password, nomor kartu, atau OTP.
6. Setelah lunas — checklist admin (`checklistProses` di `app/src/domain/jasaBayarKatalog.ts`), centang di task:
   1. Buat **kartu virtual khusus order ini**, limit = total checkout. Catat hanya alias/id kartu.
   2. Bandingkan total checkout penyedia dengan USD yang dibayar klien: lebih mahal ≤ Rp5.000 → lanjut (kita tanggung);
      lebih → **tahan**, minta klien tambah kekurangan atau refund penuh.
   3. Bayar. Catat Rp yang benar-benar terpotong dari kartu.
   4. **Bekukan kartu virtual.** Langganan: **matikan perpanjangan otomatis** (tetap aktif sampai akhir periode).
   5. Minta pembeli ganti password bila sempat login. Kirim template `jasa-bayar-selesai` + bukti.
7. Berulang → due date = tanggal tagihan berikut − 3 hari (perpanjangan = order baru, bayar dulu).
