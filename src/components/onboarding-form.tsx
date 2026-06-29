"use client";

import { useFormState, useFormStatus } from "react-dom";
import { salvarOnboarding, pularOnboarding, type EstadoPerfil } from "@/app/actions/profile";

export type OnboardingDados = {
  whatsapp?: string | null;
  pagamento_padrao?: string | null;
  garantia_padrao?: string | null;
  prazo_padrao?: string | null;
  obs_padrao?: string | null;
  validade_padrao?: number | null;
};

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primario w-full" disabled={pending}>
      {pending ? "Salvando…" : "Salvar e começar a usar"}
    </button>
  );
}

export default function OnboardingForm({ dados }: { dados: OnboardingDados }) {
  const [estado, formAction] = useFormState<EstadoPerfil, FormData>(salvarOnboarding, {});

  return (
    <div className="space-y-3">
      <form action={formAction} className="card space-y-4 p-6">
        {/* WhatsApp pessoal */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <label className="mb-1 block text-sm font-semibold text-emerald-900">
            📱 Seu WhatsApp (de onde você manda os pedidos)
          </label>
          <input
            name="whatsapp"
            defaultValue={dados.whatsapp ?? ""}
            placeholder="Ex.: (85) 99999-9999"
            className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
          />
          <p className="mt-1 text-xs text-emerald-800">
            É por ele que o OrçaChat vai te reconhecer quando você mandar mensagem.
          </p>
        </div>

        <div className="campo mb-0">
          <label>Forma de pagamento padrão</label>
          <input
            name="pagamento_padrao"
            defaultValue={dados.pagamento_padrao ?? ""}
            placeholder="Ex.: 50% de entrada e 50% na entrega"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="campo mb-0">
            <label>Garantia padrão</label>
            <input name="garantia_padrao" defaultValue={dados.garantia_padrao ?? ""} placeholder="Ex.: 90 dias" />
          </div>
          <div className="campo mb-0">
            <label>Prazo de execução padrão</label>
            <input name="prazo_padrao" defaultValue={dados.prazo_padrao ?? ""} placeholder="Ex.: 5 dias úteis" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="campo mb-0">
            <label>Validade da proposta (dias)</label>
            <input name="validade_padrao" type="number" defaultValue={dados.validade_padrao ?? 7} />
          </div>
          <div className="campo mb-0">
            <label>O que está incluso (observação)</label>
            <input name="obs_padrao" defaultValue={dados.obs_padrao ?? ""} placeholder="Ex.: Inclui material e mão de obra" />
          </div>
        </div>

        <p className="text-xs text-tinta-suave">
          Esses padrões entram automaticamente em todo orçamento — você sempre pode mudar em cada proposta. Pode
          deixar em branco o que não se aplica.
        </p>

        {estado?.erro && (
          <div className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{estado.erro}</div>
        )}

        <Salvar />
      </form>

      <form action={pularOnboarding} className="text-center">
        <button className="text-sm text-tinta-suave underline hover:text-tinta">Pular por agora</button>
      </form>
    </div>
  );
}
