# 05 — SOP Admin

## Jam layanan (pembanding joinbareng: chat Sen–Jum 10–18, WA 08–16 WIB, jasa bayar 09–22 WIB)
- CS & patungan: setiap hari 08.00–22.00 WITA. Jasa bayar: 09.00–22.00 WITA. Di luar jam: auto-reply + diproses pagi.
- Semua tanggal/jam di ClickUp mengikuti zona akun ClickUp (cek `clickup_get_user`).

## QA/QC
Checklist lengkap di `16-qa-qc.md`; jalankan skill `qc-harian` setiap malam.

## Harian (pagi 08.00 & malam 21.00)
- [ ] Cek pesan masuk WA/IG/website, balas semua.
- [ ] Cek mutasi pembayaran, aktivasi order yang sudah bayar.
- [ ] ClickUp: buka list **Order Aktif**, filter due ≤ 3 hari → kirim reminder renewal.
- [ ] Lepas slot yang lewat H+1 tanpa perpanjangan.
- [ ] Cek komplain terbuka (list **Komplain**), selesaikan ≤ 24 jam.

- [ ] Jasa Bayar: proses order DIBAYAR (list **Jasa Bayar**), update kurs harian (skill `proses-jasa-bayar`).
- [ ] Marketplace (jika sudah jalan): putus sengketa ≤ 24 jam (skill `mediasi-sengketa`), cek pesanan lewat batas kirim, cairkan payout 17.00.
- [ ] Moderasi listing & permintaan baru; tinjau KYC seller (skill `onboarding-seller`).

## Mingguan (Senin)
- [ ] Rekap pemasukan & pengeluaran mingguan.
- [ ] Audit akun induk: login, profil asing, perangkat aneh, ganti password jika perlu.
- [ ] Update stok slot di `site/produk.json`.
- [ ] Posting konten promo (lihat `07-marketing.md`).

## Bulanan (tanggal 1)
- [ ] Bayar tagihan paket induk sebelum jatuh tempo.
- [ ] Cek perubahan harga resmi → update harga.
- [ ] Laporan KPI (slot aktif, renewal rate, komplain, margin).
- [ ] Backup data order (export ClickUp).

## Keamanan
- Kredensial hanya di password manager, aktifkan 2FA di email induk.
- Email induk terpisah per layanan.
- Jangan kirim password akun induk ke pembeli jika skema undangan tersedia.
