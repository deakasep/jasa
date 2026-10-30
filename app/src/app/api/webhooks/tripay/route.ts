/**
 * Webhook Tripay. Urutan wajib: baca RAW body → verifikasi signature → simpan Payment idempoten → tulis jurnal ledger.
 * Pengolahan per jenis pesanan (escrow/patungan/jasa bayar) dilakukan berdasarkan prefix merchant_ref.
 */
import { jurnalBayarEscrow, jurnalTopupDompet } from "../../../../domain/ledger.ts";
import { prisma } from "../../../../server/db.ts";
import { keJson, simpanJurnal } from "../../../../server/ledgerRepo.ts";
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

  await prisma.$transaction(async (tx) => {
    const pay = await tx.payment.upsert({
      where: { gateway_externalId: { gateway: "tripay", externalId: data.reference } },
      create: { gateway: "tripay", externalId: data.reference, merchantRef: data.merchant_ref, nominal: data.total_amount, status, rawPayload: keJson(data), paidAt: status === "LUNAS" ? new Date() : null },
      update: { status, rawPayload: keJson(data), paidAt: status === "LUNAS" ? new Date() : undefined },
    });
    if (status !== "LUNAS") return;

    const ref = data.merchant_ref;
    if (ref.startsWith("MKT-")) {
      const order = await tx.order.findUnique({ where: { kode: ref } });
      if (!order || order.total !== pay.nominal) throw new Error(`nominal tidak cocok untuk ${ref}`);
      await simpanJurnal(jurnalBayarEscrow(order.id, order.total), tx);
      if (order.status === "MENUNGGU_BAYAR") await tx.order.update({ where: { id: order.id }, data: { status: "DIBAYAR", dibayarAt: new Date() } });
    } else if (ref.startsWith("TOP-")) {
      const userId = ref.split("-").slice(2).join("-");
      await simpanJurnal(jurnalTopupDompet(ref, userId, pay.nominal), tx);
    } else if (ref.startsWith("JSA-")) {
      const sub = await tx.subscription.findUnique({ where: { kode: ref } });
      if (!sub || sub.hargaSlot - sub.diskon + sub.feeJoiner !== pay.nominal) throw new Error(`nominal tidak cocok untuk ${ref}`);
      await simpanJurnal(jurnalBayarEscrow(sub.id, pay.nominal), tx);
      if (sub.status === "MENUNGGU_BAYAR") await tx.subscription.update({ where: { id: sub.id }, data: { status: "MENUNGGU_BATCH" } });
    } else if (ref.startsWith("JBY-")) {
      const jb = await tx.jasaBayarOrder.findUnique({ where: { kode: ref } });
      if (!jb || jb.total !== pay.nominal) throw new Error(`nominal tidak cocok untuk ${ref}`);
      await simpanJurnal(jurnalBayarEscrow(jb.id, pay.nominal), tx);
      if (jb.status === "MENUNGGU_BAYAR") await tx.jasaBayarOrder.update({ where: { id: jb.id }, data: { status: "DIBAYAR" } });
    }
  });

  return Response.json({ success: true });
}
