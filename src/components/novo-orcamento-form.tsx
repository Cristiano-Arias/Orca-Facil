"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRef } from "react";
import { criarOrcamento, type EstadoOrcamento } from "@/app/actions/quotes";

const EXEMPLOS = [
  "Orçamento para João, pintura de apartamento, 80 m², R$ 28 por metro, prazo 5 dias, pagamento 50% entrada e 50% na entrega",
  "Cliente Maria, instalação de 2 ar-condicionados split, R$ 650 cada, garantia 90 dias",
  "Proposta para a dona Ana, troca de 6 tomadas, total R$ 480, pagamento no Pix, execução amanhã",
];

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primario" disabled={pending}>
      {pending ? "Montando…" : "Criar orçamento"}
    </button>
  );
}

export default function NovoOrcamentoForm() {
  const [estado, formAction] = useFormState<EstadoOrcamento, FormData>(criarOrcamento, {});
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <form action={formAction} className="card p-6">
      <label htmlFor="texto" className="mb-2 block text-sm font-semibold text-tinta">
        Descreva o serviço numa frase
      </label>
      <textarea
        id="texto"
        name="texto"
        ref={ref}
        rows={4}
        defaultValue={estado?.texto || ""}
        placeholder="Ex.: Orçamento para João, pintura de apartamento, 80 m², R$ 28 por metro, prazo 5 dias, pagamento 50% entrada e 50% na entrega"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-marca focus:ring-2 focus:ring-marca-clara"
      />

      {estado?.erro && (
        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800">
          {estado.erro}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-tinta-suave">
          O OrçaChat entende cliente, serviço, valores e condições — e cria os cadastros sozinho.
        </span>
        <Botao />
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-suave">
          Toque para usar um exemplo
        </div>
        {EXEMPLOS.map((e) => (
          <button
            type="button"
            key={e}
            onClick={() => {
              if (ref.current) {
                ref.current.value = e;
                ref.current.focus();
              }
            }}
            className="mb-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm text-tinta hover:border-marca hover:bg-marca-clara"
          >
            {e}
          </button>
        ))}
      </div>
    </form>
  );
}
