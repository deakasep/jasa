---
name: qc-listing-host
description: Periksa kualitas listing marketplace, grup host patungan, atau permintaan di papan permintaan sebelum/sesudah tayang (barang terlarang, harga, batas kirim, bukti plan resmi). Gunakan saat ada listing/host/permintaan baru atau audit mingguan.
---
# QC Listing & Host

1. Baca kriteria `docs/16-qa-qc.md` §E, barang terlarang `docs/04-rules-syarat-ketentuan.md`, plan yang diizinkan `docs/06-legal-risiko.md`.
2. Listing: judul & kategori sesuai, harga wajar (bandingkan `data/harga-pembanding.json`), batas kirim ≤ 24 jam, garansi diisi,
   deskripsi tanpa nomor WA/Telegram/rekening, bukan akun plan pribadi/akun keuangan/konten dewasa/hasil curian.
3. Host: KYC lulus (list **Seller & KYC**), bukti plan multi-user resmi, slot ≤ batas plan, harga/slot ≤ plan/slot, tanggal tagihan.
4. Permintaan: bukan barang terlarang, budget masuk akal.
5. Putusan: LULUS / PERBAIKI (beri alasan) / TURUNKAN. Catat di task seller terkait; pelanggaran → sanksi via `onboarding-seller`.
