"use server";

import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import { uma } from "@/lib/db";
import { extrairCampos, camposFaltando, sanitizar, type CamposExtraidos } from "@/lib/parser";
import { extrairComIA } from "@/lib/ai";
import { servicosDaOrg, criarProposta } from "@/lib/quotes";

// A exceção que o redirect() lança internamente não deve ser tratada como erro.
function ehRedirect(e: unknown): boolean {
  return !!e && typeof e === "object" && "digest" in e && String((e as any).digest).startsWith("NEXT_REDIRECT");
}

export type EstadoOrcamento = { erro?: string; texto?: string };

export async function criarOrcamento(_prev: EstadoOrcamento, form: FormData): Promise<EstadoOrcamento> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  const texto = String(form.get("texto") || "").trim();
  if (!texto) return { erro: "Escreva os dados do orçamento." };

  let proposalId: string;
  try {
    const conhecidos = await servicosDaOrg(sessao!.orgId);

    // 1) interpretador embutido; 2) se houver chave, completa com a IA
    const base = extrairCampos(texto, conhecidos);
    const ia = await extrairComIA(texto);
    // sanitiza tudo (números de verdade) — a IA pode devolver texto como "R$ 650"
    const campos: CamposExtraidos = sanitizar(ia ? { ...base, ...limpar(ia) } : base);

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
    const r = await criarProposta(sessao!.orgId, campos, perfil?.validade_padrao ?? 7);
    proposalId = r.proposalId;
  } catch (e) {
    if (ehRedirect(e)) throw e;
    console.error("Falha ao criar orçamento:", e);
    return { texto, erro: "Não consegui salvar o orçamento agora. Tente novamente em instantes." };
  }
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
