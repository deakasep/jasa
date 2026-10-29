---
name: qa-uji-alur
description: Uji alur (QA) sebelum rilis atau setelah mengubah aturan/fee/skill — jalankan cek otomatis repo dan skenario uji P/J/M/S/K di docs/16-qa-qc.md. Gunakan saat pemilik minta QA, sebelum launch tahap baru, atau setelah perubahan besar.
---
# QA Uji Alur

1. Jalankan `python3 scripts/qa_check.py` → harus "SEMUA CEK LULUS". Gagal → perbaiki penyebabnya dulu.
2. Jalankan skenario tabel `docs/16-qa-qc.md` §B yang relevan dengan perubahan:
   - Perubahan fee/kurs → J1 dengan `scripts/hitung.py` (69, 70, 500, 501 USD) dan P (patungan 50.000 → fee 13.000).
   - Perubahan alur/status → P1–P5, M1–M5 di sandbox payment gateway (mode test) bila platform sudah ada; tahap 0 → simulasikan
     dengan template WA + task ClickUp uji (tag `qa-test`, hapus/tutup setelahnya).
3. Catat hasil per ID (lulus/gagal + catatan) di task "QA rilis <tahap/perubahan>" list **QA & QC**.
4. Gagal → perbaiki dokumen/skill/skrip, tambahkan cek baru ke `scripts/qa_check.py` bila bisa diotomatiskan, ulangi.
5. Semua lulus → commit, push; PR di-merge hanya bila GitHub Actions `QA` hijau.
