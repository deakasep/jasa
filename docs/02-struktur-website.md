# 02 — Struktur Website

## Halaman
1. **Beranda** — hero ("Langganan premium, bayar patungan"), kategori, produk terlaris, cara kerja 3 langkah,
   testimoni, FAQ singkat, CTA WhatsApp.
2. **Katalog** — filter kategori (Hiburan, Musik, Desain, Produktivitas, AI), kartu produk:
   nama, harga/bulan, harga resmi (coret), hemat %, sisa slot, tombol "Gabung".
3. **Detail produk** — durasi, harga, jenis akses (profil/undangan/seat), aturan khusus produk, tombol bayar.
4. **Checkout** — nama, email/nomor WA, pilih durasi, setuju S&K, bayar QRIS / e-wallet / VA.
5. **Status pesanan** — cek pakai kode order: Menunggu bayar → Diproses → Aktif → Habis.
6. **Syarat & Ketentuan** — isi dari `04-rules-syarat-ketentuan.md`.
7. **FAQ**, **Kontak**, **Kebijakan Privasi**.

## Sitemap lengkap (target, ala joinbareng — detail di `09-benchmark-joinbareng.md`)
```
/                         beranda: hero, kartu 4 pilar, kategori, ticker pembelian nyata, produk (tab Terlaris/Termurah/Terbaru/Rating),
                          papan permintaan, 4 langkah belanja aman, badge kepercayaan, ulasan, metode bayar, blog, FAQ, newsletter
/patungan                 katalog slot + filter kategori, badge "Slot Terakhir"/"Populer"
/patungan/<slug>          detail layanan, durasi, harga + fee, sisa slot, aturan
/jasa-bayar               daftar layanan luar negeri + form order
/jual-beli                marketplace; /jual-beli/kategori/<slug>; /jual-beli/<slug>-i.<seller>.<item>
/toko/<slug>              profil seller, rating, listing
/permintaan/beli          papan permintaan; /penawaran/jual papan penawaran
/jadi-penjual             onboarding seller
/cart, /checkout          keranjang & bayar
/dashboard                saldo, pesanan saya, patungan aktif, jasa bayar, toko (seller), payout
/login, /sign-up          akun (email + OTP WA)
/perlindungan-pembeli, /help, /contact-us, /terms-and-conditions, /privacy-policy, /legalitas, /blog
```

## Navigasi
`Beranda | Katalog | Cara Kerja | FAQ | Cek Pesanan | Hubungi Kami`

## Tahap pengembangan
- **Tahap 1 (sekarang):** landing statis `site/` + order via WhatsApp + bayar QRIS statis.
- **Tahap 2:** form order + payment gateway (Midtrans / Xendit / Tripay / Duitku) dengan webhook.
- **Tahap 3:** dashboard member, auto-reminder renewal (WA API), stok slot otomatis.

## Branding
Nada santai & ramah ("kak"), hijau/ungu cerah, tekankan **hemat, aman, bergaransi, aktif cepat**.
