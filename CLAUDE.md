# CLAUDE.md — Aturan kerja bisnis JASA

Bahasa: balas pemilik dalam Bahasa Indonesia santai, jelas, singkat.

## Konteks
Bisnis jualan slot langganan premium (patungan) & akun premium. Sumber kebenaran:
- Katalog & harga: `site/produk.json`
- Alur order: `docs/03-workflow-order.md`
- Rules pembeli: `docs/04-rules-syarat-ketentuan.md`
- SOP admin: `docs/05-sop-admin.md`
- Pengingat & data order: ClickUp, folder **JASA – Patungan Premium** (lihat `docs/08-clickup.md`)

## Aturan
1. Jangan pernah menyimpan password/email akun pelanggan atau akun induk di repo. Kredensial
   hanya di password manager (Bitwarden/1Password). Repo boleh berisi kode slot saja (mis. `NFX-03`).
2. Setiap perubahan harga: ubah `site/produk.json`, catat di `docs/CHANGELOG.md`, commit.
3. Setiap order baru → buat task ClickUp di list **Order Aktif** dengan due date = tanggal habis.
4. Utamakan produk dengan skema resmi (family/duo/team plan, reseller resmi). Baca `docs/06-legal-risiko.md`
   sebelum menambah produk baru.
5. Pakai skill di `.claude/skills/` untuk tugas berulang.
