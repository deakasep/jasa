/** Webhook Xendit (invoice). Verifikasi x-callback-token → simpan Payment idempoten → proses bersama (ledger + status). */
import { prisma } from "../../../../server/db.ts";
import { keJson, prosesPembayaranLunas } from "../../../../server/payments/proses.ts";
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
  const nominal = Math.round(data.paid_amount ?? data.amount ?? 0);

  const hasil = await prisma.$transaction(async (tx) => {
    await tx.payment.upsert({
      where: { gateway_externalId: { gateway: "xendit", externalId: data.id } },
      create: { gateway: "xendit", externalId: data.id, merchantRef: data.external_id, nominal, status, rawPayload: keJson(data), paidAt: status === "LUNAS" ? new Date() : null },
      update: { status, rawPayload: keJson(data), paidAt: status === "LUNAS" ? new Date() : undefined },
    });
    if (status !== "LUNAS") return null;
    return prosesPembayaranLunas(tx, data.external_id, nominal, "xendit");
  });

  return Response.json({ ok: true, hasil: hasil?.hasil ?? "TERCATAT" });
}
