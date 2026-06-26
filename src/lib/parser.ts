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
};

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
  return null;
}

export function parseMoeda(s: string): number | null {
  const m = s.match(/r?\$?\s*([\d.]+(?:,\d{1,2})?)/i);
  if (!m) return null;
  return parseFloat(m[1].replace(/\./g, "").replace(",", "."));
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

  m = t.match(/(?:valor total|total|fica em|fica por|sai por)\D{0,6}r?\$?\s*([\d.]+(?:,\d{1,2})?)/i);
  if (m) out.total = parseFloat(m[1].replace(/\./g, "").replace(",", "."));

  m = n.match(/prazo\s*(?:de\s*)?(\d+\s*(?:dias?|semanas?|meses?|horas?))/);
  if (m) out.prazo = m[1];
  else if (/\bamanha\b/.test(n)) out.prazo = "1 dia (amanhã)";
  else if (/\bhoje\b/.test(n)) out.prazo = "hoje";
  else {
    m = n.match(/(?:execu[çc][aã]o|entrega)\s*(?:em|de|:)?\s*(\d+\s*dias?)/);
    if (m) out.prazo = m[1];
  }

  if (/pix/.test(n)) out.pagamento = "Pix";
  m = t.match(/(\d{1,3}%\s*(?:de\s*)?entrada[^,.;]*)/i);
  if (m) out.pagamento = m[1].trim();
  else if (/a\s*vista|à\s*vista/.test(n)) out.pagamento = out.pagamento ? out.pagamento + " à vista" : "À vista";
  else if (/parcel/.test(n)) {
    const mm = t.match(/(\d+)\s*x/);
    out.pagamento = "Parcelado" + (mm ? " em " + mm[1] + "x" : "");
  } else if (/cart[aã]o/.test(n)) out.pagamento = out.pagamento || "Cartão";
  else if (/boleto/.test(n)) out.pagamento = out.pagamento || "Boleto";

  m = n.match(/garantia\s*(?:de\s*)?(\d+\s*(?:dias?|meses?|anos?|ano))/);
  if (m) out.garantia = m[1];

  m = n.match(/validade\s*(?:de\s*)?(\d+)\s*dias?/);
  if (m) out.validadeDias = parseInt(m[1]);

  m = n.match(/desconto\s*(?:de\s*)?(\d+)\s*%/);
  if (m) out.descontoPct = parseInt(m[1]);

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
  for (const k of ["cliente", "telefone", "servico", "unidade", "prazo", "pagamento", "garantia"] as const) {
    if (out[k] != null) out[k] = String(out[k]).trim() as any;
  }
  return out;
}

// Lista o que ainda falta para fechar um orçamento.
export function camposFaltando(c: CamposExtraidos): string[] {
  const falta: string[] = [];
  if (!c.servico) falta.push("serviço");
  if (!c.cliente) falta.push("cliente");
  if (!c.qtd && !c.total) falta.push("quantidade");
  if (c.preco == null && c.total == null) falta.push("valor");
  return falta;
}
