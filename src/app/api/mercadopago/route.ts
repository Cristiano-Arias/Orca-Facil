import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";
import { consultarAssinatura, consultarPagamento } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

// Webhook do Mercado Pago. Trata dois tipos:
//  - assinatura (preapproval): cartão recorrente — libera/cancela conforme o status;
//  - pagamento (payment): PIX avulso de 1 mês — libera 30 dias a cada pagamento aprovado.
export async function POST(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const id = url.searchParams.get("id") || url.searchParams.get("data.id") || "";
    const tipoQuery = url.searchParams.get("type") || url.searchParams.get("topic") || "";

    let body: any = null;
    try {
      body = await req.json();
    } catch {
      /* algumas notificações vêm sem corpo */
    }
    const eventoId = id || (body?.data?.id ? String(body.data.id) : "");
    const tipo = String(body?.type || body?.topic || tipoQuery || "");

    // --- PAGAMENTO AVULSO (PIX) ---
    if (eventoId && /payment/i.test(tipo)) {
      const pg = await consultarPagamento(eventoId);
      if (pg && pg.externalRef && pg.status === "approved") {
        const orgId = pg.externalRef;
        // estende 31 dias a partir do que for maior: agora ou o vencimento atual
        const atual = await q<{ assinatura_ate: string | null }>(
          "SELECT assinatura_ate FROM orcafacil.profile WHERE org_id = $1",
          [orgId]
        );
        const ateAtual = atual[0]?.assinatura_ate ? new Date(atual[0].assinatura_ate).getTime() : 0;
        const baseTempo = Math.max(Date.now(), ateAtual);
        const ate = new Date(baseTempo + 31 * 864e5).toISOString();
        await q(
          `UPDATE orcafacil.profile
              SET assinatura_status = 'ativa', assinatura_ate = $1, trial_ate = NULL${pg.plano ? ", plano = $3" : ""}
            WHERE org_id = $2`,
          pg.plano ? [ate, orgId, pg.plano] : [ate, orgId]
        );
        console.log(`[mp] pix aprovado pagamento=${eventoId} org=${orgId} ate=${ate}`);
      }
      return NextResponse.json({ ok: true });
    }

    // --- ASSINATURA (cartão recorrente) ---
    if (eventoId && /preapproval|subscription/i.test(tipo || "preapproval")) {
      const info = await consultarAssinatura(eventoId);
      if (info && info.externalRef) {
        const orgId = info.externalRef;
        if (info.status === "authorized") {
          // pago/ativo — libera por ~33 dias (renova no próximo aviso)
          const ate = new Date(Date.now() + 33 * 864e5).toISOString();
          await q(
            "UPDATE orcafacil.profile SET assinatura_status = 'ativa', assinatura_ate = $1, mp_preapproval_id = $2 WHERE org_id = $3",
            [ate, eventoId, orgId]
          );
        } else if (info.status === "cancelled") {
          await q("UPDATE orcafacil.profile SET assinatura_status = 'cancelada' WHERE org_id = $1", [orgId]);
        } else if (info.status === "paused") {
          await q("UPDATE orcafacil.profile SET assinatura_status = 'atrasada' WHERE org_id = $1", [orgId]);
        }
        console.log(`[mp] assinatura ${eventoId} status=${info.status} org=${orgId}`);
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
