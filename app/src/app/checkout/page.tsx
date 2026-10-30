// Checkout minimal patungan — tanpa gateway nyata (tampilan final dibuat terakhir, keputusan pemilik).
import { daftarPaket, ringkasCheckout, type RingkasanCheckout } from "../../domain/checkoutPatungan.ts";
import { muatFeeConfig } from "../../domain/config.ts";
import { formatRp } from "../../domain/money.ts";
import { muatKatalog } from "../../server/katalogFile.ts";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

const sel = { padding: "6px 10px", borderBottom: "1px solid #eee", textAlign: "left" as const };

export default async function Checkout({ searchParams }: { searchParams: Params }) {
  const q = await searchParams;
  const kode = typeof q.paket === "string" ? q.paket : "";
  const katalog = muatKatalog();
  const cfg = muatFeeConfig();
  const pilihan = daftarPaket(katalog);

  let ringkas: RingkasanCheckout | null = null;
  let galat = "";
  if (kode) {
    try {
      ringkas = ringkasCheckout(katalog, kode, cfg);
    } catch (e) {
      galat = (e as Error).message;
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "32px auto", padding: "0 16px", lineHeight: 1.6 }}>
      <h1>Checkout patungan</h1>
      <p style={{ background: "#fff7e0", padding: "8px 12px", borderRadius: 6 }}>
        Mode contoh: gateway pembayaran belum disambungkan, tidak ada tagihan yang dibuat.
      </p>

      <form method="get" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }}>
        <label htmlFor="paket">Paket</label>
        <select id="paket" name="paket" defaultValue={ringkas?.kodePaket ?? kode}>
          <option value="">— pilih —</option>
          {pilihan.map((p) => (
            <option key={p.kode} value={p.kode} disabled={p.slotTersedia < 1}>
              {p.layanan} · {p.kode} · {formatRp(p.hargaSlot)}/{p.periode === "bulanan" ? "bln" : "thn"}
            </option>
          ))}
        </select>
        <button type="submit">Lihat ringkasan</button>
      </form>

      {galat && <p role="alert" style={{ color: "#b00020" }}>{galat}</p>}

      {ringkas && (
        <section>
          <h2>{ringkas.layanan} — {ringkas.kodePaket}</h2>
          <p>
            {ringkas.akses}. {ringkas.aksesLangsung ? "Akses dikirim segera setelah bayar." : "Akses dikirim saat batch penuh (maks 7 hari; tidak penuh → pindah batch / tunggu / refund 100%)."}
          </p>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              <tr><th style={sel}>Harga slot ({ringkas.periode})</th><td style={sel}>{formatRp(ringkas.tagihan.hargaSlot)}</td></tr>
              {ringkas.tagihan.diskon > 0 && <tr><th style={sel}>Diskon</th><td style={sel}>−{formatRp(ringkas.tagihan.diskon)}</td></tr>}
              <tr><th style={sel}>Biaya layanan</th><td style={sel}>{formatRp(ringkas.tagihan.fee)}</td></tr>
              <tr><th style={sel}>Total</th><td style={{ ...sel, fontWeight: 700 }}>{formatRp(ringkas.tagihan.total)}</td></tr>
            </tbody>
          </table>
          <h3>Aturan</h3>
          <ul>{ringkas.aturan.map((a) => <li key={a}>{a}</li>)}</ul>
          <button type="button" disabled title="Gateway belum disambungkan">Bayar (QRIS / VA) — belum aktif</button>
        </section>
      )}
    </main>
  );
}
