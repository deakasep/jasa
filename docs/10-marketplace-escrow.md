# 10 — Marketplace & Escrow (Rekber)

Pilar ke-2 setelah Patungan: banyak seller berjualan, kita jadi penengah yang menahan dana.

## Pelaku
- **Pembeli** — punya saldo, keranjang, pesanan.
- **Seller** — terverifikasi (lihat `13-seller-kyc-payout.md`), punya toko, listing, saldo penjualan.
- **Admin** — moderasi listing, mediasi sengketa, cairkan payout.

## Alur pesanan
```
Pilih listing → (chat seller) → Checkout → Bayar via gateway → DIBAYAR (dana ditahan)
→ seller kirim ≤ batas kirim → DIKIRIM → masa cek 3–7 hari
   ├ pembeli "Sudah bisa dipakai"      → SELESAI → dana ke saldo seller (dikurangi fee)
   ├ masa cek habis tanpa laporan       → SELESAI otomatis
   └ "Ada masalah?" + bukti             → SENGKETA → putusan admin ≤ 1×24 jam
   (tombol lengkap Ingatkan seller / Batalkan & refund / Ada masalah? + 4 titik notifikasi: `24` §2.4)
                                            → kirim ulang / refund sebagian / refund penuh (ke saldo pembeli)
Seller diam 1 jam / lewat batas kirim → pembeli boleh BATAL → refund penuh ke saldo
```

## Status & timer (sumber kebenaran untuk sistem)
| Status | Masuk ketika | Timer | Keluar ke |
|---|---|---|---|
| MENUNGGU_BAYAR | checkout | 30 menit (QRIS) / 24 jam (VA) | DIBAYAR / KADALUARSA |
| DIBAYAR | webhook gateway sukses | respon 1 jam, kirim ≤ `batas_kirim` (maks 24 jam) | DIKIRIM / DIBATALKAN |
| DIKIRIM | seller isi data pengiriman | masa cek 3 hari (7 jika bergaransi), pengingat H-1 | SELESAI / SENGKETA |
| SENGKETA | pembeli lapor | putusan ≤ 24 jam | SELESAI / REFUND_SEBAGIAN / REFUND_PENUH |
| SELESAI | konfirmasi / auto | — | (dana dilepas) |
| DIBATALKAN | pembeli batal sah / admin | — | refund penuh |

## Aturan uang
- Uang pembeli masuk rekening penampung → **ledger**: `ditahan` per pesanan.
- Pelepasan: `saldo_seller += total - fee_platform`. Refund: `saldo_pembeli += nominal`.
- Refund masuk **saldo**, bukan rekening (bisa dipakai belanja lagi). Penarikan tunai hanya untuk saldo seller.
- Fee seller: **5% (min Rp1.000)** per transaksi selesai, tanpa biaya daftar/listing/bulanan — sama seperti model joinbareng
  (persen mereka tidak dipublikasi; angka sementara di `config/fee.json`).
- Payout: dana masuk "Saldo Saya" seller saat pesanan SELESAI; penarikan ke bank ≤ 1×24 jam kerja, min Rp50.000.

## Halaman listing (ditiru)
Kode produk `JSA-<id>`, harga, rating & jumlah ulasan, terjual, jumlah, keranjang / beli sekarang, kartu seller (rating, chat, lihat toko),
badge perlindungan (escrow, refund saldo, garansi N hari, seller terverifikasi), statistik (dilihat, dalam antrian, % order sukses,
waktu respon seller, terakhir diperbarui), jaminan penjual (garansi toko, batas kirim), tab Deskripsi / FAQ / Ulasan.
Listing langsung tayang di katalog, kategori (19 kategori: `22-marketplace-kategori.md`), dan pencarian internal tanpa iklan. Iklan berbayar (label "Iklan") = fitur tahap lanjut.

## Aturan chat & anti-pindah platform
- Chat per pesanan tersimpan untuk bukti sengketa.
- Filter otomatis memblokir nomor WA/Telegram/rekening di chat; pelanggaran berulang → sanksi.
- Admin tidak pernah meminta password pembeli.

## Listing (field wajib)
`judul, kategori, harga, stok, batas_kirim (jam), garansi (hari, 0–7), cara_kirim (otomatis/manual), deskripsi, syarat`.
Kirim otomatis = kode/voucher diambil dari stok terenkripsi saat DIBAYAR.

## Ulasan
Hanya pembeli dengan pesanan SELESAI; bintang 1–5 + komentar; seller boleh membalas sekali. Rating toko = rata-rata.

## Social proof
Ticker "baru saja beli" diambil dari pesanan SELESAI nyata, nama disensor (`Ahma***`).
