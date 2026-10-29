# 03 — Workflow Order

```
Calon pembeli → Tanya / pilih produk → Konfirmasi slot tersedia → Kirim tagihan
→ Bayar → Verifikasi → Aktivasi slot → Kirim akses + S&K → Catat ClickUp
→ H-3 reminder renewal → Perpanjang / Lepas slot
```

## Langkah detail
1. **Inquiry** — balas ≤ 5 menit (template `templates/pesan-whatsapp.md#sapaan`).
2. **Cek stok slot** — lihat ClickUp list **Stok Slot**. Kalau penuh → tawarkan waiting list.
3. **Tagihan** — kirim kode order `JSA-YYMMDD-NN`, produk, durasi, total, QRIS.
4. **Verifikasi pembayaran** — cek mutasi; jangan percaya screenshot saja.
5. **Aktivasi**
   - Profil: buat/bersihkan profil, beri nama + PIN.
   - Undangan family/tim: kirim invite ke email pembeli.
   - Seat: tambah ke workspace tim.
6. **Kirim akses** + ringkasan rules + tanggal habis.
7. **Catat** — task ClickUp di **Order Aktif**: judul `[Produk] Nama – JSA-xxx`, due date = tanggal habis,
   tag produk, isi: kontak, slot, nominal.
8. **Renewal** — H-3 kirim pengingat; H-0 belum bayar → H+1 slot dilepas & task dipindah ke **Selesai/Lepas**.
9. **Komplain** — ikuti skill `komplain-garansi`.

## Status (ClickUp)
`MENUNGGU BAYAR → AKTIF → H-3 RENEWAL → DIPERPANJANG / LEPAS`
