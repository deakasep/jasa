/**
 * Webhook Tripay. Urutan wajib: baca RAW body → verifikasi signature → simpan Payment idempoten → proses bersama (ledger + status).
 */
import { prisma } from "../../../../server/db.ts";
import { keJson, prosesPembayaranLunas } from "../../../../server/payments/proses.ts";
import { statusTripay, verifikasiTripay } from "../../../../server/payments/verify.ts";

export const runtime = "nodejs";

interface PayloadTripay {
  reference: string;
  merchant_ref: string;
  total_amount: number;
  status: string;
}

export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  const ok = verifikasiTripay(raw, req.headers.get("x-callback-signature"), process.env.TRIPAY_PRIVATE_KEY ?? "", req.headers.get("x-callback-event"));
  if (!ok) return Response.json({ success: false, error: "signature tidak valid" }, { status: 401 });

  const data = JSON.parse(raw) as PayloadTripay;
  const status = statusTripay(data.status);

  const hasil = await prisma.$transaction(async (tx) => {
    await tx.payment.upsert({
      where: { gateway_externalId: { gateway: "tripay", externalId: data.reference } },
      create: { gateway: "tripay", externalId: data.reference, merchantRef: data.merchant_ref, nominal: data.total_amount, status, rawPayload: keJson(data), paidAt: status === "LUNAS" ? new Date() : null },
      update: { status, rawPayload: keJson(data), paidAt: status === "LUNAS" ? new Date() : undefined },
    });
    if (status !== "LUNAS") return null;
    return prosesPembayaranLunas(tx, data.merchant_ref, data.total_amount, "tripay");
  });

  return Response.json({ success: true, hasil: hasil?.hasil ?? "TERCATAT" });
}
