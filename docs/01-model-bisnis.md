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
| Patungan (slot langganan) | dokumen ini + `03-workflow-order.md` + `15-patungan-batch.md` | **joiner**: 10% + Rp8.000/bln (tahunan: 20% + Rp6.500 per bulan); **host**: connection fee 25% maks Rp5.000 (tahunan 20% maks Rp6.000) bulan pertama per joiner |
| Jasa Bayar | `11-jasa-bayar.md` | < US$70 Rp50.000 flat · US$70–500 4% · > US$500 3,5% + spread kurs 1,5% |
| Marketplace escrow | `10-marketplace-escrow.md` | fee seller 5% (sementara) per transaksi selesai |

Semua fee **sama dengan joinbareng** dan terpusat di `config/fee.json`. Contoh patungan: harga per orang Rp50.000 bulanan →
fee Rp13.000 → pembeli bayar Rp63.000. Hitung: `python3 scripts/hitung.py patungan 50000 bulanan`.
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

## Hitungan harga patungan (model joinbareng: untung dari fee, bukan dari harga slot)
```
harga_per_slot = harga_plan_resmi / jumlah_slot              # dibulatkan ke atas ribuan
fee            = bulanan: 10% × harga_per_slot + Rp8.000  |  tahunan: 20% × harga_per_slot + Rp6.500
bayar_pembeli  = harga_per_slot + fee
```
Contoh: Netflix Premium Rp186.000 / 4 slot = Rp46.500 → fee Rp12.650 → pembeli bayar Rp59.150 (dibulatkan Rp60.000).
Biaya payment gateway (±0,7% QRIS) ditanggung dari fee. Paket dengan user lebih banyak = harga per slot lebih murah
(contoh mereka: Netflix 4 user Rp64.000, 5 user Rp52.000).

Simpan cadangan **1 slot kosong / 5 slot terjual** untuk penggantian garansi.

## Durasi jual
Bulanan (utama) dan tahunan, sama seperti joinbareng. Promo memakai **kode promo** (lihat `15-patungan-batch.md`), bukan diskon otomatis.

## KPI
- Jumlah slot aktif, tingkat perpanjangan (renewal rate) ≥ 70%
- Komplain per 100 slot ≤ 3
- Waktu aktivasi rata-rata ≤ 15 menit (jam kerja)
- Margin bersih per bulan
