"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth";
import { q } from "@/lib/db";
import { corValida } from "@/lib/proposal-format";

export type EstadoPerfil = { ok?: boolean; erro?: string };

export async function salvarPerfil(_prev: EstadoPerfil, form: FormData): Promise<EstadoPerfil> {
  const sessao = await lerSessao();
  if (!sessao) return { erro: "Sessão expirada." };

  const s = (k: string) => {
    const v = String(form.get(k) || "").trim();
    return v === "" ? null : v;
  };
  const validade = parseInt(String(form.get("validade_padrao") || "7")) || 7;
  const logo = String(form.get("logo_data_url") || "");
  const cor = corValida(String(form.get("cor") || ""));
  const logoFundo = String(form.get("logo_fundo") || "branco") === "transparente" ? "transparente" : "branco";
  const logoFormato = String(form.get("logo_formato") || "quadrado") === "redondo" ? "redondo" : "quadrado";
  const logoEmoji = s("logo_emoji");

  await q(
    `UPDATE orcafacil.profile SET
       nome_comercial = $1, responsavel = $2, telefone = $3, email = $4,
       documento = $5, endereco = $6, pix = $7, validade_padrao = $8, cor = $9, whatsapp = $10,
       logo_fundo = $11, logo_formato = $12, logo_emoji = $13,
       pagamento_padrao = $14, garantia_padrao = $15, prazo_padrao = $16, obs_padrao = $17
     WHERE org_id = $18`,
    [s("nome_comercial"), s("responsavel"), s("telefone"), s("email"), s("documento"), s("endereco"), s("pix"), validade, cor, s("whatsapp"), logoFundo, logoFormato, logoEmoji, s("pagamento_padrao"), s("garantia_padrao"), s("prazo_padrao"), s("obs_padrao"), sessao.orgId]
  );

  // logo: só atualiza se enviaram um novo (data URL) ou pediram para remover
  if (logo === "__remover__") {
    await q("UPDATE orcafacil.profile SET logo_data_url = NULL WHERE org_id = $1", [sessao.orgId]);
  } else if (logo.startsWith("data:image")) {
    await q("UPDATE orcafacil.profile SET logo_data_url = $1 WHERE org_id = $2", [logo, sessao.orgId]);
  }

  revalidatePath("/perfil");
  return { ok: true };
}

// Assistente de boas-vindas (1º acesso): salva os padrões e marca como concluído.
export async function salvarOnboarding(_prev: EstadoPerfil, form: FormData): Promise<EstadoPerfil> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  const s = (k: string) => {
    const v = String(form.get(k) || "").trim();
    return v === "" ? null : v;
  };
  const validade = parseInt(String(form.get("validade_padrao") || "7")) || 7;
  try {
    await q(
      `UPDATE orcafacil.profile SET
         whatsapp = coalesce($1, whatsapp),
         pagamento_padrao = $2, garantia_padrao = $3, prazo_padrao = $4, obs_padrao = $5,
         validade_padrao = $6, onboarded = true
       WHERE org_id = $7`,
      [s("whatsapp"), s("pagamento_padrao"), s("garantia_padrao"), s("prazo_padrao"), s("obs_padrao"), validade, sessao!.orgId]
    );
  } catch (e) {
    console.error("Falha no onboarding:", e);
    return { erro: "Não consegui salvar agora. Tente de novo." };
  }
  redirect("/painel");
}

// Permite pular o assistente sem preencher (marca como concluído).
export async function pularOnboarding(): Promise<void> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  await q("UPDATE orcafacil.profile SET onboarded = true WHERE org_id = $1", [sessao!.orgId]);
  redirect("/painel");
}
