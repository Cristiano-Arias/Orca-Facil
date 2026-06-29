// Integração com o Mercado Pago (Assinaturas / "preapproval").
// Requer MERCADOPAGO_ACCESS_TOKEN no ambiente. Sem token, as funções
// devolvem null/erro de forma segura (nada quebra).
import { PLANOS, type PlanoKey } from "./billing";

const API = "https://api.mercadopago.com";

function token(): string | null {
  return process.env.MERCADOPAGO_ACCESS_TOKEN || null;
}

function baseUrl(): string {
  return (process.env.APP_URL || "https://orcachat.com.br").replace(/\/$/, "");
}

// Cria uma assinatura recorrente e devolve o link de checkout (init_point).
export async function criarAssinatura(
  plano: PlanoKey,
  payerEmail: string,
  externalRef: string
): Promise<{ initPoint: string; preapprovalId: string } | null> {
  const t = token();
  if (!t) return null;
  const p = PLANOS[plano];
  try {
    const resp = await fetch(`${API}/preapproval`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${t}` },
      body: JSON.stringify({
        reason: `OrçaChat ${p.nome}`,
        external_reference: externalRef,
        payer_email: payerEmail,
        back_url: `${baseUrl()}/assinatura?ok=1`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: p.preco,
          currency_id: "BRL",
        },
        status: "pending",
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) {
      console.error("MP criarAssinatura falhou:", resp.status, await resp.text().catch(() => ""));
      return null;
    }
    const data: any = await resp.json();
    const initPoint = data?.init_point || data?.sandbox_init_point;
    if (!initPoint || !data?.id) return null;
    return { initPoint, preapprovalId: String(data.id) };
  } catch (e) {
    console.error("Erro MP criarAssinatura:", e);
    return null;
  }
}

// Consulta uma assinatura (usado no webhook) para saber o status atual.
export async function consultarAssinatura(
  preapprovalId: string
): Promise<{ status: string; externalRef: string | null; nextPayment: string | null } | null> {
  const t = token();
  if (!t) return null;
  try {
    const resp = await fetch(`${API}/preapproval/${preapprovalId}`, {
      headers: { authorization: `Bearer ${t}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    const d: any = await resp.json();
    return {
      status: String(d?.status || ""), // authorized | paused | cancelled | pending
      externalRef: d?.external_reference ? String(d.external_reference) : null,
      nextPayment: d?.next_payment_date ? String(d.next_payment_date) : null,
    };
  } catch {
    return null;
  }
}
