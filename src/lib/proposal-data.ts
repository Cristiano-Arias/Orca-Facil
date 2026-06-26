import { q, uma } from "./db";
import type { DocPerfil, DocProposta, DocCliente, DocItem } from "@/components/proposal-doc";

export type PropostaCompleta = {
  proposta: DocProposta & { id: string; status: string; org_id: string };
  cliente: DocCliente;
  itens: DocItem[];
  perfil: DocPerfil;
};

// Carrega uma proposta completa. Se orgId for informado, garante que pertence à conta.
export async function carregarProposta(id: string, orgId?: string): Promise<PropostaCompleta | null> {
  const pr = await uma<any>(
    `SELECT id, org_id, numero, status, prazo, pagamento, garantia, validade_dias, desconto, emitido_em, obs, client_id
       FROM orcafacil.proposal WHERE id = $1`,
    [id]
  );
  if (!pr) return null;
  if (orgId && pr.org_id !== orgId) return null;

  const cliente = pr.client_id
    ? await uma<any>("SELECT nome, telefone, endereco FROM orcafacil.client WHERE id = $1", [pr.client_id])
    : null;
  const itensRaw = await q<any>(
    "SELECT descricao, qtd, unidade, preco FROM orcafacil.proposal_item WHERE proposal_id = $1 ORDER BY id",
    [id]
  );
  const perfil =
    (await uma<DocPerfil>(
      "SELECT nome_comercial, responsavel, telefone, email, documento, pix, logo_data_url, cor FROM orcafacil.profile WHERE org_id = $1",
      [pr.org_id]
    )) ?? {};

  return {
    proposta: { ...pr, desconto: Number(pr.desconto) },
    cliente,
    itens: itensRaw.map((i) => ({
      descricao: i.descricao,
      qtd: Number(i.qtd),
      unidade: i.unidade,
      preco: Number(i.preco),
    })),
    perfil,
  };
}

// Totais por proposta (bruto e recebido) calculados com joins simples + JS.
// Portável e leve para a escala de um pequeno negócio.
export async function totaisPorProposta(orgId: string): Promise<Map<string, { bruto: number; recebido: number }>> {
  const [itens, pays] = await Promise.all([
    q<{ proposal_id: string; qtd: string; preco: string }>(
      "SELECT i.proposal_id, i.qtd, i.preco FROM orcafacil.proposal_item i JOIN orcafacil.proposal p ON p.id = i.proposal_id WHERE p.org_id = $1",
      [orgId]
    ),
    q<{ proposal_id: string; valor: string }>(
      "SELECT pay.proposal_id, pay.valor FROM orcafacil.payment pay JOIN orcafacil.proposal p ON p.id = pay.proposal_id WHERE p.org_id = $1",
      [orgId]
    ),
  ]);
  const mapa = new Map<string, { bruto: number; recebido: number }>();
  const get = (id: string) => {
    let v = mapa.get(id);
    if (!v) {
      v = { bruto: 0, recebido: 0 };
      mapa.set(id, v);
    }
    return v;
  };
  for (const i of itens) get(i.proposal_id).bruto += Number(i.qtd) * Number(i.preco);
  for (const p of pays) get(p.proposal_id).recebido += Number(p.valor);
  return mapa;
}
