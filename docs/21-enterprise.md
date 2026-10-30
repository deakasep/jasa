# 21 — Standar Enterprise

Tujuan: bisnis bisa diaudit, aman, tahan gangguan, dan bisa diserahkan ke tim tanpa bergantung pada satu orang.

## 1. Tata kelola
- Pemilik produk: pemilik bisnis. Semua aturan/fee/alur berubah lewat **PR ke repo ini** (riwayat lengkap = jejak keputusan), dicatat di `docs/CHANGELOG.md`,
  keputusan besar di `docs/adr/` (Architecture/Business Decision Record).
- Sumber kebenaran tunggal: angka di `config/fee.json`, katalog di `site/produk.json`, aturan di `docs/`. ClickUp = eksekusi & pengingat, bukan sumber aturan.
- Progres & serah terima: `STATUS.md` diperbarui setiap akhir sesi kerja (backup ingatan).

## 2. Peran & hak akses (RBAC) — prinsip *least privilege*
| Peran | Boleh | Tidak boleh |
|---|---|---|
| `owner` | semua, ubah fee, kelola peran | — |
| `finance` | lihat ledger, setujui payout & refund > Rp500.000, rekonsiliasi | ubah katalog/fee |
| `admin_ops` | proses order, aktivasi, batch, refund ≤ Rp500.000, moderasi listing | payout, ubah fee, lihat KYC penuh |
| `cs` | chat, lihat pesanan (data disamarkan), buat tiket | refund, kredensial akun induk |
| `kyc_reviewer` | lihat & putuskan dokumen KYC/rekening | transaksi uang |
| `host` / `seller` | kelola penawaran & listing sendiri, tarik saldo sendiri | data pengguna lain |
| `buyer` (joiner) | pesanan & dompet sendiri | — |
**Empat mata (maker–checker):** payout, refund > Rp500.000, perubahan fee, penghapusan data, dan akses kredensial akun induk butuh 2 orang
(pengaju ≠ penyetuju). Selama masih 1 orang: wajib jeda 1 jam + catatan alasan di audit log.

## 3. Audit log
Setiap aksi sensitif dicatat tidak bisa diubah (append-only): siapa, kapan, apa, objek, nilai sebelum/sesudah, IP/perangkat, alasan.
Wajib untuk: login admin, perubahan peran, mutasi saldo manual, keputusan refund/sengketa/KYC, akses kredensial, ekspor data, perubahan fee.
Retensi audit log: 5 tahun. Review mingguan oleh `owner` (bagian QC mingguan).

## 4. Keamanan
- Akun: 2FA wajib untuk semua admin & email bisnis; password manager tim (Bitwarden/1Password) dengan vault terpisah per peran.
- Kredensial akun induk: hanya di vault; rotasi saat anggota keluar & tiap 90 hari; tidak pernah di repo/ClickUp/chat grup.
- Aplikasi: webhook diverifikasi signature + idempotency key; semua mutasi saldo lewat ledger berpasangan; RLS di database; rate limit login/OTP;
  enkripsi data sensitif (KYC, rekening) di level kolom; secret hanya di environment variable (tidak di kode); dependensi dipantau Dependabot.
- Repo: branch utama dilindungi, merge hanya bila check `QA` hijau; `CODEOWNERS` mewajibkan review pemilik untuk `config/` dan `docs/04-*`.
- Kerentanan: dilaporkan via `SECURITY.md`; tanggapi ≤ 72 jam.

## 5. Klasifikasi data
| Kelas | Contoh | Penyimpanan |
|---|---|---|
| Rahasia | kredensial akun induk, KYC, nomor rekening, token API | vault / kolom terenkripsi; tidak pernah di repo/ClickUp |
| Terbatas | nama, WA, email pembeli, riwayat pesanan | database, akses sesuai peran, disamarkan untuk CS |
| Internal | SOP, fee, katalog | repo |
| Publik | harga jual, S&K, FAQ | website |

## 6. Backup & pemulihan bencana
- Repo: GitHub (sumber) + backup mingguan ke penyimpanan kedua (zip unduhan / mirror) — task ClickUp bulanan "uji pulihkan backup".
- Database (tahap 1+): backup otomatis harian, retensi 30 hari, point-in-time recovery; ekspor terenkripsi mingguan ke lokasi terpisah.
- ClickUp: ekspor CSV bulanan (SOP bulanan).
- Target: **RPO ≤ 24 jam**, **RTO ≤ 4 jam**. Uji pemulihan tiap 3 bulan, hasil dicatat di QA & QC.
- Rencana kontinuitas: akun induk cadangan per layanan populer, rekening & gateway cadangan (Xendit + Tripay), nomor WA cadangan.

## 7. Manajemen insiden
| Sev | Contoh | Respons awal | Komunikasi |
|---|---|---|---|
| SEV1 | kebocoran data, dana hilang, gateway mati total | ≤ 15 menit | pengguna terdampak ≤ 3×24 jam (UU PDP), status di WA Channel |
| SEV2 | akun induk diblokir (banyak pelanggan), webhook gagal | ≤ 1 jam | pelanggan terdampak hari yang sama |
| SEV3 | satu pesanan/slot bermasalah | ≤ 4 jam (jam kerja) | via tiket |
Langkah: deteksi → tahan (cabut akses, ganti password, matikan fitur) → pulihkan → komunikasi → **post-mortem tanpa menyalahkan** ≤ 5 hari kerja
(folder `docs/postmortem/`, format nama YYYY-MM-DD-judul, template di `docs/postmortem/README.md`) → tindakan korektif masuk QA & QC.

## 8. Manajemen perubahan
Perubahan fee/aturan: PR + CHANGELOG + pengumuman ≥ 7 hari ke pengguna. Perubahan kode: PR → `QA` hijau → merge → deploy → pantau 30 menit.
Rilis tahap baru: skill `qa-uji-alur` lulus dulu.

## 9. SLO & observabilitas (tahap 1+)
Ketersediaan web ≥ 99,5%/bulan; webhook pembayaran diproses ≤ 1 menit (p95); error rate API < 1%.
Pantau: uptime monitor, log terstruktur, alert ke WA/email admin, dashboard KPI (`16-qa-qc.md` §F).

## 10. Kepatuhan (checklist)
- [ ] NIB via OSS (KBLI perdagangan eceran via internet / portal web) — task ClickUp ada.
- [ ] **Pendaftaran PSE Lingkup Privat** (Kominfo/Komdigi) — wajib untuk platform digital yang melayani pengguna Indonesia.
- [ ] UU PDP: kebijakan privasi, persetujuan, DPO/penanggung jawab data, prosedur kebocoran ≤ 3×24 jam, catatan pemrosesan data.
- [ ] Perlindungan konsumen (UU 8/1999): S&K jelas, kanal pengaduan, refund sesuai aturan.
- [ ] Pajak: PPh Final UMKM 0,5% (cek aturan terbaru), PPN bila omzet melewati batas PKP; pencatatan jasa bayar per transaksi.
- [ ] Payment gateway: KYB lengkap; dana pengguna (escrow/dompet) dipegang di rekening yang ditunjuk sesuai ketentuan gateway; konsultasi bila saldo besar
  (aturan uang elektronik BI).
- [ ] AML: KYC host/seller (sudah), pantau transaksi tidak wajar (top-up besar berulang, jasa bayar pembeli baru > Rp2 juta).
- [ ] Review hukum S&K & privasi oleh konsultan sebelum peluncuran publik.

## 11. Vendor
Daftar vendor kritis & penggantinya: payment gateway (Xendit ↔ Tripay ↔ Midtrans), hosting (Vercel ↔ VPS), database (Supabase ↔ Neon),
WA API (Fonnte ↔ WA Business resmi), email (Resend ↔ SES). Review tahunan biaya & keamanan.
