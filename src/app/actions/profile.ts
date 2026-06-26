"use server";

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

  await q(
    `UPDATE orcafacil.profile SET
       nome_comercial = $1, responsavel = $2, telefone = $3, email = $4,
       documento = $5, endereco = $6, pix = $7, validade_padrao = $8, cor = $9, whatsapp = $10
     WHERE org_id = $11`,
    [s("nome_comercial"), s("responsavel"), s("telefone"), s("email"), s("documento"), s("endereco"), s("pix"), validade, cor, s("whatsapp"), sessao.orgId]
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
