# 19 — Berapa Persen yang Kita Dapat (pembeli vs penjual)

Angka mengikuti `config/fee.json` (= fee joinbareng, sumber: artikel bantuan "Berapa biaya yang harus saya bayar", S&K, FAQ jasa bayar).
Tabel selalu terbaru: `python3 scripts/hitung.py pendapatan`.

## Ringkasan — INGAT INI
| Dari siapa | Pilar | Rumus | Persen efektif |
|---|---|---|---|
| **Pembeli** (joiner) | Patungan bulanan | 10% harga slot + Rp8.000 / bulan | ±15–39% di atas harga slot (slot makin murah, % makin besar) |
| **Pembeli** (joiner) | Patungan tahunan | (20% harga slot/bulan + Rp6.500) × 12 | ±25–43% |
| **Penjual** (host patungan) | Connection fee | 25% harga slot, maks Rp5.000 (bulanan) · 20%, maks Rp6.000 (tahunan) — **hanya bulan pertama tiap joiner baru**; berbagi pribadi 0 | bulan-1: ±10–25% · bulan berikutnya: **0%** |
| **Pembeli** | Jasa Bayar | < $70 Rp50.000 · $70–500 4% · > $500 3,5% **+ spread kurs 1,5%** | ±14% ($20) · ±5,3% ($100–200) · ±4,8% ($600) |
| **Penjual** (seller) | Marketplace | 5% per pesanan selesai, min Rp1.000 (sementara — joinbareng tidak publikasi) | 5% (7,7% untuk pesanan Rp13.000) |
| — | Papan Permintaan | gratis | 0% |
| — | Dompet / referral | top-up tidak bisa ditarik; referral Rp10.000 = **biaya** marketing kita | — |

**Intinya:** pemasukan terbesar dari **pembeli** (fee patungan + fee jasa bayar). Dari **penjual**: 5% marketplace dan connection fee host
(sekali per joiner baru). Grup **Resmi JASA**: kita sekaligus host, jadi yang kita terima = fee joiner (+ selisih pembulatan harga slot).

## Contoh (bruto → bersih setelah estimasi biaya QRIS)
| Contoh | Dari | Pendapatan | % | Bersih |
|---|---|---|---|---|
| Netflix slot Rp46.500 (contoh resmi joinbareng) | pembeli | Rp12.650 → bayar Rp59.150 | 21,4% | ±Rp11.500 |
| Netflix slot Rp47.000 (katalog kita) | pembeli | Rp12.700 → bayar Rp59.700 | 21,3% | Rp11.532 |
| Host komunitas slot Rp46.500, bulan pertama | penjual | Rp5.000 (host terima Rp41.500) | 10,8% | Rp5.000 |
| Host komunitas, bulan ke-2 dst | penjual | Rp0 | 0% | — |
| Jasa Bayar US$20 (kurs 16.500) | pembeli | Rp54.950 | 14,3% | Rp51.505 |
| Jasa Bayar US$100 | pembeli | Rp91.740 | 5,3% | Rp78.796 |
| Marketplace pesanan Rp50.000 | penjual | Rp2.500 | 5,0% | Rp1.400 |
| Marketplace pesanan Rp13.000 | penjual | Rp1.000 | 7,7% | Rp159 |

## Untung BERSIH Jasa Bayar (setelah kartu, QRIS, pajak) — `python3 scripts/hitung.py jasa-bayar-bersih <usd> <kurs>`
| Contoh (kurs 16.500) | Tagihan klien | Keluar ke kartu* | QRIS | Pajak UMKM 0,5%** | **Bersih** |
|---|---|---|---|---|---|
| Claude $10 + PPN 11% | Rp236.000 | Rp186.813 | Rp2.402 | Rp1.180 | **Rp45.605 (19,3%)** |
| ChatGPT Plus $20 (PPN 0) | Rp385.000 | Rp336.600 | Rp3.445 | Rp1.925 | **Rp43.030 (11,2%)** |
| Claude Max $200 + PPN, pajak dasar fee | Rp3.852.000 | Rp3.736.260 | Rp27.714 | Rp579 | **Rp87.447 (2,3%)** → pakai VA |

\* estimasi kurs bank +2% di atas kurs tengah (angka nyata dicatat per order). \*\* dasar pajak (total vs fee saja) wajib dikonfirmasi akuntan.
Sumber untung utama = fee jasa; spread 1,5% hanya menutup kurs bank.

## Banding Shopee (dicek 2026-10-30) — model fee di-review saat omzet besar
Joinbareng/JASA memungut terutama dari **pembeli**; Shopee memotong **penjual**. Contoh barang/slot Rp100.000:

| | Shopee (penjual non-Star) | Joinbareng / JASA |
|---|---|---|
| Pembeli bayar | Rp100.000 + ongkir | Patungan Rp118.000 (10% + Rp8.000) · Marketplace Rp100.000 |
| Penjual dipotong | admin 10% (fashion) / 2,5% (voucher digital, e-money, tiket) + proses Rp1.250/pesanan (+ gratis ongkir, promo, iklan bila ikut: total 20–28%) | host Rp5.000 **hanya bulan pertama** · marketplace 5% (sementara) |
| Platform dapat | ±11% / ±4% dari penjual | ±18% dari pembeli + Rp5.000 host bulan pertama |
| Pajak | Shopee/Tokopedia/Lazada/Blibli **memungut PPh 22 0,5% dari omzet penjual** (PMK 37/2025, berlaku Okt 2026; WP orang pribadi omzet ≤ Rp500 juta bebas dengan surat pernyataan) | belum ditunjuk pemungut; penjual urus pajak sendiri |

Sumber: remarketing.id (update admin Shopee 31 Jul 2026), webekspor.com (potongan 2026), CNBC Indonesia 31 Jul 2026, Katadata (berlaku Okt 2026).

**Keputusan pemilik 2026-10-30:** saat omzet sudah besar, model fee diubah **seperti Shopee** (fee per transaksi dari penjual per kategori,
biaya proses per pesanan, fee pembeli diturunkan supaya harga bersaing). Pemicu review (usulan, dicek tiap kuartal):
omzet JASA > Rp4,8 miliar/tahun (batas PKP → fee kita kena PPN 11%) **atau** JASA ditunjuk pemungut PPh 22 marketplace **atau** volume
marketplace melewati patungan. Perubahan = ubah `config/fee.json` + CHANGELOG + QA, umumkan ke pengguna ≥ 30 hari sebelumnya.

## Catatan keputusan
1. **Pesanan marketplace kecil hampir tidak untung** karena biaya QRIS (±0,7% + Rp750) kita tanggung. Mitigasi bawaan joinbareng:
   **dompet** (top-up min Rp50.000 sekali bayar → banyak transaksi kecil tanpa biaya gateway per transaksi). Dorong pembeli pakai saldo.
2. Fee seller marketplace 5% masih sementara (task ClickUp "Konfirmasi persen fee seller").
3. Jasa bayar: spread 1,5% bisa habis oleh biaya FX kartu (1–3%). Pilih kartu bisnis ber-FX rendah; pantau di laporan KPI.
4. Grup Resmi: slot kosong = beban kita. Isi batch dulu sebelum membeli plan (`15-patungan-batch.md`).
5. Referral Rp10.000 per aktivasi dihitung sebagai biaya akuisisi; batasi 1x per pengguna baru yang sudah bertransaksi (anti-abuse).
