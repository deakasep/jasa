# 12 — Papan Permintaan & Penawaran

Untuk barang yang tidak ada di katalog.

## Permintaan (pembeli)
Form: judul, kategori, deskripsi kebutuhan, budget min–maks, lokasi (opsional), masa aktif (default 30 hari).
Tampil di `/permintaan/beli`; seller yang terverifikasi bisa **menawar** (harga, stok, waktu kirim). Pembeli pilih
penawaran → otomatis jadi pesanan marketplace biasa (escrow berlaku).

## Penawaran (seller)
Seller posting stok/jasa khusus + harga di `/penawaran/jual` (khusus penjual).

## Moderasi
- Permintaan dicek sebelum tayang (maks 12 jam). Tolak barang terlarang (`04-rules-syarat-ketentuan.md` §Barang terlarang).
- Nego hanya lewat chat platform. Permintaan kadaluarsa otomatis.
- Sebelum ada platform: kumpulkan permintaan via WhatsApp → catat di ClickUp **Roadmap Platform** sebagai ide produk.
