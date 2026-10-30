// Dashboard admin dengan DATA CONTOH. Belum ada login: di production hanya tampil bila ADMIN_CONTOH=1.
// Peran dipilih lewat ?peran= untuk mencoba RBAC; versi nyata mengambil peran dari sesi + data dari database.
import { notFound } from "next/navigation";
import { LABEL_AKSI_CRON, susunDashboard } from "../../domain/adminDashboard.ts";
import { muatFeeConfig } from "../../domain/config.ts";
import { dataContohAdmin } from "../../domain/contohAdmin.ts";
import { formatRp } from "../../domain/money.ts";
import type { Peran } from "../../domain/rbac.ts";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

const PERAN_STAF: Peran[] = ["owner", "admin_ops", "finance", "cs", "kyc_reviewer"];
const sel = { padding: "6px 8px", borderBottom: "1px solid #eee", textAlign: "left" as const, verticalAlign: "top" as const };

export default async function Admin({ searchParams }: { searchParams: Params }) {
  if (process.env.NODE_ENV === "production" && process.env.ADMIN_CONTOH !== "1") notFound();
  const q = await searchParams;
  const peran: Peran = PERAN_STAF.find((p) => p === q.peran) ?? "owner";
  const now = new Date();
  const d = susunDashboard(dataContohAdmin(now), [peran], now, muatFeeConfig());

  return (
    <main style={{ maxWidth: 960, margin: "32px auto", padding: "0 16px", lineHeight: 1.5 }}>
      <h1>Dashboard admin</h1>
      <p style={{ background: "#fff7e0", padding: "8px 12px", borderRadius: 6 }}>
        Data contoh (fiktif). Aksi cron masih mode rencana — tidak ada yang dijalankan atau dikirim.
      </p>

      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
        Lihat sebagai:
        {PERAN_STAF.map((p) => (
          <a key={p} href={`?peran=${p}`} style={{ fontWeight: p === peran ? 700 : 400 }}>{p}</a>
        ))}
      </nav>

      <ul>
        {d.bagian.includes("antrian_cron") && <li>Aksi cron menunggu: {d.ringkasan.aksiCron}</li>}
        {d.bagian.includes("batch") && <li>Batch buka: {d.ringkasan.batchBuka} (perlu ditawari pindah: {d.ringkasan.batchPerluTawaran})</li>}
        {d.bagian.includes("refund") && <li>Refund menunggu: {d.ringkasan.refundMenunggu} · {formatRp(d.ringkasan.nominalRefund)}</li>}
      </ul>
      {d.bagian.length === 0 && <p>Peran <b>{peran}</b> tidak punya akses ke bagian dashboard ini.</p>}

      {d.bagian.includes("antrian_cron") && (
        <section>
          <h2>Antrian aksi cron</h2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead><tr><th style={sel}>ID</th><th style={sel}>Aksi</th></tr></thead>
            <tbody>
              {d.antrianCron.map((a) => (
                <tr key={`${a.jenis}-${a.id}`}><td style={sel}><code>{a.id}</code></td><td style={sel}>{a.label}</td></tr>
              ))}
            </tbody>
          </table>
          <details><summary>Arti tiap aksi</summary><ul>{Object.entries(LABEL_AKSI_CRON).map(([k, v]) => <li key={k}><code>{k}</code>: {v}</li>)}</ul></details>
        </section>
      )}

      {d.bagian.includes("batch") && (
        <section>
          <h2>Batch patungan</h2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead><tr><th style={sel}>Batch</th><th style={sel}>Layanan</th><th style={sel}>Terisi</th><th style={sel}>Umur</th><th style={sel}>Status</th><th style={sel}>Tindakan</th></tr></thead>
            <tbody>
              {d.batch.map((b) => (
                <tr key={b.id}>
                  <td style={sel}><code>{b.id}</code></td>
                  <td style={sel}>{b.layanan}</td>
                  <td style={sel}>{b.terisi}/{b.kapasitas}</td>
                  <td style={sel}>{b.umurHari} hari</td>
                  <td style={sel}>{b.status}</td>
                  <td style={sel}>{b.perluTawaran ? "Tawarkan pindah / tunggu / refund 100%" : b.aksesBolehDikirim ? "Akses boleh dikirim" : `Tunggu ${b.sisa} slot lagi`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {d.bagian.includes("refund") && (
        <section>
          <h2>Pengajuan refund</h2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead><tr><th style={sel}>Kode</th><th style={sel}>Pesanan</th><th style={sel}>Nominal</th><th style={sel}>Alasan</th><th style={sel}>Diajukan</th><th style={sel}>Status untuk peran ini</th></tr></thead>
            <tbody>
              {d.refund.map((r) => (
                <tr key={r.kode}>
                  <td style={sel}><code>{r.kode}</code></td>
                  <td style={sel}><code>{r.kodePesanan}</code></td>
                  <td style={sel}>{formatRp(r.nominal)}</td>
                  <td style={sel}>{r.alasan}</td>
                  <td style={sel}>{r.pengajuId}</td>
                  <td style={sel}>
                    {r.catatan}{" "}
                    <button type="button" disabled title="Mode contoh">Setujui</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
