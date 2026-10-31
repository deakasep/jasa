/**
 * Notifikasi WA/email untuk aksi otomatis (cron). Murni: menyusun isi pesan dari template, tanpa kirim apa pun.
 *
 * Privasi: notifikasi hanya memuat `userId` — nomor HP/email TIDAK pernah ikut disimpan di sini, di audit, atau di
 * kotak keluar. Penyedia WA API/email nyata (belum dipilih pemilik) yang nanti mencari kontak saat benar-benar mengirim.
 *
 * Mode: `uji` (default) = pesan hanya dicatat di kotak keluar + audit, tidak ada yang keluar ke pihak luar.
 * `kirim` sengaja belum bisa dipakai sampai penyedia WA/email dipilih (task ClickUp `butuh-pemilik`).
 * Teks ditulis ulang dari templates/pesan-whatsapp.md.
 */
export type Kanal = "wa" | "email";
export type ModeNotif = "uji" | "kirim";

export const TEMPLATE = {
  "pembeli-boleh-batal":
    "Halo kak, pesanan {KODE} ({PRODUK}) belum dikirim penjual sesuai batas waktu 🙏 Kakak boleh batalkan sekarang dan dana kembali 100% ke dompet, atau tetap tunggu.",
  "pesanan-kadaluarsa": "Halo kak, pesanan {KODE} ({PRODUK}) dibatalkan otomatis karena belum dibayar sampai batas waktu. Kalau masih mau, silakan pesan ulang ya kak.",
  "pesanan-selesai-pembeli": "Pesanan {KODE} ({PRODUK}) selesai otomatis karena masa cek sudah habis ✅ Terima kasih kak, jangan lupa kasih ulasan ya.",
  "pesanan-selesai-penjual": "Pesanan {KODE} ({PRODUK}) selesai ✅ Dana {NOMINAL} sudah masuk ke saldo penjualan kakak.",
  "permintaan-kadaluarsa": "Halo kak, permintaan gabung {PRODUK} kadaluarsa karena host belum merespons. Kakak bisa coba grup lain atau batch resmi kami ya.",
  "permintaan-kadaluarsa-host": "Halo kak, permintaan gabung ke grup {PRODUK} kadaluarsa karena belum dijawab. Mohon cek permintaan baru lebih cepat ya kak 🙏",
  "reminder-h3": "Halo kak 😊 Slot {PRODUK} ({KODE}) habis {TANGGAL_HABIS}. Perpanjang sekarang biar slotnya tetap aman ya kak.",
  "slot-dilepas": "Halo kak, karena belum ada perpanjangan, slot {PRODUK} ({KODE}) sudah kami lepas. Kalau mau gabung lagi tinggal chat ya kak 🙏",
  "batch-7-hari": "Halo kak, batch {PRODUK} belum penuh setelah 7 hari 🙏 Kakak mau pindah ke batch lain, tetap tunggu, atau refund 100%?",
} as const;

export type NamaTemplate = keyof typeof TEMPLATE;

export interface Notifikasi {
  /** Kunci idempoten: notifikasi dengan kunci sama tidak dikirim dua kali. */
  kunci: string;
  userId: string;
  kanal: Kanal;
  template: NamaTemplate;
  isi: string;
}

/** Isi placeholder {NAMA}; placeholder yang tidak diisi = error (jangan sampai pesan bolong terkirim). */
export function isiTemplate(nama: NamaTemplate, vars: Record<string, string>): string {
  const isi = TEMPLATE[nama].replace(/\{([A-Z_]+)\}/g, (_, k: string) => {
    const v = vars[k];
    if (v === undefined || v === "") throw new Error(`template ${nama}: {${k}} belum diisi`);
    return v;
  });
  return isi;
}

/** Satu pesan ke satu pengguna → dua notifikasi (WA + email), kunci berbeda per kanal. */
export function buatNotifikasi(kunciDasar: string, userId: string, nama: NamaTemplate, vars: Record<string, string>): Notifikasi[] {
  if (!userId) throw new Error("notifikasi wajib punya userId");
  const isi = isiTemplate(nama, vars);
  return (["wa", "email"] as const).map((kanal) => ({ kunci: `${kunciDasar}:${userId}:${kanal}`, userId, kanal, template: nama, isi }));
}

/** Mode dari env NOTIF_MODE. Selain "kirim" → "uji" (aman secara default). */
export function modeNotif(nilai: string | undefined): ModeNotif {
  return nilai === "kirim" ? "kirim" : "uji";
}

export interface Pengirim {
  readonly mode: ModeNotif;
  kirim(n: Notifikasi): Promise<void>;
}

/** Mode uji: hanya menampung di memori (kotak keluar), tidak ada jaringan. */
export class PengirimUji implements Pengirim {
  readonly mode = "uji" as const;
  readonly kotakKeluar: Notifikasi[] = [];
  async kirim(n: Notifikasi): Promise<void> {
    this.kotakKeluar.push(n);
  }
}

export function pilihPengirim(mode: ModeNotif): Pengirim {
  if (mode === "kirim") throw new Error("NOTIF_MODE=kirim belum didukung: penyedia WA API/email belum dipilih pemilik");
  return new PengirimUji();
}

/** Tanggal lokal bisnis (WITA, UTC+8) format DD/MM/YYYY untuk isi pesan. */
export function tanggalPesan(d: Date, offsetMenit = 8 * 60): string {
  const x = new Date(d.getTime() + offsetMenit * 60_000);
  return `${String(x.getUTCDate()).padStart(2, "0")}/${String(x.getUTCMonth() + 1).padStart(2, "0")}/${x.getUTCFullYear()}`;
}

/** Rp1.234.567 tanpa bergantung pada data locale (ICU) server. */
export function rupiahPesan(n: number): string {
  return "Rp" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
