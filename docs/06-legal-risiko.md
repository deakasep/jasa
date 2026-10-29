# 06 — Legal & Risiko

> Penting: banyak layanan melarang berbagi akun di luar ketentuan mereka. Contoh: Spotify & YouTube
> Family mensyaratkan anggota satu rumah; Netflix membatasi berbagi di luar rumah tangga. Akun bisa
> dibekukan dan garansi jadi beban kita.

## Mitigasi
1. Prioritaskan produk yang memang **mengizinkan seat/tim** (Canva Teams, ChatGPT/Claude Team,
   Microsoft 365, Google Workspace, Notion Team) atau program **reseller/affiliate resmi**.
2. Tulis jelas di S&K bahwa yang dijual adalah slot akses, dan risiko kebijakan penyedia.
3. Sebar risiko: jangan taruh semua pelanggan di satu akun induk.
4. Siapkan dana cadangan garansi (±10% omzet).

## Pernyataan legalitas (ditiru dari halaman legalitas joinbareng, untuk halaman `/legalitas` kita)
1. JASA adalah pengelola plan resmi multi-user, bukan penjual akun bajakan.
2. Plan dibeli langsung dari penyedia atas nama JASA, dibuka per batch, dana pembeli ditahan sampai batch aktif, perpanjangan via invoice.
3. Hanya plan yang ToS-nya mengizinkan multi-user: Spotify Family/Duo, YouTube Premium Family, Apple One Family, Microsoft 365 Family,
   Netflix Premium (multi-screen sesuai kebijakan rumah tangga), Disney+ multi-screen, Canva Teams, seat Team/Business resmi.
4. Tidak: akun OG/generate massal, kartu curian, cracking/jailbreak, berbagi password plan pribadi, layanan yang ToS-nya melarang multi-user.
5. Pengguna tetap bertanggung jawab patuh ToS layanan; JASA memantau perubahan kebijakan dan menurunkan listing bila perlu.
6. Dasar: UU 8/1999 Perlindungan Konsumen (refund bila layanan tidak sesuai), UU 27/2022 PDP, UU ITE.
7. Pembayaran lewat payment gateway mitra PJP berizin BI; data kartu tidak disimpan.
Daftar plan diizinkan dicek otomatis oleh `scripts/qa_check.py` (`PLAN_TERLARANG`).

## Risiko pilar baru
- **Akun AI pribadi** (Claude Pro/Max/Code, ChatGPT Plus): ketentuan penyedia melarang berbagi akun/kredensial. Jangan dijual
  sebagai patungan. Alternatif sah: seat Team/Business, atau **Jasa Bayar** atas akun pembeli sendiri.
- **Saldo & escrow**: menahan dana pengguna. Saldo tertutup (hanya untuk belanja di platform) lebih aman; konsultasikan ke
  konsultan hukum/payment gateway sebelum memegang dana besar (aturan uang elektronik BI).
- **Jasa Bayar**: risiko carding/penipuan → batas transaksi pembeli baru, tolak kategori berisiko.
- **KYC seller**: data pribadi wajib dilindungi (UU PDP No. 27/2022): enkripsi, akses terbatas, hapus jika akun ditutup.

## Legalitas usaha (Indonesia)
- Daftar **NIB** via OSS (oss.go.id) — KBLI perdagangan eceran via internet / jasa terkait.
- Pajak: UMKM PPh Final 0,5% (cek aturan terbaru).
- Payment gateway (Midtrans/Xendit/Tripay) biasanya minta NIB/KTP & rekening atas nama sama.
