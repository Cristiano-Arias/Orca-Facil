"use server";

import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import { uma } from "@/lib/db";
import { extrairCampos, camposFaltando, type CamposExtraidos } from "@/lib/parser";
import { extrairComIA } from "@/lib/ai";
import { servicosDaOrg, criarProposta } from "@/lib/quotes";

export type EstadoOrcamento = { erro?: string; texto?: string };

export async function criarOrcamento(_prev: EstadoOrcamento, form: FormData): Promise<EstadoOrcamento> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  const texto = String(form.get("texto") || "").trim();
  if (!texto) return { erro: "Escreva os dados do orçamento." };

  const conhecidos = await servicosDaOrg(sessao!.orgId);

  // 1) tenta a IA (se houver chave); 2) sempre completa com o interpretador embutido
  const base = extrairCampos(texto, conhecidos);
  const ia = await extrairComIA(texto);
  const campos: CamposExtraidos = ia ? { ...base, ...limpar(ia) } : base;

  const falta = camposFaltando(campos);
  if (falta.length > 0) {
    return {
      texto,
      erro: `Entendi parte da mensagem, mas faltou: ${falta.join(", ")}. Complete e envie de novo.`,
    };
  }

  const perfil = await uma<{ validade_padrao: number }>(
    "SELECT validade_padrao FROM orcafacil.profile WHERE org_id = $1",
    [sessao!.orgId]
  );
  const { proposalId } = await criarProposta(sessao!.orgId, campos, perfil?.validade_padrao ?? 7);
  redirect(`/propostas/${proposalId}`);
}

// Remove chaves vazias/indefinidas vindas da IA para não sobrescrever o parser.
function limpar(o: CamposExtraidos): CamposExtraidos {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== null && v !== undefined && v !== "") out[k] = v;
  }
  return out as CamposExtraidos;
}
