# 03 — Workflow Order (Patungan)

Detail sistem batch & host: `15-patungan-batch.md`. Jasa Bayar: `11-jasa-bayar.md`. Marketplace: `10-marketplace-escrow.md`.

```
Pilih layanan & paket → pilih batch (Tersedia) → tagihan (harga slot + fee) → bayar ≤ 30 menit
→ dana DITAHAN → [batch penuh / auto-provision] → aktivasi → kirim akses + aturan → catat ClickUp
→ H-3 invoice perpanjangan → bayar = lanjut | H+1 tidak bayar = slot dilepas
```

## Langkah detail
1. **Inquiry** — balas ≤ 5 menit (template `sapaan`). Layanan plan pribadi (AI dll.) → tawarkan Jasa Bayar.
2. **Cek slot** — `site/produk.json` + ClickUp **Stok Slot**. Penuh → batch berikutnya / waiting list (`stok-habis`).
3. **Tagihan** — kode `JSA-YYMMDD-NN`; total = `scripts/hitung.py patungan`; kode promo jika ada (template `tagihan`).
4. **Verifikasi** — webhook gateway / mutasi rekening. Jangan percaya screenshot saja.
5. **Batch** — belum penuh → `batch-menunggu`; 7 hari tidak penuh → tawarkan pindah/tunggu/refund.
6. **Aktivasi** — undangan family/tim ke email pembeli, atau profil + PIN (akun bersama). Ganti password induk bila ada anggota keluar.
7. **Kirim akses** — template `aktivasi` + aturan layanan + tanggal habis.
8. **Catat** — ClickUp **Order Aktif**: `[Produk] Nama – JSA-xxx`, due = tanggal habis, tag produk, isi kontak, kode slot, harga, fee.
9. **Renewal** — H-3 invoice (`reminder-h3`); H+1 tidak bayar → `slot-dilepas`, slot kembali ke batch.
10. **Klaim** — skill `komplain-garansi` (1–3 hari kerja, target ≤ 24 jam).

## Status
`MENUNGGU_BAYAR → MENUNGGU_BATCH → AKTIF → H-3_RENEWAL → DIPERPANJANG / LEPAS` · cabang: `KLAIM`, `REFUND`, `DICABUT` (pelanggaran).
