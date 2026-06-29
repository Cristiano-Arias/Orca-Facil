"use client";

import { useState } from "react";
import NovoOrcamentoForm from "@/components/novo-orcamento-form";
import NovoOrcamentoGuiado, { type GuiadoDefaults } from "@/components/novo-orcamento-guiado";

export default function NovoOrcamentoTabs({ def }: { def: GuiadoDefaults }) {
  const [modo, setModo] = useState<"frase" | "guiado">("guiado");

  return (
    <div>
      <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setModo("guiado")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${modo === "guiado" ? "bg-marca text-white" : "text-tinta-suave"}`}
        >
          Passo a passo
        </button>
        <button
          type="button"
          onClick={() => setModo("frase")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${modo === "frase" ? "bg-marca text-white" : "text-tinta-suave"}`}
        >
          Escrever em uma frase
        </button>
      </div>

      {modo === "guiado" ? <NovoOrcamentoGuiado def={def} /> : <NovoOrcamentoForm />}
    </div>
  );
}
