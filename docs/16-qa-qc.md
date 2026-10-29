# 16 — QA & QC

- **QA (Quality Assurance)** = mencegah salah *sebelum* terjadi: aturan, cek otomatis, uji alur sebelum rilis.
- **QC (Quality Control)** = memeriksa hasil *setelah* terjadi: audit pesanan, listing, akun induk, layanan CS.
Pemilik QA/QC: admin. Pengingat: ClickUp list **QA & QC**. Skill: `qc-harian`, `qa-uji-alur`, `qc-listing-host`.

## A. QA otomatis (repo) — `scripts/qa_check.py`, jalan di GitHub Actions setiap push/PR
1. Semua JSON valid (`site/produk.json`, `config/fee.json`, `data/*.json`).
2. Katalog: field wajib ada; kode paket unik; `harga_per_slot` = ceil(plan/slot, ribuan); `0 ≤ slot_tersedia ≤ slot`;
   layanan tidak termasuk daftar plan single-user terlarang.
3. Fee: hasil kalkulator cocok dengan contoh resmi (Rp50.000 bulanan → fee Rp13.000; jasa bayar tier $69/$70/$500/$501).
4. Dokumen: semua path `docs/…`, `scripts/…`, `config/…` yang disebut di CLAUDE.md/README/skill benar-benar ada; setiap skill punya `name` + `description`.
5. Keamanan: tidak ada pola password, nomor kartu 16 digit, NIK 16 digit, token/API key di repo.
Check merah = jangan merge; perbaiki dulu (aturan CLAUDE.md #7).

## B. QA alur (manual, sebelum rilis tiap tahap / perubahan alur) — skill `qa-uji-alur`
| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| P1 | Order patungan, bayar, batch belum penuh | status MENUNGGU_BATCH, pembeli dapat pesan `batch-menunggu` |
| P2 | Batch penuh | semua anggota aktif, due ClickUp = aktivasi + periode |
| P3 | Batch tidak penuh 7 hari | ditawari pindah/tunggu/refund |
| P4 | H-3 renewal | pesan `reminder-h3` terkirim; H+1 tak bayar → slot dilepas |
| P5 | Kode promo kadaluarsa / kuota habis | ditolak, harga normal |
| J1 | Jasa bayar $69 / $70 / $501 | fee Rp50.000 / 4% / 3,5% |
| J2 | Invoice > 30 menit | kurs dihitung ulang |
| J3 | Penyedia menolak kartu | refund 100% |
| M1 | Seller tidak respon 1 jam | pembeli bisa batal, refund penuh ke saldo |
| M2 | Lewat batas kirim | sama dengan M1 |
| M3 | Masa cek habis tanpa laporan | auto SELESAI, dana ke seller − fee |
| M4 | Laporan masalah | SENGKETA, putusan ≤ 24 jam |
| M5 | Chat berisi nomor WA/rekening | disensor + peringatan |
| S1 | Seller payout < Rp50.000 | ditolak |
| K1 | Pembeli baru jasa bayar > Rp2 juta | ditolak / perlu verifikasi |
Uji di sandbox payment gateway (mode test), catat hasil di task ClickUp "QA rilis tahap N".

## C. QC harian — skill `qc-harian`
- [ ] Semua chat dibalas; waktu respon pertama ≤ 5 menit (jam kerja).
- [ ] Pesanan DIBAYAR > 1 jam tanpa tindakan = 0.
- [ ] Jasa bayar diproses ≤ 5 menit setelah bayar (≤ 15 menit bila perlu OTP).
- [ ] Sengketa/komplain terbuka > 24 jam = 0.
- [ ] Sampel 3 pesanan selesai kemarin: bukti bayar, kode, ClickUp, pesan aktivasi lengkap.
- [ ] Tidak ada kredensial/KTP tertulis di ClickUp/chat grup.

## D. QC mingguan
- [ ] Audit akun induk: login asing, profil tak dikenal, perangkat lebih dari slot → ganti password, catat di **Stok Slot**.
- [ ] Audit 10% listing marketplace & grup host (`qc-listing-host`).
- [ ] Bandingkan harga dengan `data/harga-pembanding.json`.
- [ ] Review ulasan ≤ 3 bintang → tindak lanjut.

## E. QC-Listing & QC-Host (sebelum/sesudah tayang)
Listing: judul jelas, kategori benar, harga wajar, batas kirim ≤ 24 jam, garansi diisi, deskripsi tanpa kontak luar, bukan barang terlarang.
Host: KYC lulus, bukti plan resmi multi-user, jumlah slot ≤ batas plan, tanggal tagihan jelas.
Gagal → turunkan + pesan alasan.

## F. KPI & ambang (laporan bulanan)
| KPI | Target |
|---|---|
| Respon pertama CS | ≤ 5 menit |
| Aktivasi patungan setelah batch penuh | ≤ 15 menit |
| Proses jasa bayar | 1–5 menit |
| Putusan sengketa | ≤ 24 jam |
| Klaim patungan selesai | ≤ 1 hari kerja (janji publik 1–3) |
| Payout seller | ≤ 1×24 jam kerja |
| Komplain / 100 slot | ≤ 3 |
| % order sukses marketplace | ≥ 95% |
| Renewal rate | ≥ 70% |
| Rating rata-rata | ≥ 4,8 |
Di bawah target 2 bulan berturut → buat task perbaikan di ClickUp **QA & QC** (prioritas high).

## G. Tindakan korektif (CAPA)
Setiap kesalahan berulang: catat penyebab → perbaiki aturan/skill/template → tambah cek di `qa_check.py` atau checklist → CHANGELOG.
