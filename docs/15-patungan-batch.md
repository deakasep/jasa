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

## Grup host komunitas (aktif setelah marketplace jalan)
1. Host lulus KYC + verifikasi plan (screenshot halaman langganan resmi, jenis plan multi-user, tanggal tagihan).
2. Host membuat grup: layanan, jumlah slot, harga/slot, periode. QC grup (`16-qa-qc.md` §QC-Host) sebelum tayang.
3. Dana joiner ditahan sampai akses diterima + masa cek 3 hari; lalu cair ke saldo host dikurangi fee patungan.
4. Host mengubah password / mengeluarkan joiner tanpa alasan → joiner refund penuh dari saldo host + sanksi.

## Kode promo
Format `NAMA-PERSEN` / `NAMA-NOMINAL`, punya kuota, masa berlaku, minimal transaksi, 1x per pengguna. Diskon memotong **harga slot**,
fee tetap. Catat setiap kode di ClickUp **Roadmap Platform** (tag `promo`) dengan due = tanggal berakhir.

## Komunitas
Grup WhatsApp per layanan untuk info batch buka/penuh (tanpa membagikan kredensial di grup).
