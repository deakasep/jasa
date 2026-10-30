/** Webhook Xendit (invoice). Verifikasi x-callback-token, simpan Payment idempoten; pengolahan pesanan sama dengan Tripay. */
import { prisma } from "../../../../server/db.ts";
import { keJson } from "../../../../server/ledgerRepo.ts";
import { statusXendit, verifikasiXendit } from "../../../../server/payments/verify.ts";

export const runtime = "nodejs";

interface PayloadXendit {
  id: string;
  external_id: string;
  status: string;
  paid_amount?: number;
  amount?: number;
}

export async function POST(req: Request): Promise<Response> {
  if (!verifikasiXendit(req.headers.get("x-callback-token"), process.env.XENDIT_CALLBACK_TOKEN ?? "")) {
    return Response.json({ error: "token tidak valid" }, { status: 401 });
  }
  const data = (await req.json()) as PayloadXendit;
  const status = statusXendit(data.status);
  await prisma.payment.upsert({
    where: { gateway_externalId: { gateway: "xendit", externalId: data.id } },
    create: { gateway: "xendit", externalId: data.id, merchantRef: data.external_id, nominal: Math.round(data.paid_amount ?? data.amount ?? 0), status, rawPayload: keJson(data), paidAt: status === "LUNAS" ? new Date() : null },
    update: { status, rawPayload: keJson(data) },
  });
  // TODO Tahap 1: panggil pengolah pesanan bersama (lihat webhooks/tripay) setelah gateway utama dipilih.
  return Response.json({ ok: true });
}
