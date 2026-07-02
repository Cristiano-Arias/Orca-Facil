"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth";
import { q } from "@/lib/db";
import { cobrancaAtiva, getPlanos, PLANO_KEYS, PLANO_TESTE, TRIAL_DIAS, type PlanoKey } from "@/lib/billing";
import { criarAssinatura, criarPagamentoPix } from "@/lib/mercadopago";
import { ehDono } from "@/lib/owner";

// Inicia a assinatura de um plano (ou o teste grátis): cria a cobrança no
// Mercado Pago e redireciona para o checkout. Seguro quando a cobrança está desligada.
export async function assinar(formData: FormData): Promise<void> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  const comTeste = String(formData.get("teste") || "") === "1";
  // no teste grátis, o plano é sempre o de entrada
  const plano = comTeste ? PLANO_TESTE : (String(formData.get("plano") || "") as PlanoKey);
  const planos = await getPlanos();
  if (!planos[plano]) redirect("/assinatura?erro=plano");

  if (!cobrancaAtiva()) redirect("/assinatura?erro=desligada");

  const init = await criarAssinatura(plano, sessao!.email, sessao!.orgId, comTeste);
  if (!init) redirect("/assinatura?erro=indisponivel");

  // guarda o plano e o id da assinatura (status real vem pelo webhook ao autorizar/pagar).
  // no teste grátis, marca quando o período sem cobrança termina.
  const trialAte = comTeste ? new Date(Date.now() + TRIAL_DIAS * 864e5).toISOString() : null;
  await q(
    "UPDATE orcafacil.profile SET plano = $1, mp_preapproval_id = $2, trial_ate = $3 WHERE org_id = $4",
    [plano, init.preapprovalId, trialAte, sessao!.orgId]
  );
  redirect(init.initPoint); // vai para o checkout do Mercado Pago (cadastra o cartão)
}

// Teste grátis SEM cartão: libera 7 dias na hora (até TRIAL_COTA orçamentos).
// Ao fim, a conta expira e a pessoa escolhe um plano — nada é cobrado.
export async function comecarTeste(): Promise<void> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  // sem cobrança ligada, tudo já é livre
  if (!cobrancaAtiva()) redirect("/painel");

  // não reinicia um teste/assinatura que já está ativo
  const atual = await q<{ assinatura_status: string | null; assinatura_ate: string | null }>(
    "SELECT assinatura_status, assinatura_ate FROM orcafacil.profile WHERE org_id = $1",
    [sessao!.orgId]
  );
  const ativo =
    atual[0]?.assinatura_status === "ativa" &&
    atual[0]?.assinatura_ate &&
    new Date(atual[0].assinatura_ate).getTime() > Date.now();
  if (ativo) redirect("/painel");

  const ate = new Date(Date.now() + TRIAL_DIAS * 864e5).toISOString();
  await q(
    "UPDATE orcafacil.profile SET assinatura_status = 'ativa', assinatura_ate = $1, trial_ate = $1, plano = $2 WHERE org_id = $3",
    [ate, PLANO_TESTE, sessao!.orgId]
  );
  redirect("/painel?ok=teste");
}

// Pagamento avulso de 1 mês via PIX (sem cartão, sem renovação automática).
export async function pagarPix(formData: FormData): Promise<void> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  const plano = String(formData.get("plano") || "") as PlanoKey;
  const planos = await getPlanos();
  if (!planos[plano]) redirect("/assinatura?erro=plano");

  if (!cobrancaAtiva()) redirect("/assinatura?erro=desligada");

  const init = await criarPagamentoPix(plano, sessao!.email, sessao!.orgId);
  if (!init) redirect("/assinatura?erro=indisponivel");

  // guarda o plano escolhido; o acesso é liberado pelo webhook quando o PIX é aprovado
  await q("UPDATE orcafacil.profile SET plano = $1 WHERE org_id = $2", [plano, sessao!.orgId]);
  redirect(init.initPoint); // checkout do Mercado Pago com PIX
}

export async function cancelarAssinatura(): Promise<void> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  await q("UPDATE orcafacil.profile SET assinatura_status = 'cancelada' WHERE org_id = $1", [sessao!.orgId]);
  redirect("/assinatura?ok=cancelada");
}

// ---- edição dos planos pelo dono (Painel do Dono) ----
function num(v: FormDataEntryValue | null): number {
  const x = parseFloat(String(v ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

export async function salvarPlanos(formData: FormData): Promise<void> {
  const sessao = await lerSessao();
  if (!ehDono(sessao?.email)) redirect("/painel");

  const padroes = await getPlanos();
  for (const k of PLANO_KEYS) {
    const nome = String(formData.get(`nome_${k}`) || padroes[k].nome).trim() || padroes[k].nome;
    const preco = num(formData.get(`preco_${k}`));
    const ilimitado = String(formData.get(`ilimitado_${k}`) || "") === "1";
    const cota = ilimitado ? null : Math.max(0, Math.round(num(formData.get(`cota_${k}`))));
    const recursos = padroes[k].recursos; // os itens da lista continuam os mesmos por enquanto

    await q(
      `INSERT INTO orcafacil.plan_config (chave, nome, preco, cota, recursos, ordem, atualizado_em)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, now())
       ON CONFLICT (chave) DO UPDATE
         SET nome = EXCLUDED.nome, preco = EXCLUDED.preco, cota = EXCLUDED.cota,
             recursos = EXCLUDED.recursos, atualizado_em = now()`,
      [k, nome, preco > 0 ? preco : padroes[k].preco, cota, JSON.stringify(recursos), PLANO_KEYS.indexOf(k)]
    );
  }
  revalidatePath("/dono");
  revalidatePath("/assinatura");
  revalidatePath("/");
  redirect("/dono?ok=planos");
}
