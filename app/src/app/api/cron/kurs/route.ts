/**
 * GET /api/cron/kurs — dipanggil terjadwal tiap jasa_bayar.kurs.refresh_menit (Authorization: Bearer <CRON_SECRET>).
 * Ambil kurs dari sumber publik, pilih lewat domain/kurs.ts, simpan ke tabel Kurs. Lonjakan ditahan & dicatat.
 */
import { muatFeeConfig } from "../../../../domain/config.ts";
import { pilihKurs } from "../../../../domain/kurs.ts";
import { prisma } from "../../../../server/db.ts";
import { izinCron, kursTerakhir } from "../../../../server/hargaRepo.ts";
import { ambilKandidatKurs } from "../../../../server/kurs.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  if (!izinCron(req)) return Response.json({ error: "tidak diizinkan" }, { status: 401 });
  const cfg = muatFeeConfig();
  const now = new Date();
  const [{ kandidat, error }, terakhir] = await Promise.all([ambilKandidatKurs(), kursTerakhir()]);
  const hasil = pilihKurs(kandidat, terakhir, now, cfg);
  const peringatan = [...error, ...hasil.peringatan];
  if (hasil.status === "baru" || hasil.status === "pakai_terakhir") {
    const ditahan = hasil.status === "pakai_terakhir" && kandidat.length > 0;
    await prisma.kurs.create({
      data: { nilai: hasil.kurs.nilai, sumber: hasil.kurs.sumber, waktuData: hasil.kurs.waktu, status: ditahan ? "ditahan" : hasil.status, peringatan },
    });
  }
  return Response.json({ waktu: now.toISOString(), status: hasil.status, kurs: "kurs" in hasil ? hasil.kurs : null, kandidat, peringatan });
}
