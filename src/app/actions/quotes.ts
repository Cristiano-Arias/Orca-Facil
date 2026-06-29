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
  // leva direto para a tela de conferência: o profissional revisa/ajusta os itens
  // (garante que a proposta fique exatamente como ele quer antes de enviar ao cliente)
  redirect(`/propostas/${proposalId}/editar?novo=1`);
}

// Criação "passo a passo" (formulário guiado): recebe os campos já estruturados.
function n(v: unknown): number {
  const x = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

export async function criarOrcamentoManual(formData: FormData): Promise<void> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  let itens: { descricao: string; qtd: number; unidade: string; preco: number }[] = [];
  try {
    const arr = JSON.parse(String(formData.get("itens") || "[]"));
    if (Array.isArray(arr)) {
      itens = arr
        .map((i: any) => ({
          descricao: String(i.descricao || "").trim(),
          qtd: n(i.qtd) || 1,
          unidade: String(i.unidade || "un").trim() || "un",
          preco: n(i.preco),
        }))
        .filter((i) => i.descricao);
    }
  } catch {
    /* ignora */
  }

  const str = (k: string) => {
    const v = String(formData.get(k) || "").trim();
    return v === "" ? undefined : v;
  };
  const cliente = str("cliente_nome");
  // campos essenciais mínimos para existir um orçamento
  if (!cliente || itens.length === 0) redirect("/propostas/novo?erro=faltam_dados");

  const subtotal = itens.reduce((s, i) => s + i.qtd * i.preco, 0);
  const descontoValor = n(formData.get("desconto"));
  const descontoPct = subtotal > 0 && descontoValor > 0 ? (descontoValor / subtotal) * 100 : 0;
  const validade = parseInt(String(formData.get("validade_dias") || "7")) || 7;

  const campos: CamposExtraidos = {
    cliente,
    telefone: str("cliente_telefone"),
    itens: itens.map((i) => ({ descricao: i.descricao, qtd: i.qtd, unidade: i.unidade, preco: i.preco })),
    prazo: str("prazo"),
    pagamento: str("pagamento"),
    garantia: str("garantia"),
    obs: str("obs"),
    validadeDias: validade,
    descontoPct,
  };

  let proposalId: string;
  try {
    // aplicarPadroes:false — respeita os campos em branco que o usuário confirmou deixar vazios
    const r = await criarProposta(sessao!.orgId, campos, validade, { aplicarPadroes: false });
    proposalId = r.proposalId;
  } catch (e) {
    if (ehRedirect(e)) throw e;
    console.error("Falha ao criar orçamento (guiado):", e);
    redirect("/propostas/novo?erro=salvar");
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
