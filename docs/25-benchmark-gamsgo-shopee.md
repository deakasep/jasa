# 25 — Benchmark GamsGo & Shopee (pelengkap acuan joinbareng)

Dicek 2026-11-01 lewat browser (halaman publik + akun pembeli biasa, tanpa beli) dan Help Center resmi `help.gamsgo.com`.
Acuan utama tetap joinbareng (`docs/09-benchmark-joinbareng.md`, ADR 0001). Dokumen ini hanya mencatat **yang joinbareng tidak punya
atau tidak publikasikan**, terutama mekanisme marketplace. Usulan perubahan aturan: ADR `docs/adr/0003-adopsi-gamsgo-marketplace.md`
(status: diusulkan). Ringkasan untuk tim juga ada di ClickUp, dokumen "Riset Kompetitor – GamsGo, JoinBareng, Shopee".

## 1. GamsGo — profil singkat
- Badan: GAMESGO LTD, London. Klaim 10 juta+ pengguna, 150+ negara, 7 tahun.
- Dua mode: **GamsGo Direct** (dijual sendiri; kini mayoritas lisensi software: CapCut, Filmora, UPDF, Runway, dll.) dan
  **Marketplace** (C2C). Produk terlaris (Netflix 314 listing, Claude 103 listing) dijual **seller pihak ketiga**, bukan GamsGo.
- Pelajaran: GamsGo sendiri menjauh dari menjual akun streaming langsung → risiko dipindahkan ke seller, platform ambil fee.

## 2. Empat lapis pendapatan marketplace GamsGo
| Lapis | Angka GamsGo | Posisi JASA sekarang |
|---|---|---|
| Fee bayar dari pembeli | 4,9% + 0,39 USD/EUR per order (+ "service fee" kondisional) | Biaya gateway kita tanggung (`config/fee.json` `biaya_gateway_estimasi`) |
| Komisi seller per kategori | Langganan 8,9% · Akun 7,9% · Mata uang 4,9% · Item 9,9% | 5% min Rp1.000 (sementara) |
| Fee tarik dana | PayPal 6,99%+$0,49 · USDT 2,99%+$4,49 · Bank 2,99%+$2,99 · turun per level · jeda 48 jam | Payout min Rp50.000, biaya gateway kita tanggung |
| Float (dana ditahan) | Dana cair setelah **masa garansi**; kuota "head/tail" habis → cair setelah **masa layanan penuh** | Dana cair saat SELESAI (masa cek 3–7 hari) |

Contoh resmi mereka: barang $10 → pembeli bayar $10,88 → seller terima $9,00 → kotor platform ±$1,88 (±17%) sebelum biaya gateway.
Data komisi per kategori ini adalah **pembanding publik pertama** untuk fee seller marketplace (joinbareng tidak mempublikasikan).

## 3. Head/tail payout (mesin float)
- Tiap seller punya **kuota bulanan**. Masih ada kuota → sebagian dana ("head") cair dulu, sisanya ("tail") setelah garansi habis.
- Kuota habis → **seluruh** dana cair setelah masa layanan penuh (produk 1 bulan ≈ ditahan 1 bulan).
- Kuota naik mengikuti level seller; sengketa terbuka / peringatan pelanggaran membatasi kuota.
- Rekening tarik dana wajib atas nama yang sama dengan KYC; perubahan rekening butuh verifikasi kedua.

## 4. Garansi minimum wajib (produk langganan/akun)
| Masa layanan | Garansi minimum | Rasio |
|---|---|---|
| 30 hari | 10 hari | 1/3 |
| 90 hari | 30 hari | 1/3 |
| 180 hari | 60 hari | 1/3 |
| 360 hari | 90 hari | 1/4 |
- Mulai dihitung dari konfirmasi pembeli atau selesai otomatis 48 jam setelah kirim.
- Ditanggung: akun tidak aktif, diambil kembali pemilik asli, di-ban karena ulah seller, dikeluarkan dari grup keluarga, 2FA/password diubah seller.
- Tidak ditanggung: pembeli ganti password/email pemulihan, akun dijual/disewakan ulang, dipakai melebihi batas, konfirmasi lebih awal
  karena dibujuk seller, transaksi di luar platform.
- Bandingkan JASA: listing `garansi (hari, 0–7)` dan masa cek 3–7 hari (`docs/10-marketplace-escrow.md`) — untuk produk 30 hari, pembeli
  kita lebih cepat kehilangan perlindungan.

## 5. Alur sengketa dalam garansi
1. Pembeli lapor → seller wajib menyelesaikan dalam **48 jam**, tidak selesai → **refund otomatis**.
2. Pembeli tidak puas → minta tinjauan platform → seller menjawab 12–48 jam → platform memutus 12–48 jam.
3. Seller salah → refund; akun sudah terpakai sebagian → **refund prorata** sisa hari.
4. Lewat garansi: platform hanya memfasilitasi, tidak menjamin refund.

## 6. Kendali kualitas seller
- **Level Lv.1–Lv.5**, dievaluasi otomatis tiap tanggal 1 dari kinerja 30 hari; ambang dinamis. Level tinggi = komisi, fee tarik,
  dan kecepatan cair lebih baik.
- **Rentang harga wajar** (price band): harga di luar rentang ditolak otomatis; banting harga dilarang. Di halaman Netflix banyak listing
  di harga persis sama (S$4,47) → batas bawah dipaksakan sistem.
- Aturan judul: wajib atribut SKU (layanan, plan, durasi, cara berbagi, region); dilarang "official", "lifetime", "never banned",
  "termurah", emoji > 2, simbol/ejaan pelesetan untuk mengakali pencarian.
- Kategori berisiko (top up, item, koin, gift card) butuh tinjauan kedua; ditolak → jeda 30 hari.
- **Menarik kembali akun yang sudah dijual = ban permanen.**

## 7. Retensi & akuisisi
- Refund marketplace masuk **GamsGo Credits** secara default; ke metode asli hanya bila dipilih dalam 48 jam. (JASA sudah: refund ke saldo.)
- Undang teman: pengundang 3 kredit, teman 1 kredit (1 kredit = $1), hanya pesanan pertama di produk berlabel.
- Afiliasi: komisi hingga 18% + komisi berulang, ikatan referral **permanen** (bukan cookie berbatas waktu); komisi dipotong bila
  pesanan di-refund; konten promosi tidak boleh dihapus/diprivatkan.
- Halaman listing: filter waktu kirim (instan/20 menit/1 jam/12 jam/1 hari), seller online, plan, durasi, **cara berbagi**
  (akses penuh / profil pribadi / profil bersama / akun bersama / grup keluarga), garansi, jumlah order & % sukses seller.

## 8. Kelemahan GamsGo (jangan ditiru)
- Trustpilot 4,1/5; keluhan berulang: langganan dicabut tak lama setelah bayar, refund dijanjikan 48 jam tak kunjung datang.
- Refund Direct dipotong biaya proses + service fee → terasa curang di mata pembeli.
- Netflix disebut paling tidak stabil untuk model berbagi.

## 9. Shopee — pengamatan 2026-11-01
- Cari "netflix premium 1 bulan" (urut terlaris): hanya 1 halaman hasil → indikasi filter kata kunci merek.
- Seller menyamarkan merek ("FLIXX", "NX", "NETFLXXX", "1 PROFILE 1 PEMBELI"); harga Rp15.000–40.000/bulan; teratas 1RB+ terjual/bulan,
  lainnya ±100–335/bulan. Varian: sharing, semi private, private, mingguan.
- Pencarian kedua terhenti CAPTCHA (tidak dikerjakan; sesuai aturan riset di `CLAUDE.md`).
- Arti untuk JASA: permintaan nyata dan sensitif harga; seller Shopee = calon seller marketplace kita bila kita menawarkan escrow
  dan garansi platform. Model fee Shopee sudah dibahas di `docs/19-pendapatan.md` §Banding Shopee.

## 10. Rekomendasi (rinci di ADR 0003)
Diadopsi langsung (tidak mengubah fee/aturan yang dikunci): pola filter listing, larangan klaim judul, rentang harga wajar sebagai cek QC,
kategori berisiko butuh tinjauan kedua, ikatan referral permanen untuk afiliasi.
Butuh keputusan pemilik: garansi minimum 1/3 masa layanan, dana seller cair setelah garansi + kuota head/tail, SLA seller 48 jam → refund
otomatis + refund prorata, level seller menentukan fee, fee seller marketplace per kategori (pembanding 7,9–9,9%).
