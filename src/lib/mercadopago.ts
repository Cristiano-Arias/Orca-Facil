// Integração com o Mercado Pago (Assinaturas / "preapproval").
// Requer MERCADOPAGO_ACCESS_TOKEN no ambiente. Sem token, as funções
// devolvem null/erro de forma segura (nada quebra).
import { getPlanos, TRIAL_DIAS, type PlanoKey } from "./billing";

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
  externalRef: string,
  comTeste = false
): Promise<{ initPoint: string; preapprovalId: string } | null> {
  const t = token();
  if (!t) return null;
  const planos = await getPlanos();
  const p = planos[plano];
  try {
    const auto_recurring: Record<string, unknown> = {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: p.preco,
      currency_id: "BRL",
    };
    // teste grátis: cadastra o cartão agora, primeira cobrança só após N dias
    if (comTeste) {
      auto_recurring.free_trial = { frequency: TRIAL_DIAS, frequency_type: "days" };
    }
    const resp = await fetch(`${API}/preapproval`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${t}` },
      body: JSON.stringify({
        reason: comTeste ? `OrçaChat ${p.nome} (teste grátis)` : `OrçaChat ${p.nome}`,
        external_reference: externalRef,
        payer_email: payerEmail,
        back_url: `${baseUrl()}/assinatura?ok=1`,
        auto_recurring,
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
