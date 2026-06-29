import { randomUUID } from "node:crypto";
import { q, uma } from "./db";
import type { CamposExtraidos, ServicoConhecido } from "./parser";

function norm(s: string) {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
const n2 = (x: number) => Math.round(x * 100) / 100;

// Encontra a organização dona de um número de WhatsApp (match tolerante).
export async function orgPorWhatsapp(senderDigits: string): Promise<{ orgId: string } | null> {
  const rows = await q<{ org_id: string; whatsapp: string | null }>(
    "SELECT org_id, whatsapp FROM orcafacil.profile WHERE whatsapp IS NOT NULL AND whatsapp <> ''"
  );
  const alvo = senderDigits.slice(-8);
  for (const r of rows) {
    const w = (r.whatsapp || "").replace(/\D/g, "");
    if (w && w.slice(-8) === alvo) return { orgId: r.org_id };
  }
  return null;
}

export async function servicosDaOrg(orgId: string): Promise<ServicoConhecido[]> {
  const rows = await q<any>(
    "SELECT nome, unidade, preco_padrao, custo_padrao, garantia_padrao FROM orcafacil.service WHERE org_id = $1",
    [orgId]
  );
  return rows.map((r) => ({
    nome: r.nome,
    unidade: r.unidade,
    precoPadrao: Number(r.preco_padrao),
    custoPadrao: Number(r.custo_padrao),
    garantiaPadrao: r.garantia_padrao,
  }));
}

async function acharOuCriarCliente(orgId: string, nome: string, telefone?: string): Promise<{ id: string; novo: boolean }> {
  const todos = await q<any>("SELECT id, nome, telefone FROM orcafacil.client WHERE org_id = $1", [orgId]);
  const alvo = norm(nome);
  let cli = todos.find((c) => norm(c.nome) === alvo);
  if (!cli) {
    const prim = alvo.split(" ")[0];
    const cands = todos.filter((c) => norm(c.nome).split(" ")[0] === prim);
    if (cands.length === 1) cli = cands[0];
  }
  if (cli) {
    if (telefone && !cli.telefone) {
      await q("UPDATE orcafacil.client SET telefone = $1 WHERE id = $2", [telefone, cli.id]);
    }
    return { id: cli.id, novo: false };
  }
  const id = randomUUID();
  await q("INSERT INTO orcafacil.client (id, org_id, nome, telefone) VALUES ($1,$2,$3,$4)", [
    id,
    orgId,
    nome,
    telefone ?? null,
  ]);
  return { id, novo: true };
}

async function acharOuCriarServico(
  orgId: string,
  nome: string,
  unidade: string,
  preco: number,
  custo: number,
  garantia: string
): Promise<{ novo: boolean }> {
  const existente = await uma<any>(
    "SELECT id, historico, garantia_padrao FROM orcafacil.service WHERE org_id = $1 AND lower(nome) = lower($2)",
    [orgId, nome]
  );
  if (existente) {
    const hist: number[] = Array.isArray(existente.historico) ? existente.historico.map(Number) : [];
    hist.push(preco);
    const novaGarantia = garantia || existente.garantia_padrao || null;
    await q(
      "UPDATE orcafacil.service SET preco_padrao = $1::double precision, historico = $2::double precision[], garantia_padrao = $3 WHERE id = $4",
      [preco, hist, novaGarantia, existente.id]
    );
    return { novo: false };
  }
  const id = randomUUID();
  await q(
    "INSERT INTO orcafacil.service (id, org_id, nome, unidade, preco_padrao, custo_padrao, garantia_padrao, historico) VALUES ($1,$2,$3,$4,$5,$6,$7, ARRAY[$5]::double precision[])",
    [id, orgId, nome, unidade, preco, custo, garantia || null]
  );
  return { novo: true };
}

async function proximoNumero(orgId: string): Promise<string> {
  const row = await uma<{ n: string }>("SELECT count(*) AS n FROM orcafacil.proposal WHERE org_id = $1", [orgId]);
  return "ORC-" + (1001 + Number(row?.n ?? 0));
}

export type ItemFinal = { descricao: string; qtd: number; unidade: string; preco: number; custo: number };
export type ResultadoCriacao = {
  proposalId: string;
  numero: string;
  avisos: string[];
  itens: ItemFinal[];
  subtotal: number;
  desconto: number;
  total: number;
};

// Monta a lista final de itens a partir dos campos extraídos (1 ou vários).
function construirItens(c: CamposExtraidos): ItemFinal[] {
  if (Array.isArray(c.itens) && c.itens.length) {
    return c.itens.map((it) => {
      const total = it.total != null ? Number(it.total) : undefined;
      const precoBase = it.preco != null ? Number(it.preco) : undefined;
      const qtd = Number(it.qtd ?? (total && precoBase ? n2(total / precoBase) : 1)) || 1;
      const preco = Number(precoBase ?? (total ? n2(total / qtd) : 0)) || 0;
      return { descricao: it.descricao, qtd, unidade: it.unidade || "un", preco, custo: 0 };
    });
  }
  const cTotal = c.total != null ? Number(c.total) : undefined;
  const cPreco = c.preco != null ? Number(c.preco) : undefined;
  const qtd = Number(c.qtd ?? (cTotal && cPreco ? n2(cTotal / cPreco) : 1)) || 1;
  const preco = Number(cPreco ?? (cTotal && qtd ? n2(cTotal / qtd) : 0)) || 0;
  return [{ descricao: c.servico ?? "Serviço", qtd, unidade: c.unidade ?? "un", preco, custo: Number(c.custo ?? 0) || 0 }];
}

// Cria um orçamento completo a partir dos campos extraídos.
export async function criarProposta(
  orgId: string,
  c: CamposExtraidos,
  validadePadrao: number,
  opts?: { aplicarPadroes?: boolean }
): Promise<ResultadoCriacao> {
  const avisos: string[] = [];
  const itens = construirItens(c);

  // padrões do profissional — preenchem o que faltar (exceto no modo guiado,
  // onde os campos em branco devem permanecer em branco se o usuário confirmou).
  const aplicar = opts?.aplicarPadroes !== false;
  const padrao = aplicar
    ? await uma<{
        pagamento_padrao: string | null;
        garantia_padrao: string | null;
        prazo_padrao: string | null;
        obs_padrao: string | null;
      }>(
        "SELECT pagamento_padrao, garantia_padrao, prazo_padrao, obs_padrao FROM orcafacil.profile WHERE org_id = $1",
        [orgId]
      )
    : null;
  const garantia = c.garantia ?? padrao?.garantia_padrao ?? "";
  const prazo = c.prazo ?? padrao?.prazo_padrao ?? null;
  const pagamento = c.pagamento ?? padrao?.pagamento_padrao ?? null;
  const obs = c.obs ?? padrao?.obs_padrao ?? null;

  const cli = await acharOuCriarCliente(orgId, c.cliente!, c.telefone);
  if (cli.novo) avisos.push(`Criei o cadastro do cliente ${c.cliente}.`);

  // cadastra/atualiza cada serviço no catálogo
  for (const it of itens) {
    const sv = await acharOuCriarServico(orgId, it.descricao, it.unidade, it.preco, it.custo, garantia);
    if (sv.novo) avisos.push(`Cadastrei o serviço "${it.descricao}".`);
  }

  const subtotal = n2(itens.reduce((s, i) => s + i.qtd * i.preco, 0));
  const descontoPct = c.descontoPct != null ? Number(c.descontoPct) : 0;
  const desconto = descontoPct ? n2(subtotal * (descontoPct / 100)) : 0;
  const total = n2(subtotal - desconto);
  const numero = await proximoNumero(orgId);
  const validadeDias = c.validadeDias != null ? Math.round(Number(c.validadeDias)) || validadePadrao : validadePadrao;
  const proposalId = randomUUID();

  await q(
    `INSERT INTO orcafacil.proposal
      (id, org_id, numero, client_id, servico_base, status, prazo, pagamento, garantia, validade_dias, desconto, obs)
     VALUES ($1,$2,$3,$4,$5,'RASCUNHO',$6,$7,$8,$9,$10,$11)`,
    [
      proposalId,
      orgId,
      numero,
      cli.id,
      itens[0].descricao,
      prazo,
      pagamento,
      garantia || null,
      validadeDias,
      desconto,
      obs,
    ]
  );
  for (const it of itens) {
    await q(
      "INSERT INTO orcafacil.proposal_item (id, proposal_id, descricao, qtd, unidade, preco, custo) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [randomUUID(), proposalId, it.descricao, it.qtd, it.unidade, it.preco, it.custo]
    );
  }

  return { proposalId, numero, avisos, itens, subtotal, desconto, total };
}
