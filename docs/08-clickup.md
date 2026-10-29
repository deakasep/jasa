# 08 — ClickUp (Pengingat & Data Order)

Folder **JASA – Patungan Premium** di Space "Space":

| List | Fungsi |
|---|---|
| Setup Bisnis | Checklist peluncuran (website, payment, legal, akun induk) |
| Order Aktif | 1 task per pelanggan; due date = tanggal habis → jadi pengingat renewal |
| Stok Slot | 1 task per akun induk; isi kapasitas, terisi, tanggal tagihan |
| Komplain | Tiket garansi, target selesai ≤ 24 jam |
| Rutin Admin | Pengingat berulang harian/mingguan/bulanan dari SOP |

| Jasa Bayar | 1 task per order JBY; langganan berulang → due = tagihan berikutnya |
| Seller & KYC | 1 task per seller: status KYC, level, sanksi (tanpa data KTP) |
| Sengketa & Escrow | sengketa marketplace, due = batas putusan 24 jam / akhir masa cek |
| Roadmap Platform | tahap 0–5 website (`14-arsitektur-teknis.md`) + ide dari permintaan pembeli |

Format judul order: `[Produk] Nama – JSA-YYMMDD-NN`. Tag: nama produk.

## ID (untuk skill Claude)
- Folder: `1100360000156419`
- Setup Bisnis: `1100360000161997`
- Order Aktif: `1100360000161998`
- Stok Slot: `1100360000161999`
- Komplain: `1100360000162000`
- Rutin Admin: `1100360000162001`
- Jasa Bayar: `1100360000162010`
- Seller & KYC: `1100360000162011`
- Sengketa & Escrow: `1100360000162012`
- Roadmap Platform: `1100360000162013`

Format judul: Jasa Bayar `[Layanan] Nama – JBY-YYMMDD-NN` · Sengketa `[SENGKETA] KODE – masalah` · Seller `[SELLER] Nama toko`.

Task di **Rutin Admin** perlu diaktifkan Recurring secara manual di ClickUp (klik due date → Recurring).
