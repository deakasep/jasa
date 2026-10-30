# 15 — Patungan: Sistem Batch, Grup Host, Kode Promo

Meniru mekanisme joinbareng. Dua jenis grup:

| | Grup **Resmi JASA** | Grup **Host komunitas** (tahap 3+) |
|---|---|---|
| Pemilik plan | JASA (akun atas nama bisnis) | host terverifikasi (`13-seller-kyc-payout.md`) |
| Harga | `site/produk.json` | ditentukan host, ≤ harga plan / slot |
| Tanggung jawab akun | JASA | host; JASA menengahi & menahan dana |
| Label | "Resmi JASA" | "Host: <nama>" |

## Batch (grup Resmi)
```
BUKA (preorder) → pembeli bayar bagiannya → dana DITAHAN → slot terisi bertahap ("butuh N orang lagi")
→ PENUH → admin beli/aktifkan plan → akses dikirim ke email + dashboard (+ WA) → AKTIF
→ tiap periode: invoice otomatis H-3 → dibayar = lanjut | tidak dibayar H+1 = slot dilepas ke batch berikutnya
```
- Batch tidak penuh dalam **7 hari** → pilihan pembeli: pindah ke batch lain / tunggu / refund 100%.
- **Auto-provision**: layanan yang bisa langsung diberi akses (undangan family pada plan yang sudah berjalan) aktif begitu dibayar,
  tanpa menunggu batch penuh.
- Status grup ditampilkan: Tersedia (masih buka) / Aktif (penuh & berjalan), anggota disensor (`A** Ra*****`).
- Durasi dihitung sejak aktivasi, bukan sejak bayar.

## Kirim akses
- Skema undangan (Spotify/YouTube/M365/Apple/Canva): kirim undangan ke email pembeli — tidak ada password yang dibagikan.
- Skema akun bersama (Netflix/Disney+): kredensial ditampilkan di dashboard (tahap 1) / dikirim via WA pribadi (tahap 0),
  1 profil + PIN per slot. Ganti password akun induk tiap pergantian anggota.

## Aturan grup (ditampilkan di halaman layanan)
Jumlah anggota maks sesuai plan · 1 perangkat per slot (akun bersama) · dilarang ubah email/password/profil/pengaturan →
dicabut permanen tanpa refund · hormati privasi anggota lain · keluhan: chat host/JASA di platform.

## Klaim akun bermasalah
Ajukan lewat dashboard/WA dengan bukti → diproses **1–3 hari kerja** (target internal ≤ 24 jam) → slot pengganti atau refund penuh
sisa periode. Skill: `komplain-garansi`.

## Grup host komunitas (model inti joinbareng — detail pengguna di `20-pusat-bantuan.md` §D)
1. Host: nomor HP terverifikasi, pemeriksaan profil (KYC ≤ 72 jam), satu rekening bank terverifikasi (≤ 72 jam). Faktur opsional (+skor kepercayaan).
2. Host membuat penawaran: layanan, jumlah slot yang dibagikan (boleh sisakan slot pribadi), periode tagihan; **harga slot dihitung otomatis**
   dari tarif resmi Indonesia (host dilarang mengambil untung). Pilih **publik** (marketplace) / **pribadi** (tautan undangan) dan
   **penerimaan instan** on/off. Layanan belum terdaftar → *custom sharing* (pribadi, ditinjau admin). QC grup (`16-qa-qc.md` §E).
3. Penerimaan instan off: joiner bayar di muka pakai dompet, host wajib terima/tolak ≤ 48 jam; joiner boleh batal setelah 2 menit selama belum diterima.
4. Pendapatan host: harga slot penuh; **connection fee** dipotong hanya bulan pertama tiap joiner baru (25% maks Rp5.000 bulanan / 20% maks Rp6.000
   tahunan; pribadi = 0). Joiner keluar di tengah periode → host tetap dibayar penuh bulan itu.
5. Kode etik host: pemilik sah, paket identik dengan asli, tarif Indonesia, layanan min 30 hari/joiner, tidak mengganti login berkala.
   Melanggar / mengeluarkan joiner tanpa alasan → joiner refund dari dana host + sanksi.
6. **Skor kepercayaan 0–100** menentukan urutan tampil; skor 100 / faktur terverifikasi = "dijamin sesuai iklan".
7. Harga layanan naik → harga penawaran disesuaikan otomatis untuk periode berikutnya, joiner diberi tahu.
8. Waiting list per layanan: notifikasi email + WhatsApp saat ada penawaran baru.

## Kode promo
Format `NAMA-PERSEN` / `NAMA-NOMINAL`, punya kuota, masa berlaku, minimal transaksi, 1x per pengguna. Diskon memotong **harga slot**,
fee tetap. Catat setiap kode di ClickUp **Roadmap Platform** (tag `promo`) dengan due = tanggal berakhir.

## Komunitas
Grup WhatsApp per layanan untuk info batch buka/penuh (tanpa membagikan kredensial di grup).
