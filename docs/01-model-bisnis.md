# 01 — Model Bisnis

## Konsep
Pembeli tidak sanggup / tidak butuh bayar 1 langganan penuh. Kita beli paket **family / team / duo**
resmi, lalu menjual **slot** per bulan ke beberapa orang. Pembeli dapat harga jauh lebih murah,
kita dapat margin dari selisih harga + biaya layanan.

Model marketplace (seperti joinbareng): pembayaran otomatis (QRIS), slot aktif setelah bayar,
garansi + refund jika ada masalah.

## 4 sumber pendapatan (meniru struktur joinbareng, lihat `09-benchmark-joinbareng.md`)
| Pilar | Dokumen | Pendapatan |
|---|---|---|
| Patungan (slot langganan) | dokumen ini + `03-workflow-order.md` | margin slot / fee layanan 10% + Rp8.000 (bulanan), 20% + Rp6.500 (tahunan) |
| Jasa Bayar | `11-jasa-bayar.md` | fee jasa + selisih kurs |
| Marketplace escrow | `10-marketplace-escrow.md` | fee seller ±5% per transaksi selesai |
| Papan Permintaan | `12-papan-permintaan.md` | pendorong transaksi marketplace |

Urutan jalan: **Patungan → Jasa Bayar → Marketplace** (marketplace butuh website + gateway + KYC).

## Kategori produk
| Kategori | Contoh | Skema |
|---|---|---|
| Hiburan / Streaming | Netflix, Disney+ Hotstar, Prime Video, Vidio, Viu, WeTV, iQIYI | Profil per slot |
| Musik | Spotify Family/Duo, YouTube Premium Family, Apple Music Family | Undangan family |
| Desain | Canva Pro/Teams, CapCut Pro, Adobe | Undangan tim |
| Produktivitas | Microsoft 365 Family, Google One, Notion, Zoom | Undangan family/tim |
| AI Tools | ChatGPT Team/Business, Claude Team, Gemini, Perplexity, Midjourney | Seat tim |

## Hitungan harga (rumus)
```
modal_per_slot = harga_paket_resmi / jumlah_slot
harga_jual     = modal_per_slot + margin (20–40%) + biaya_payment_gateway (±0,7% QRIS)
```
Contoh: paket Rp186.000 / 6 slot = Rp31.000 modal → jual Rp39.000–45.000.

Simpan cadangan **1 slot kosong / 5 slot terjual** untuk penggantian garansi.

## Durasi jual
1 bulan (utama), 3 bulan (diskon 5%), 6 bulan (diskon 10%), 12 bulan (diskon 15%).

## KPI
- Jumlah slot aktif, tingkat perpanjangan (renewal rate) ≥ 70%
- Komplain per 100 slot ≤ 3
- Waktu aktivasi rata-rata ≤ 15 menit (jam kerja)
- Margin bersih per bulan
