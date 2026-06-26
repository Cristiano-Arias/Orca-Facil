export const ST_LABEL: Record<string, string> = {
  RASCUNHO: "Rascunho",
  AGUARDANDO: "Aguardando confirmação",
  ENVIADA: "Enviada",
  VISUALIZADA: "Visualizada",
  NEGOCIACAO: "Em negociação",
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

export type Item = { descricao: string; qtd: number; unidade: string; preco: number; custo: number };

export function subtotal(itens: Item[]): number {
  return itens.reduce((s, i) => s + i.qtd * i.preco, 0);
}
