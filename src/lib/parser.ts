// Interpretador de mensagens em PT-BR (determinístico, sem dependência externa).
// Extrai os campos de um orçamento a partir de uma frase natural.

export type ServicoConhecido = {
  nome: string;
  unidade: string;
  precoPadrao: number;
  custoPadrao: number;
  garantiaPadrao?: string | null;
};

export type CamposExtraidos = {
  cliente?: string;
  telefone?: string;
  servico?: string;
  unidade?: string;
  qtd?: number;
  preco?: number;
  custo?: number;
  total?: number;
  prazo?: string;
  pagamento?: string;
  garantia?: string;
  validadeDias?: number;
  descontoPct?: number;
  obs?: string;
  itens?: ItemExtraido[];
};

export type ItemExtraido = {
  descricao: string;
  qtd?: number;
  unidade?: string;
  preco?: number;
  total?: number;
};

const STOPWORDS = new Set([
  "de", "da", "do", "dos", "das", "no", "na", "nos", "nas", "o", "a", "os", "as",
  "um", "uma", "em", "com", "que", "e", "para", "pra", "ao",
]);

function normaliza(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normUnidade(u: string): string {
  const n = normaliza(u);
  if (/m2|m²|metro/.test(n)) return "m²";
  if (/hora/.test(n)) return "h";
  if (/dia/.test(n)) return "diária";
  return "un";
}

const SERVICOS_CHAVE: [string, string, string][] = [
  ["pintura", "Pintura de apartamento", "m²"],
  ["ar-?condicionado|split|climatiza", "Instalação de ar-condicionado split", "un"],
  ["tomada", "Troca de tomadas", "un"],
  ["luminaria|lâmpada|lampada|spot", "Instalação de luminária", "un"],
  ["eletric|elétric|fia[çc][aã]o", "Serviço elétrico", "serviço"],
  ["hidraul|encanamento|vazamento|cano", "Reparo hidráulico", "serviço"],
  ["gesso|drywall|forro", "Instalação de gesso", "m²"],
  ["piso|porcelanato|azulejo", "Assentamento de piso", "m²"],
  ["marcenaria|movel|armario", "Marcenaria", "serviço"],
  ["limpeza", "Limpeza", "serviço"],
  ["jardin|poda|grama", "Jardinagem", "serviço"],
  ["conserto|reparo|manuten", "Manutenção geral", "serviço"],
];

type ServicoDetectado = {
  nome: string;
  unidade: string;
  preco: number | null;
  custo: number | null;
  garantia: string;
};

function detectarServico(t: string, conhecidos: ServicoConhecido[]): ServicoDetectado | null {
  const n = normaliza(t);
  // 1) tenta casar com serviços já cadastrados do profissional
  for (const s of conhecidos) {
    const k = normaliza(s.nome).split(" ")[0];
    if (k.length > 3 && n.includes(k)) {
      return {
        nome: s.nome,
        unidade: s.unidade,
        preco: s.precoPadrao,
        custo: s.custoPadrao,
        garantia: s.garantiaPadrao ?? "",
      };
    }
  }
  // 2) palavras-chave conhecidas
  for (const [rx, nome, uni] of SERVICOS_CHAVE) {
    if (new RegExp(rx).test(n)) {
      const cad = conhecidos.find((s) => normaliza(s.nome) === normaliza(nome));
      return {
        nome,
        unidade: uni,
        preco: cad ? cad.precoPadrao : null,
        custo: cad ? cad.custoPadrao : null,
        garantia: cad?.garantiaPadrao ?? "",
      };
    }
  }
  // 3) extração genérica: "serviço de X", "aplicação de X", "instalação de X"...
  const gen =
    t.match(/servi[çc]os?\s+de\s+([A-Za-zÀ-ú][\wÀ-ú]+(?:\s+[A-Za-zÀ-ú][\wÀ-ú]+){0,2})/i) ||
    t.match(
      /(?:aplica[çc][aã]o|instala[çc][aã]o|troca|conserto|reparo|manuten[çc][aã]o|montagem|corte|limpeza|pintura|reforma|revis[aã]o)\s+(?:de\s+|do\s+|da\s+|dos\s+|das\s+)?([A-Za-zÀ-ú][\wÀ-ú]+(?:\s+[A-Za-zÀ-ú][\wÀ-ú]+){0,2})/i
    );
  if (gen) {
    const bruto = gen[1].trim();
    const primeira = normaliza(bruto).split(" ")[0];
    // evita capturar palavras vazias ("de", "uma"...) como nome de serviço
    if (bruto.length > 2 && !STOPWORDS.has(primeira)) {
      const nome = bruto.charAt(0).toUpperCase() + bruto.slice(1);
      return { nome, unidade: "un", preco: null, custo: null, garantia: "" };
    }
  }
  return null;
}

export function parseMoeda(s: string): number | null {
  const m = s.match(/r?\$?\s*([\d.]+(?:,\d{1,2})?)/i);
  if (!m) return null;
  return parseFloat(m[1].replace(/\./g, "").replace(",", "."));
}

// Encontra TODOS os serviços mencionados no texto, com a posição de cada um.
// Serve para separar uma mensagem com vários serviços ("pintura ..., troca de
// tomadas ..., reparo ...") em itens, sem depender da IA.
type ServicoComPos = ServicoDetectado & { index: number };
function detectarServicosComPos(t: string, conhecidos: ServicoConhecido[]): ServicoComPos[] {
  const n = normaliza(t);
  const achados: ServicoComPos[] = [];

  // 1) serviços já cadastrados pelo profissional
  for (const s of conhecidos) {
    const k = normaliza(s.nome).split(" ")[0];
    if (k.length > 3) {
      const idx = n.indexOf(k);
      if (idx >= 0)
        achados.push({ nome: s.nome, unidade: s.unidade, preco: s.precoPadrao, custo: s.custoPadrao, garantia: s.garantiaPadrao ?? "", index: idx });
    }
  }
  // 2) palavras-chave conhecidas
  for (const [rx, nome, uni] of SERVICOS_CHAVE) {
    const mm = new RegExp(rx).exec(n);
    if (mm) {
      const cad = conhecidos.find((s) => normaliza(s.nome) === normaliza(nome));
      achados.push({ nome, unidade: uni, preco: cad ? cad.precoPadrao : null, custo: cad ? cad.custoPadrao : null, garantia: cad?.garantiaPadrao ?? "", index: mm.index });
    }
  }
  // 3) genérico: "serviço de X", "instalação de X", "troca de X"...
  const genRx =
    /(?:servi[çc]os?\s+de|aplica[çc][aã]o|instala[çc][aã]o|troca|conserto|reparo|manuten[çc][aã]o|montagem|corte|limpeza|pintura|reforma|revis[aã]o)\s+(?:de\s+|do\s+|da\s+|dos\s+|das\s+)?([A-Za-zÀ-ú][\wÀ-ú]+(?:\s+[A-Za-zÀ-ú][\wÀ-ú]+){0,2})/gi;
  let gm: RegExpExecArray | null;
  while ((gm = genRx.exec(t)) !== null) {
    const bruto = gm[1].trim();
    const primeira = normaliza(bruto).split(" ")[0];
    if (bruto.length > 2 && !STOPWORDS.has(primeira)) {
      const nome = bruto.charAt(0).toUpperCase() + bruto.slice(1);
      achados.push({ nome, unidade: "un", preco: null, custo: null, garantia: "", index: gm.index });
    }
  }

  // ordena por posição e remove duplicatas (mesmo nome ou posições muito próximas)
  achados.sort((a, b) => a.index - b.index);
  const final: ServicoComPos[] = [];
  for (const a of achados) {
    if (final.some((f) => normaliza(f.nome) === normaliza(a.nome) || Math.abs(f.index - a.index) < 4)) continue;
    final.push(a);
  }
  return final;
}

// Extrai quantidade/preço/total de um trecho de texto (um serviço por vez).
function extrairValorTrecho(seg: string): { qtd?: number; unidade?: string; preco?: number; total?: number } {
  const out: { qtd?: number; unidade?: string; preco?: number; total?: number } = {};
  const n = normaliza(seg);
  let m = n.match(
    /(\d+(?:[.,]\d+)?)\s*(m2|m²|metros?\s*quadrados?|metros?|un|unidades?|pe[çc]as?|tomadas?|janelas?|portas?|luminarias?|ar-?condicionados?|splits?|horas?|dias?\b|serv)/
  );
  if (m) {
    out.qtd = parseFloat(m[1].replace(",", "."));
    out.unidade = normUnidade(m[2]);
  }
  m = seg.match(/r?\$?\s*([\d.]+(?:,\d{1,2})?)\s*(?:reais\s*)?(?:\/|por\b|cada\b|o metro|a unidade)/i);
  if (m) out.preco = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
  m = seg.match(/(?:valor total|total|valor de|valor:|fica em|fica por|sai por|cobro|por)\D{0,6}r?\$?\s*([\d.]+(?:,\d{1,2})?)/i);
  if (m) out.total = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
  // fallback: qualquer valor em R$ no trecho vira total do item
  if (out.preco == null && out.total == null) {
    m = seg.match(/r\$\s*([\d.]+(?:,\d{1,2})?)/i);
    if (m) out.total = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
  }
  return out;
}

// Posição onde começam as "condições" (prazo, pagamento...), para não deixar
// esse texto contaminar o valor do último item.
function inicioCondicoes(t: string): number {
  const n = normaliza(t);
  let pos = t.length;
  for (const kw of ["prazo", "pagamento", "garantia", "validade", "observ", "obs:", "desconto"]) {
    const i = n.indexOf(kw);
    if (i >= 0 && i < pos) pos = i;
  }
  return pos;
}

// Tenta separar a mensagem em VÁRIOS itens. Retorna [] quando não há 2+ serviços
// claros (aí o fluxo de item único cuida do resto).
function extrairItens(t: string, conhecidos: ServicoConhecido[]): ItemExtraido[] {
  const fimRegiao = inicioCondicoes(t);
  const svs = detectarServicosComPos(t, conhecidos).filter((s) => s.index < fimRegiao);
  if (svs.length < 2) return [];
  const itens: ItemExtraido[] = [];
  for (let i = 0; i < svs.length; i++) {
    const trecho = t.slice(svs[i].index, i + 1 < svs.length ? svs[i + 1].index : fimRegiao);
    const val = extrairValorTrecho(trecho);
    const preco = val.preco ?? (svs[i].preco ?? undefined);
    const total = val.total;
    if (preco == null && total == null) continue; // item sem valor não entra
    const it: ItemExtraido = { descricao: svs[i].nome, unidade: val.unidade ?? svs[i].unidade };
    if (val.qtd != null) it.qtd = val.qtd;
    if (preco != null) it.preco = preco;
    if (total != null) it.total = total;
    itens.push(it);
  }
  return itens.length >= 2 ? itens : [];
}

export function extrairCampos(texto: string, conhecidos: ServicoConhecido[] = []): CamposExtraidos {
  const t = texto;
  const n = normaliza(texto);
  const out: CamposExtraidos = {};

  let m = t.match(
    /(?:[Pp]ara|[Pp]ra|[Pp]ro|[Cc]liente|[Ss]r\.?|[Ss]ra\.?|[Dd]ona|[Ss]eu)\s+(?:[oa] |[Dd]ona |[Ss]r\.? |[Ss]ra\.? )?([A-ZÀ-Ú][\wÀ-ú]+(?:\s+[A-ZÀ-Ú][\wÀ-ú]+){0,2})/
  );
  if (m) out.cliente = m[1].trim();

  m = t.match(/(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/);
  if (m) out.telefone = m[1];

  m = n.match(
    /(\d+(?:[.,]\d+)?)\s*(m2|m²|metros?\s*quadrados?|metros?|un|unidades?|pe[çc]as?|tomadas?|janelas?|portas?|luminarias?|ar-?condicionados?|splits?|horas?|dias?\b|serv)/
  );
  if (m) {
    out.qtd = parseFloat(m[1].replace(",", "."));
    out.unidade = normUnidade(m[2]);
  }

  m = t.match(/r?\$?\s*([\d.]+(?:,\d{1,2})?)\s*(?:reais\s*)?(?:\/|por\b|cada\b|o metro|a unidade)/i);
  if (m) out.preco = parseFloat(m[1].replace(/\./g, "").replace(",", "."));

  m = t.match(/(?:valor total|total|valor de|valor:|valor\s+r\$|fica em|fica por|sai por|cobro|fica)\D{0,6}r?\$?\s*([\d.]+(?:,\d{1,2})?)/i);
  if (m) out.total = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
  // fallback: se não achou preço unitário nem total, pega o primeiro valor em R$
  if (out.preco == null && out.total == null) {
    m = t.match(/r\$\s*([\d.]+(?:,\d{1,2})?)/i);
    if (m) out.total = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
  }

  m = n.match(/prazo\s*(?:de\s*)?(\d+\s*(?:dias?|semanas?|meses?|horas?))/);
  if (m) out.prazo = m[1];
  else if (/\bamanha\b/.test(n)) out.prazo = "1 dia (amanhã)";
  else if (/\bhoje\b/.test(n)) out.prazo = "hoje";
  else {
    m = n.match(/(?:execu[çc][aã]o|entrega)\s*(?:em|de|:)?\s*(\d+\s*dias?)/);
    if (m) out.prazo = m[1];
  }

  // pagamento — captura a cláusula inteira "pagamento ..." (preserva detalhes como
  // "em até 6x ou pix com 5% de desconto"); senão usa as pistas soltas.
  m = t.match(/pagamento\s*:?\s*(?:em\s+|de\s+|via\s+)?([^.;\n]*(?:vezes?|x\b|entrega|entrada|pix|cart[aã]o|boleto|desconto|%|à vista|a vista)[^.;\n]*)/i);
  // remove cláusulas de outras condições que possam ter sido capturadas junto
  // (ex.: "... na entrega, garantia 90 dias, desconto de 10%" → só o pagamento)
  if (m) out.pagamento = m[1].replace(/\s*,\s*(observa[çc]|garantia|validade|prazo|desconto|obs)\b.*$/i, "").trim();
  else if (/(\d{1,3}%\s*(?:de\s*)?entrada[^,.;]*)/i.test(t)) out.pagamento = t.match(/(\d{1,3}%\s*(?:de\s*)?entrada[^,.;]*)/i)![1].trim();
  else if (/pix/.test(n)) out.pagamento = "Pix";
  else if (/a\s*vista|à\s*vista/.test(n)) out.pagamento = "À vista";
  else if (/parcel/.test(n)) {
    const mm = t.match(/(\d+)\s*x/);
    out.pagamento = "Parcelado" + (mm ? " em " + mm[1] + "x" : "");
  } else if (/cart[aã]o/.test(n)) out.pagamento = "Cartão";
  else if (/boleto/.test(n)) out.pagamento = "Boleto";

  // observação / observações: guarda o texto livre para aparecer na proposta
  m = t.match(/(?:observa[^:\n]{0,15}|obs)\s*:\s*(.+)$/is);
  if (m) out.obs = m[1].trim().replace(/\s+/g, " ");

  m = n.match(/garantia\s*(?:de\s*)?(\d+\s*(?:dias?|meses?|anos?|ano))/);
  if (m) out.garantia = m[1];

  m = n.match(/validade\s*(?:de\s*)?(\d+)\s*dias?/);
  if (m) out.validadeDias = parseInt(m[1]);

  m = n.match(/desconto\s*(?:de\s*)?(\d+)\s*%/);
  if (m) out.descontoPct = parseInt(m[1]);

  // vários serviços na mesma mensagem → monta a lista de itens
  const itens = extrairItens(t, conhecidos);
  if (itens.length >= 2) out.itens = itens;

  const sv = detectarServico(t, conhecidos);
  if (sv) {
    out.servico = sv.nome;
    if (!out.unidade) out.unidade = sv.unidade;
    if (out.preco == null && sv.preco != null) out.preco = sv.preco;
    if (sv.custo != null) out.custo = sv.custo;
    if (!out.garantia && sv.garantia) out.garantia = sv.garantia;
  }

  // deriva preço/quantidade a partir do total quando faltar
  if (out.preco == null && out.total != null && out.qtd) out.preco = Math.round((out.total / out.qtd) * 100) / 100;
  if (!out.qtd && out.total != null && out.preco) out.qtd = Math.round((out.total / out.preco) * 100) / 100;

  return out;
}

// Converte um valor (número ou texto como "R$ 2.240,50") para número, ou undefined.
export function paraNumero(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  let s = String(v).trim().replace(/[^\d.,-]/g, "");
  if (!s) return undefined;
  // formato BR: "2.240,50" -> "2240.50"; "28,50" -> "28.50"; "1.200" -> "1200"
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

// Garante que os campos numéricos sejam números de verdade (importante para os
// dados vindos da IA, que podem chegar como texto e quebrar o banco).
export function sanitizar(c: CamposExtraidos): CamposExtraidos {
  const out: CamposExtraidos = { ...c };
  for (const k of ["qtd", "preco", "custo", "total", "descontoPct", "validadeDias"] as const) {
    if (c[k] !== undefined) {
      const n = paraNumero(c[k]);
      if (n === undefined) delete out[k];
      else (out[k] as number) = k === "validadeDias" ? Math.round(n) : n;
    }
  }
  for (const k of ["cliente", "telefone", "servico", "unidade", "prazo", "pagamento", "garantia", "obs"] as const) {
    if (out[k] != null) out[k] = String(out[k]).trim() as any;
  }
  // sanitiza a lista de itens (números de verdade), descartando os sem descrição
  if (Array.isArray(c.itens)) {
    out.itens = c.itens
      .map((it) => {
        const i: ItemExtraido = { descricao: String(it?.descricao ?? "").trim() };
        const qtd = paraNumero(it?.qtd);
        const preco = paraNumero(it?.preco);
        const total = paraNumero(it?.total);
        if (qtd !== undefined) i.qtd = qtd;
        if (preco !== undefined) i.preco = preco;
        if (total !== undefined) i.total = total;
        if (it?.unidade) i.unidade = String(it.unidade).trim();
        return i;
      })
      .filter((i) => i.descricao);
    if (out.itens.length === 0) delete out.itens;
  }
  return out;
}

// Lista o que ainda falta para fechar um orçamento.
export function camposFaltando(c: CamposExtraidos): string[] {
  const temItens = Array.isArray(c.itens) && c.itens.length > 0;
  const falta: string[] = [];
  if (!c.cliente) falta.push("cliente");
  if (temItens) {
    // com lista de itens, exige pelo menos um valor por item
    const semValor = c.itens!.some((i) => i.preco == null && i.total == null);
    if (semValor) falta.push("valor de algum item");
    return falta;
  }
  if (!c.servico) falta.push("serviço");
  if (!c.qtd && !c.total) falta.push("quantidade");
  if (c.preco == null && c.total == null) falta.push("valor");
  return falta;
}
