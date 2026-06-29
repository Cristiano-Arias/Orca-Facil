"use server";

import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import { q } from "@/lib/db";
import { cobrancaAtiva, PLANOS, type PlanoKey } from "@/lib/billing";
import { criarAssinatura } from "@/lib/mercadopago";

// Inicia a assinatura de um plano: cria a cobrança no Mercado Pago e
// redireciona para o checkout. Seguro quando a cobrança está desligada.
export async function assinar(formData: FormData): Promise<void> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  const plano = String(formData.get("plano") || "") as PlanoKey;
  if (!PLANOS[plano]) redirect("/assinatura?erro=plano");

  if (!cobrancaAtiva()) redirect("/assinatura?erro=desligada");

  const init = await criarAssinatura(plano, sessao!.email, sessao!.orgId);
  if (!init) redirect("/assinatura?erro=indisponivel");

  // guarda o id da assinatura (status real vem pelo webhook ao pagar)
  await q("UPDATE orcafacil.profile SET plano = $1, mp_preapproval_id = $2 WHERE org_id = $3", [
    plano,
    init.preapprovalId,
    sessao!.orgId,
  ]);
  redirect(init.initPoint); // vai para o checkout do Mercado Pago
}

export async function cancelarAssinatura(): Promise<void> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  await q(
    "UPDATE orcafacil.profile SET assinatura_status = 'cancelada' WHERE org_id = $1",
    [sessao!.orgId]
  );
  redirect("/assinatura?ok=cancelada");
}
