import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";
import { consultarAssinatura } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

// Webhook do Mercado Pago: avisa quando a assinatura muda (pagou, pausou, cancelou).
// Atualizamos o status do plano da conta de acordo.
export async function POST(req: NextRequest) {
  try {
    const url = req.nextUrl;
    let preapprovalId =
      url.searchParams.get("id") || url.searchParams.get("data.id") || "";
    const tipo = url.searchParams.get("type") || url.searchParams.get("topic") || "";

    let body: any = null;
    try {
      body = await req.json();
    } catch {
      /* algumas notificações vêm sem corpo */
    }
    if (!preapprovalId && body?.data?.id) preapprovalId = String(body.data.id);
    const tipoBody = body?.type || body?.topic || tipo;

    // só tratamos eventos de assinatura (preapproval)
    if (preapprovalId && /preapproval|subscription/i.test(String(tipoBody || "preapproval"))) {
      const info = await consultarAssinatura(preapprovalId);
      if (info && info.externalRef) {
        const orgId = info.externalRef;
        if (info.status === "authorized") {
          // pago/ativo — libera por ~33 dias (renova no próximo aviso)
          const ate = new Date(Date.now() + 33 * 864e5).toISOString();
          await q(
            "UPDATE orcafacil.profile SET assinatura_status = 'ativa', assinatura_ate = $1, mp_preapproval_id = $2 WHERE org_id = $3",
            [ate, preapprovalId, orgId]
          );
        } else if (info.status === "cancelled") {
          await q("UPDATE orcafacil.profile SET assinatura_status = 'cancelada' WHERE org_id = $1", [orgId]);
        } else if (info.status === "paused") {
          await q("UPDATE orcafacil.profile SET assinatura_status = 'atrasada' WHERE org_id = $1", [orgId]);
        }
        console.log(`[mp] assinatura ${preapprovalId} status=${info.status} org=${orgId}`);
      }
    }
  } catch (e) {
    console.error("Erro no webhook do Mercado Pago:", e);
  }
  return NextResponse.json({ ok: true });
}

// O MP às vezes valida a URL com GET.
export async function GET() {
  return NextResponse.json({ ok: true });
}
