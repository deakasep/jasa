# 14 — Arsitektur Teknis & Roadmap Platform

## Stack usulan (murah, bisa mulai tanpa modal besar)
- Frontend + API: **Next.js** (App Router) di Vercel. Database: **Postgres** (Supabase/Neon free tier). Auth: Supabase Auth / NextAuth (email + OTP WA).
- Pembayaran: **Midtrans / Xendit / Tripay / Duitku** (QRIS, VA, e-wallet, Indomaret) + webhook. Payout seller: disbursement API gateway yang sama.
- File (bukti, KYC): storage privat + URL bertanda tangan. Email: Resend. WA notifikasi: WA Business API (Fonnte/Wablas di awal).
- Job terjadwal (cron): auto-selesai masa cek, batalkan lewat batas kirim, pengingat renewal H-3, kadaluarsa invoice.

## Model data (tabel inti)
```
users(id, nama, email, wa, role[buyer|seller|admin], saldo, created_at)
seller_profiles(user_id, nama_toko, level, kyc_status, rekening_ref, rating)
listings(id, seller_id, kategori, judul, harga, stok, batas_kirim_jam, garansi_hari, kirim_otomatis, status)
listing_stock(id, listing_id, payload_terenkripsi, terpakai_order_id)
orders(id, kode, buyer_id, listing_id, qty, total, fee, status, paid_at, shipped_at, cek_sampai, closed_at)
order_messages(id, order_id, sender_id, body, lampiran, created_at)
disputes(id, order_id, kategori, bukti, putusan, nominal_refund, decided_by, decided_at)
ledger(id, user_id, order_id, tipe[hold|release|refund|fee|payout|topup], nominal, saldo_setelah, created_at)
payouts(id, seller_id, nominal, status, ref_gateway)
patungan_groups(id, layanan, host_id|internal, kapasitas, terisi, harga_per_slot, periode, tagihan_berikut)
patungan_members(id, group_id, user_id, slot_kode, mulai, habis, status)
jasa_bayar_orders(id, kode, buyer_id, layanan, harga_usd, kurs, fee, total, email_akun, status, bukti)
requests(id, buyer_id, judul, kategori, budget_min, budget_max, status, expires_at)
offers(id, request_id|null, seller_id, harga, catatan, status)
reviews(id, order_id, rating, komentar, balasan_seller)
```
Kredensial akun pelanggan **tidak** disimpan di tabel mana pun dalam bentuk teks biasa.

## Keamanan
Verifikasi signature webhook, idempotency key per pembayaran, semua mutasi saldo lewat `ledger` (tidak pernah update saldo langsung),
RLS di Postgres, rate limit login/OTP, log audit aksi admin.

## Roadmap (ditautkan ke ClickUp list **Roadmap Platform**)
| Tahap | Isi | Target |
|---|---|---|
| 0 | Landing statis `site/` + order WA + QRIS (sudah) | Nov 2026 |
| 1 | Next.js: katalog patungan, checkout + gateway, dashboard pembeli, cron renewal | Des 2026 |
| 2 | Jasa Bayar form + invoice otomatis + kurs harian | Jan 2027 |
| 3 | Marketplace multi-seller: KYC, listing, escrow, ledger, payout, ulasan | Feb–Mar 2027 |
| 4 | Papan permintaan/penawaran, chat + filter anti-pindah, sengketa | Apr 2027 |
| 5 | Blog SEO, newsletter, referral, ticker social proof | Mei 2027 |
