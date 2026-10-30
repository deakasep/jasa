# ADR 0001 — Meniru penuh joinbareng (kecuali tampilan)

- Tanggal: 2026-10-30 · Status: diterima · Pengambil keputusan: pemilik
- Konteks: butuh model bisnis yang sudah terbukti di pasar Indonesia, cepat dijalankan tanpa modal besar.
- Keputusan: tiru struktur, mekanisme, aturan, dan **fee** joinbareng.com; tampilan web dibuat sendiri di akhir; teks ditulis ulang.
- Pengecualian: patungan plan single-user (akun AI pribadi), konten dewasa, akun keuangan ber-KYC, ulasan palsu (`docs/09-benchmark-joinbareng.md` §10).
- Konsekuensi: fee terpusat di `config/fee.json`; setiap perubahan joinbareng dipantau via skill `riset-kompetitor`.
