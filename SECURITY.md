# Kebijakan Keamanan

## Melaporkan kerentanan
Jangan buka issue publik. Kirim laporan ke kanal resmi pemilik (email bisnis / WhatsApp CS) dengan judul "SECURITY":
langkah reproduksi, dampak, dan bukti. Kami menanggapi ≤ 72 jam dan memberi kabar perbaikan.

## Aturan repo
- Dilarang commit: password, PIN, token/API key, data KTP/KYC, nomor kartu/rekening, data pribadi pelanggan.
- `scripts/qa_check.py` memindai pola rahasia di setiap push; check `QA` merah = tidak boleh merge.
- Rahasia aplikasi hanya di environment variable / secret manager (lihat `app/.env.example`).
- Bocor tidak sengaja: anggap rahasia sudah terekspos → **ganti/rotasi segera**, baru hapus dari riwayat; catat sebagai insiden (`docs/21-enterprise.md` §7).
