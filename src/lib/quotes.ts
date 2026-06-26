import { randomUUID } from "node:crypto";
import { q, uma } from "./db";
import type { CamposExtraidos, ServicoConhecido } from "./parser";

function norm(s: string) {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
const n2 = (x: number) => Math.round(x * 100) / 100;

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

export type ResultadoCriacao = {
  proposalId: string;
  numero: string;
  avisos: string[];
};

// Cria um orçamento completo a partir dos campos extraídos.
export async function criarProposta(
  orgId: string,
  c: CamposExtraidos,
  validadePadrao: number
): Promise<ResultadoCriacao> {
  const avisos: string[] = [];

  // Number(...) defensivo: garante que nada vá como texto para colunas numéricas.
  const cTotal = c.total != null ? Number(c.total) : undefined;
  const cPreco = c.preco != null ? Number(c.preco) : undefined;
  const qtd = Number(c.qtd ?? (cTotal && cPreco ? n2(cTotal / cPreco) : 1)) || 1;
  const preco = Number(cPreco ?? (cTotal && qtd ? n2(cTotal / qtd) : 0)) || 0;
  const custo = Number(c.custo ?? 0) || 0;
  const garantia = c.garantia ?? "";

  const cli = await acharOuCriarCliente(orgId, c.cliente!, c.telefone);
  if (cli.novo) avisos.push(`Criei o cadastro do cliente ${c.cliente}.`);

  if (c.servico) {
    const sv = await acharOuCriarServico(orgId, c.servico, c.unidade ?? "un", preco, custo, garantia);
    if (sv.novo) avisos.push(`Cadastrei o serviço "${c.servico}".`);
  }

  const numero = await proximoNumero(orgId);
  const descontoPct = c.descontoPct != null ? Number(c.descontoPct) : 0;
  const desconto = descontoPct ? n2(qtd * preco * (descontoPct / 100)) : 0;
  const validadeDias = c.validadeDias != null ? Math.round(Number(c.validadeDias)) || validadePadrao : validadePadrao;
  const proposalId = randomUUID();

  await q(
    `INSERT INTO orcafacil.proposal
      (id, org_id, numero, client_id, servico_base, status, prazo, pagamento, garantia, validade_dias, desconto)
     VALUES ($1,$2,$3,$4,$5,'RASCUNHO',$6,$7,$8,$9,$10)`,
    [
      proposalId,
      orgId,
      numero,
      cli.id,
      c.servico ?? "Serviço",
      c.prazo ?? null,
      c.pagamento ?? null,
      garantia || null,
      validadeDias,
      desconto,
    ]
  );
  await q(
    "INSERT INTO orcafacil.proposal_item (id, proposal_id, descricao, qtd, unidade, preco, custo) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [randomUUID(), proposalId, c.servico ?? "Serviço", qtd, c.unidade ?? "un", preco, custo]
  );

  return { proposalId, numero, avisos };
}
