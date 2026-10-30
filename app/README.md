# app/ — Platform JASA (Tahap 1, fondasi)

Next.js + Prisma (PostgreSQL). Logika bisnis murni di `src/domain/` (tanpa dependensi, diuji dengan test runner bawaan Node).

| Folder | Isi |
|---|---|
| `src/domain/` | fee, ledger berpasangan, escrow marketplace, patungan (batch/host/renewal), jasa bayar, promo & referral, RBAC + empat mata, filter chat, skor kepercayaan, audit, perencana cron |
| `src/server/` | Prisma client, penyimpan jurnal idempoten, verifikasi webhook, pengolah pembayaran bersama, pembuat invoice Xendit/Tripay |
| `src/app/checkout`, `src/app/admin` | Checkout minimal patungan (`?paket=NFX-4`, tanpa gateway) · dashboard admin data contoh (`?peran=owner|admin_ops|finance|cs`; RBAC, antrian aksi cron, batch, refund + empat mata). `/admin` di production hanya bila `ADMIN_CONTOH=1` |
| `src/app/api/` | `quote` (kuotasi publik), `webhooks/tripay`, `webhooks/xendit`, `cron` (dilindungi `CRON_SECRET`), `health` |
| `prisma/schema.prisma` | Skema lengkap: pengguna & peran, KYC, rekening, layanan/paket/batch, host offer, langganan, marketplace, jasa bayar, pembayaran, ledger, payout, refund, promo, referral, waitlist, permintaan/penawaran, audit |

## Jalankan
```bash
cd app
cp .env.example .env.local     # isi DATABASE_URL dst.
npm install
npm test                       # 104 test domain & server (tanpa database/jaringan)
npm run db:migrate             # buat tabel
npm run db:seed                # isi layanan & paket dari ../site/produk.json
npm run dev
```
Angka fee dibaca dari `../config/fee.json` (sama dengan `scripts/hitung.py`). Test memastikan hasil identik dengan contoh resmi joinbareng.

## Aturan kode
- Uang = integer Rupiah. Saldo tidak pernah di-update langsung — selalu lewat `Journal` (ledger berpasangan, `ref` unik = idempoten).
- Webhook: verifikasi signature dengan RAW body sebelum apa pun.
- Data rahasia hanya referensi vault/storage terenkripsi.
- Tambah fitur = tambah test di `src/**/*.test.ts`; CI (`.github/workflows/qa.yml`) wajib hijau sebelum merge.
