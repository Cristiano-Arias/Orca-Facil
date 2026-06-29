"use client";

import { useMemo, useState } from "react";
import { brl, brData } from "@/lib/proposal-format";

export type ContaDono = {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  onboarded: boolean;
  created_at: string;
  propostas: number;
  valor: number; // valor orçado no período
};

type Ordenar = "recentes" | "propostas" | "valor";

export default function DonoContas({ contas }: { contas: ContaDono[] }) {
  const [busca, setBusca] = useState("");
  const [ordenar, setOrdenar] = useState<Ordenar>("valor");

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    let l = contas.filter(
      (c) =>
        !t ||
        c.nome.toLowerCase().includes(t) ||
        (c.email ?? "").toLowerCase().includes(t) ||
        (c.whatsapp ?? "").includes(t)
    );
    l = [...l].sort((a, b) => {
      if (ordenar === "propostas") return b.propostas - a.propostas;
      if (ordenar === "valor") return b.valor - a.valor;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return l;
  }, [contas, busca, ordenar]);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <span className="text-sm font-semibold text-tinta">Contas ({lista.length})</span>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nome, e-mail ou WhatsApp…"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-marca"
          />
          <select
            value={ordenar}
            onChange={(e) => setOrdenar(e.target.value as Ordenar)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-marca"
          >
            <option value="valor">Maior valor</option>
            <option value="propostas">Mais propostas</option>
            <option value="recentes">Mais recentes</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
              <th className="px-5 py-2">Negócio</th>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2 text-center">Config.</th>
              <th className="px-3 py-2 text-right">Propostas</th>
              <th className="px-3 py-2 text-right">Valor orçado</th>
              <th className="px-3 py-2">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id} className="border-b border-slate-50">
                <td className="px-5 py-2 font-medium text-tinta">{c.nome}</td>
                <td className="px-3 py-2 text-tinta-suave">{c.email || "—"}</td>
                <td className="px-3 py-2 text-center">{c.onboarded ? "✅" : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{c.propostas}</td>
                <td className="px-3 py-2 text-right tabular-nums">{brl(c.valor)}</td>
                <td className="px-3 py-2 text-tinta-suave">{brData(c.created_at)}</td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-tinta-suave">Nenhuma conta encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
