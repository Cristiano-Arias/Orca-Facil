"use client";

import { useState } from "react";
import { assinar } from "@/app/actions/billing";

export type PlanoView = {
  key: string;
  nome: string;
  precoFmt: string;
  precoSub?: string; // ex.: "/mês" ou "por 7 dias"
  cotaTexto: string;
  recursos: string[];
  cta?: string; // texto do botão
  teste?: boolean; // card de teste grátis (envia teste=1)
  badge?: string; // rótulo no topo
};

// Grade de planos com seleção visual: ao clicar, o plano escolhido fica azul.
export default function PlanosGrid({
  planos,
  selecaoInicial,
  planoAtivo,
}: {
  planos: PlanoView[];
  selecaoInicial: string;
  planoAtivo: string | null;
}) {
  const [sel, setSel] = useState<string>(planoAtivo ?? selecaoInicial);

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {planos.map((p) => {
        const escolhido = sel === p.key;
        const ativo = planoAtivo === p.key;
        return (
          <div
            key={p.key}
            onClick={() => setSel(p.key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(p.key)}
            className={`card relative flex cursor-pointer flex-col p-6 text-left transition ${
              escolhido ? "ring-2 ring-marca shadow-lg" : "ring-1 ring-transparent hover:ring-slate-200"
            }`}
          >
            {p.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-marca px-3 py-0.5 text-xs font-semibold text-white">
                {p.badge}
              </span>
            )}
            <h3 className="font-display text-xl font-bold text-tinta">{p.nome}</h3>
            <div className="mt-1 flex items-end gap-1">
              <span className="font-display text-3xl font-bold text-tinta">{p.precoFmt}</span>
              <span className="mb-1 text-sm text-tinta-suave">{p.precoSub ?? "/mês"}</span>
            </div>
            <div className="mt-1 text-sm font-medium text-marca">{p.cotaTexto}</div>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-tinta">
              {p.recursos.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="text-marca">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            {ativo ? (
              <div className="btn btn-sec mt-6 w-full cursor-default">Plano atual</div>
            ) : (
              // o form só dispara quando o profissional confirma no botão.
              // stopPropagation: o clique no botão não deve ser "engolido" pela seleção do card.
              <form action={assinar} className="mt-6" onClick={(e) => e.stopPropagation()}>
                {p.teste ? (
                  <input type="hidden" name="teste" value="1" />
                ) : (
                  <input type="hidden" name="plano" value={p.key} />
                )}
                <button type="submit" className={`btn w-full ${escolhido ? "btn-primario" : "btn-sec"}`}>
                  {p.cta ?? `Assinar ${p.nome}`}
                </button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
