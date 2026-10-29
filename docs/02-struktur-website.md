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

## Navigasi
`Beranda | Katalog | Cara Kerja | FAQ | Cek Pesanan | Hubungi Kami`

## Tahap pengembangan
- **Tahap 1 (sekarang):** landing statis `site/` + order via WhatsApp + bayar QRIS statis.
- **Tahap 2:** form order + payment gateway (Midtrans / Xendit / Tripay / Duitku) dengan webhook.
- **Tahap 3:** dashboard member, auto-reminder renewal (WA API), stok slot otomatis.

## Branding
Nada santai & ramah ("kak"), hijau/ungu cerah, tekankan **hemat, aman, bergaransi, aktif cepat**.
