/**
 * Filter chat anti-pindah platform (meniru joinbareng: chat menolak ajakan pindah ke WA/Telegram/transfer langsung).
 * Menyensor nomor HP, tautan WA/Telegram, nomor rekening, dan email; mengembalikan jenis pelanggaran untuk audit/sanksi.
 */
export type JenisPelanggaran = "nomor_hp" | "tautan_chat_luar" | "nomor_rekening" | "email" | "ajakan_transfer";

const POLA: { jenis: JenisPelanggaran; re: RegExp }[] = [
  { jenis: "tautan_chat_luar", re: /\b(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|t\.me|telegram\.me|line\.me)\/\S*/gi },
  { jenis: "email", re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
  { jenis: "nomor_hp", re: /(?:\+?62|\b0)8[\d\s.-]{7,14}\d/g },
  { jenis: "nomor_rekening", re: /\b(?:rek(?:ening)?|no\.?\s*rek|bca|bri|bni|mandiri|bsi|dana|ovo|gopay)\b[\s:.-]*\d[\d\s.-]{6,20}\d/gi },
  { jenis: "ajakan_transfer", re: /\b(?:transfer\s+langsung|tf\s+langsung|di\s*luar\s+(?:app|aplikasi|platform)|chat\s+(?:di\s+)?(?:wa|whatsapp|tele(?:gram)?)|pindah\s+ke\s+(?:wa|whatsapp|tele(?:gram)?))\b/gi },
];

export interface HasilSensor {
  teks: string;
  melanggar: boolean;
  jenis: JenisPelanggaran[];
}

export function sensorChat(teks: string): HasilSensor {
  let hasil = teks;
  const jenis = new Set<JenisPelanggaran>();
  for (const { jenis: j, re } of POLA) {
    hasil = hasil.replace(re, () => {
      jenis.add(j);
      return "[disensor]";
    });
  }
  return { teks: hasil, melanggar: jenis.size > 0, jenis: [...jenis] };
}

/** Sanksi bertingkat berdasarkan jumlah pelanggaran dalam 30 hari (docs/13-seller-kyc-payout.md). */
export function sanksiChat(jumlahPelanggaran30Hari: number): "peringatan" | "turunkan_listing" | "suspend_7_hari" | "ban" {
  if (jumlahPelanggaran30Hari <= 1) return "peringatan";
  if (jumlahPelanggaran30Hari === 2) return "turunkan_listing";
  if (jumlahPelanggaran30Hari <= 4) return "suspend_7_hari";
  return "ban";
}
