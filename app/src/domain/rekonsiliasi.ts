/**
 * Rekonsiliasi harian payment gateway (Xendit/Tripay) ↔ ledger (akun kas:gateway). Murni, tanpa I/O.
 * Mengikuti skill `.claude/skills/reconciliation`: cocokkan per transaksi, kelompokkan item selisih,
 * pisahkan beda waktu (wajar, hilang sendiri besok) dari selisih yang perlu tindakan.
 *
 * Input:
 *   - baris laporan settlement gateway untuk satu tanggal (diunduh dari dashboard/API gateway oleh lapisan server);
 *   - mutasi kas:gateway dari ledger (helper `mutasiKasGateway` mengambilnya dari jurnal).
 * Output: daftar item per kategori, ringkasan, status BERES/PERLU_TINJAU, dan usulan jurnal biaya gateway.
 * Rekonsiliasi tidak pernah mengubah ledger sendiri: jurnal usulan dicatat lewat ledger setelah disetujui peran `finance`.
 */
import { buatJurnal, type Jurnal } from "./ledger.ts";
import { pastikanRupiah, type Rupiah } from "./money.ts";

export type Gateway = "xendit" | "tripay";

export interface BarisGateway {
  gateway: Gateway;
  /** Kode pesanan yang kita kirim ke gateway (merchant_ref / external_id), mis. "JSA-261031-01" atau ref payout. */
  kode: string;
  /** Id transaksi di sisi gateway (untuk jejak audit). */
  idGateway: string;
  arah: "MASUK" | "KELUAR";
  /** Nominal bruto yang dibayar pembeli / dikirim ke rekening (tanpa biaya gateway). */
  bruto: Rupiah;
  /** Biaya yang dipotong gateway (MDR/biaya transfer). */
  biaya: Rupiah;
  waktu: Date;
}

export interface MutasiLedger {
  /** Ref jurnal ledger, mis. "bayar:clx123" atau "payout:P1". */
  ref: string;
  /** Kode yang sama dengan sisi gateway (dipetakan lapisan server dari id pesanan). */
  kode: string;
  /** Positif = kas:gateway bertambah (uang masuk), negatif = keluar. */
  nominal: number;
  waktu: Date;
}

export type Kategori =
  | "COCOK"
  | "BEDA_WAKTU" // ada di satu sisi saja tapi dekat batas hari → wajar, cek lagi besok
  | "HANYA_GATEWAY" // uang masuk/keluar di gateway tapi tidak ada jurnal (webhook hilang?)
  | "HANYA_LEDGER" // jurnal ada tapi gateway tidak mencatat (jurnal salah / pembayaran palsu?)
  | "NOMINAL_BEDA"
  | "DUPLIKAT"; // kode yang sama muncul lebih dari sekali di satu sisi

export interface ItemRekon {
  kategori: Kategori;
  kode: string;
  gateway?: BarisGateway[];
  ledger?: MutasiLedger[];
  /** Nominal gateway (bertanda) − nominal ledger. 0 untuk COCOK. */
  selisih: number;
  catatan: string;
}

export interface OpsiRekon {
  /** Tanggal yang direkonsiliasi, YYYY-MM-DD (untuk ref jurnal usulan). */
  tanggal: string;
  /** Akhir periode (eksklusif). Item yang hanya ada di satu sisi dan terjadi sedekat ini dengan batas = BEDA_WAKTU. */
  batas: Date;
  toleransiWaktuMenit?: number;
  /** Biaya gateway yang sudah dijurnal untuk tanggal ini (supaya usulan tidak dobel). */
  biayaSudahDijurnal?: Partial<Record<Gateway, Rupiah>>;
}

export interface HasilRekon {
  tanggal: string;
  status: "BERES" | "PERLU_TINJAU";
  item: ItemRekon[];
  ringkasan: {
    jumlahPerKategori: Record<Kategori, number>;
    totalGatewayBersih: number; // masuk − keluar (bruto)
    totalLedger: number;
    selisih: number;
    /** Selisih yang belum terjelaskan oleh BEDA_WAKTU. Harus 0 agar BERES. */
    selisihTakTerjelaskan: number;
    biayaGateway: Record<Gateway, Rupiah>;
  };
  /** Jurnal biaya gateway yang belum tercatat: D biaya:gateway / K kas:gateway. */
  usulanJurnal: Jurnal[];
}

const MENIT = 60_000;

function nominalGateway(b: BarisGateway): number {
  return b.arah === "MASUK" ? b.bruto : -b.bruto;
}

function kelompok<T extends { kode: string }>(xs: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of xs) m.set(x.kode, [...(m.get(x.kode) ?? []), x]);
  return m;
}

/**
 * Ambil mutasi kas:gateway per jurnal. `kodeUntukRef` memetakan ref jurnal → kode gateway
 * (default: bagian setelah awalan, "topup:TOP-261031-u1" → "TOP-261031-u1"). Jurnal tanpa kas:gateway dilewati.
 */
export function mutasiKasGateway(
  jurnal: { j: Jurnal; waktu: Date }[],
  kodeUntukRef: (ref: string) => string = (ref) => ref.slice(ref.indexOf(":") + 1),
): MutasiLedger[] {
  const hasil: MutasiLedger[] = [];
  for (const { j, waktu } of jurnal) {
    let n = 0;
    let ada = false;
    for (const b of j.baris) {
      if (b.akun !== "kas:gateway") continue;
      ada = true;
      n += b.debit - b.kredit;
    }
    if (ada && n !== 0) hasil.push({ ref: j.ref, kode: kodeUntukRef(j.ref), nominal: n, waktu });
  }
  return hasil;
}

export function rekonsiliasiHarian(gateway: BarisGateway[], ledger: MutasiLedger[], opsi: OpsiRekon): HasilRekon {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(opsi.tanggal)) throw new Error(`tanggal harus YYYY-MM-DD, dapat ${opsi.tanggal}`);
  for (const b of gateway) {
    if (!b.kode) throw new Error(`baris gateway ${b.idGateway} tanpa kode`);
    pastikanRupiah(b.bruto, `bruto ${b.kode}`);
    pastikanRupiah(b.biaya, `biaya ${b.kode}`);
  }
  for (const m of ledger) {
    if (!Number.isInteger(m.nominal)) throw new Error(`nominal ledger ${m.ref} harus bilangan bulat Rupiah`);
  }

  const toleransi = (opsi.toleransiWaktuMenit ?? 60) * MENIT;
  const dekatBatas = (w: Date) => opsi.batas.getTime() - w.getTime() <= toleransi;

  const gw = kelompok(gateway);
  const lg = kelompok(ledger);
  const semuaKode = [...new Set([...gw.keys(), ...lg.keys()])].sort();
  const item: ItemRekon[] = [];

  for (const kode of semuaKode) {
    const g = gw.get(kode) ?? [];
    const l = lg.get(kode) ?? [];
    const nG = g.reduce((s, b) => s + nominalGateway(b), 0);
    const nL = l.reduce((s, m) => s + m.nominal, 0);
    const selisih = nG - nL;
    const dasar = { kode, gateway: g.length ? g : undefined, ledger: l.length ? l : undefined, selisih };

    if (g.length > 1 || l.length > 1) {
      // Satu kode, beberapa transaksi: bisa pembayaran ganda pembeli atau jurnal ganda. Selalu ditinjau manusia.
      item.push({ ...dasar, kategori: "DUPLIKAT", catatan: `${g.length} baris gateway, ${l.length} jurnal untuk ${kode}` });
    } else if (g.length && l.length) {
      item.push(
        selisih === 0
          ? { ...dasar, kategori: "COCOK", catatan: "" }
          : { ...dasar, kategori: "NOMINAL_BEDA", catatan: `gateway ${nG}, ledger ${nL}` },
      );
    } else if (g.length) {
      item.push(
        dekatBatas(g[0].waktu)
          ? { ...dasar, kategori: "BEDA_WAKTU", catatan: "tercatat di gateway dekat batas hari; jurnal diharapkan masuk besok" }
          : { ...dasar, kategori: "HANYA_GATEWAY", catatan: "uang bergerak di gateway tanpa jurnal — cek webhook & proses manual" },
      );
    } else {
      item.push(
        dekatBatas(l[0].waktu)
          ? { ...dasar, kategori: "BEDA_WAKTU", catatan: "jurnal dekat batas hari; diharapkan muncul di settlement besok" }
          : { ...dasar, kategori: "HANYA_LEDGER", catatan: "jurnal tanpa transaksi gateway — cek jurnal & bukti bayar" },
      );
    }
  }

  const jumlahPerKategori = { COCOK: 0, BEDA_WAKTU: 0, HANYA_GATEWAY: 0, HANYA_LEDGER: 0, NOMINAL_BEDA: 0, DUPLIKAT: 0 } as Record<Kategori, number>;
  for (const i of item) jumlahPerKategori[i.kategori]++;

  const totalGatewayBersih = gateway.reduce((s, b) => s + nominalGateway(b), 0);
  const totalLedger = ledger.reduce((s, m) => s + m.nominal, 0);
  const selisih = totalGatewayBersih - totalLedger;
  const terjelaskan = item.filter((i) => i.kategori === "BEDA_WAKTU").reduce((s, i) => s + i.selisih, 0);
  const selisihTakTerjelaskan = selisih - terjelaskan;

  const biayaGateway: Record<Gateway, Rupiah> = { xendit: 0, tripay: 0 };
  for (const b of gateway) biayaGateway[b.gateway] += b.biaya;

  const usulanJurnal: Jurnal[] = [];
  for (const gwNama of ["xendit", "tripay"] as Gateway[]) {
    const sisa = biayaGateway[gwNama] - (opsi.biayaSudahDijurnal?.[gwNama] ?? 0);
    if (sisa < 0) throw new Error(`biaya ${gwNama} yang sudah dijurnal melebihi laporan gateway (${-sisa})`);
    if (sisa > 0) {
      usulanJurnal.push(
        buatJurnal(`biaya_gateway:${gwNama}:${opsi.tanggal}`, `Biaya ${gwNama} ${opsi.tanggal} (rekonsiliasi)`, [
          { akun: "biaya:gateway", debit: sisa, kredit: 0 },
          { akun: "kas:gateway", debit: 0, kredit: sisa },
        ]),
      );
    }
  }

  const perluTinjau =
    selisihTakTerjelaskan !== 0 ||
    jumlahPerKategori.HANYA_GATEWAY + jumlahPerKategori.HANYA_LEDGER + jumlahPerKategori.NOMINAL_BEDA + jumlahPerKategori.DUPLIKAT > 0;

  return {
    tanggal: opsi.tanggal,
    status: perluTinjau ? "PERLU_TINJAU" : "BERES",
    item,
    ringkasan: { jumlahPerKategori, totalGatewayBersih, totalLedger, selisih, selisihTakTerjelaskan, biayaGateway },
    usulanJurnal,
  };
}
