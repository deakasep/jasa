import { muatFeeConfig } from "../../../domain/config.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Pemeriksaan kesehatan untuk uptime monitor: config fee terbaca & valid. */
export async function GET(): Promise<Response> {
  try {
    muatFeeConfig();
    return Response.json({ ok: true, waktu: new Date().toISOString() });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
