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

// Cria um pagamento avulso (1 mês) via PIX usando o Checkout do Mercado Pago.
// Não é recorrente: ao pagar, liberamos 30 dias; depois a pessoa paga de novo.
export async function criarPagamentoPix(
  plano: PlanoKey,
  payerEmail: string,
  externalRef: string
): Promise<{ initPoint: string; prefId: string } | null> {
  const t = token();
  if (!t) return null;
  const planos = await getPlanos();
  const p = planos[plano];
  const base = baseUrl();
  try {
    const resp = await fetch(`${API}/checkout/preferences`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${t}` },
      body: JSON.stringify({
        items: [
          {
            title: `OrçaChat ${p.nome} — 1 mês`,
            quantity: 1,
            unit_price: p.preco,
            currency_id: "BRL",
          },
        ],
        payer: { email: payerEmail },
        external_reference: externalRef,
        metadata: { tipo: "pix_mensal", plano, org: externalRef },
        back_urls: {
          // PIX costuma voltar como "processando": quem confirma o acesso é o webhook.
          success: `${base}/assinatura?ok=pixproc`,
          pending: `${base}/assinatura?ok=pixproc`,
          failure: `${base}/assinatura?erro=pix`,
        },
        notification_url: `${base}/api/mercadopago`,
        // só PIX (tira cartão/boleto para virar um botão "PIX")
        payment_methods: {
          excluded_payment_types: [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }],
          installments: 1,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) {
      console.error("MP criarPagamentoPix falhou:", resp.status, await resp.text().catch(() => ""));
      return null;
    }
    const data: any = await resp.json();
    const initPoint = data?.init_point || data?.sandbox_init_point;
    if (!initPoint || !data?.id) return null;
    return { initPoint, prefId: String(data.id) };
  } catch (e) {
    console.error("Erro MP criarPagamentoPix:", e);
    return null;
  }
}

// Consulta um pagamento avulso (usado no webhook de "Pagamentos").
export async function consultarPagamento(
  paymentId: string
): Promise<{ status: string; externalRef: string | null; plano: string | null } | null> {
  const t = token();
  if (!t) return null;
  try {
    const resp = await fetch(`${API}/v1/payments/${paymentId}`, {
      headers: { authorization: `Bearer ${t}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    const d: any = await resp.json();
    return {
      status: String(d?.status || ""), // approved | pending | rejected | ...
      externalRef: d?.external_reference ? String(d.external_reference) : null,
      plano: d?.metadata?.plano ? String(d.metadata.plano) : null,
    };
  } catch {
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
