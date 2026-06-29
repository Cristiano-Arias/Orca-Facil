export const ST_LABEL: Record<string, string> = {
  RASCUNHO: "Rascunho",
  AGUARDANDO: "Aguardando confirmação",
  ENVIADA: "Enviada",
  VISUALIZADA: "Visualizada",
  NEGOCIACAO: "Em negociação",
  AJUSTADA: "Ajustada",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  VENCIDA: "Vencida",
  CANCELADA: "Cancelada",
  CONVERTIDA: "Convertida em serviço",
  PAGA_PARCIAL: "Paga parcialmente",
  PAGA: "Paga",
};

export const ST_CLASSE: Record<string, string> = {
  RASCUNHO: "bg-slate-100 text-slate-600",
  AGUARDANDO: "bg-amber-100 text-amber-700",
  ENVIADA: "bg-blue-100 text-blue-700",
  VISUALIZADA: "bg-indigo-100 text-indigo-700",
  NEGOCIACAO: "bg-pink-100 text-pink-700",
  AJUSTADA: "bg-sky-100 text-sky-700",
  APROVADA: "bg-emerald-100 text-emerald-700",
  RECUSADA: "bg-rose-100 text-rose-700",
  VENCIDA: "bg-amber-100 text-amber-800",
  CANCELADA: "bg-slate-100 text-slate-400",
  CONVERTIDA: "bg-cyan-100 text-cyan-700",
  PAGA_PARCIAL: "bg-violet-100 text-violet-700",
  PAGA: "bg-emerald-100 text-emerald-700",
};

export function brl(n: number): string {
  return (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function brData(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("pt-BR");
}

// ---------- cores da marca ----------
export const COR_PADRAO = "#4f46e5";

export const PALETA: { nome: string; cor: string }[] = [
  { nome: "Índigo", cor: "#4f46e5" },
  { nome: "Azul", cor: "#2563eb" },
  { nome: "Esmeralda", cor: "#059669" },
  { nome: "Petróleo", cor: "#0f766e" },
  { nome: "Vinho", cor: "#9d174d" },
  { nome: "Coral", cor: "#e11d48" },
  { nome: "Laranja", cor: "#ea580c" },
  { nome: "Roxo", cor: "#7c3aed" },
  { nome: "Grafite", cor: "#334155" },
  { nome: "Preto", cor: "#111827" },
];

export function corValida(c: string | null | undefined): string {
  return typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c) ? c : COR_PADRAO;
}

function hexParaRgb(hex: string): [number, number, number] {
  const h = corValida(hex).slice(1);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbParaHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
// clareia a cor misturando com branco (amt 0..1)
export function clarear(hex: string, amt: number): string {
  const [r, g, b] = hexParaRgb(hex);
  return rgbParaHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}
// retorna a melhor cor de texto (branco ou escuro) para contraste sobre `hex`
export function textoSobre(hex: string): string {
  const [r, g, b] = hexParaRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#0f172a" : "#ffffff";
}
// gradiente do cabeçalho da proposta a partir da cor da marca
export function gradienteMarca(hex: string): string {
  return `linear-gradient(120deg, ${corValida(hex)}, ${clarear(hex, 0.18)})`;
}

export type Item = { descricao: string; qtd: number; unidade: string; preco: number; custo: number };

export function subtotal(itens: Item[]): number {
  return itens.reduce((s, i) => s + i.qtd * i.preco, 0);
}
