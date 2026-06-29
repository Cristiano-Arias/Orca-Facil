"use client";

import { useRef, useState } from "react";
import { criarOrcamentoManual } from "@/app/actions/quotes";
import { brl } from "@/lib/proposal-format";

type Item = { descricao: string; qtd: number; unidade: string; preco: number };

export type GuiadoDefaults = {
  prazo_padrao?: string | null;
  pagamento_padrao?: string | null;
  garantia_padrao?: string | null;
  obs_padrao?: string | null;
  validade_padrao?: number | null;
};

export default function NovoOrcamentoGuiado({ def }: { def: GuiadoDefaults }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [itens, setItens] = useState<Item[]>([{ descricao: "", qtd: 1, unidade: "un", preco: 0 }]);
  const [desconto, setDesconto] = useState(0);
  const [prazo, setPrazo] = useState(def.prazo_padrao ?? "");
  const [pagamento, setPagamento] = useState(def.pagamento_padrao ?? "");
  const [erro, setErro] = useState<string>("");
  const [faltando, setFaltando] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  function set(i: number, campo: keyof Item, valor: string) {
    setItens((arr) => {
      const c = [...arr];
      (c[i] as any)[campo] = campo === "qtd" || campo === "preco" ? Number(valor.replace(",", ".")) || 0 : valor;
      return c;
    });
  }
  const add = () => setItens((a) => [...a, { descricao: "", qtd: 1, unidade: "un", preco: 0 }]);
  const rm = (i: number) => setItens((a) => (a.length > 1 ? a.filter((_, j) => j !== i) : a));

  const subtotal = itens.reduce((s, i) => s + (i.qtd || 0) * (i.preco || 0), 0);
  const total = Math.max(0, subtotal - (desconto || 0));

  function enviar() {
    setEnviando(true);
    setFaltando([]);
    formRef.current?.requestSubmit();
  }

  function tentar() {
    setErro("");
    setFaltando([]);
    const cliente = (formRef.current?.elements.namedItem("cliente_nome") as HTMLInputElement)?.value.trim();
    const itensValidos = itens.filter((i) => i.descricao.trim());
    // essenciais que não dá para criar sem
    if (!cliente) return setErro("Informe o nome do cliente.");
    if (itensValidos.length === 0) return setErro("Adicione pelo menos um serviço.");

    // essenciais que podem faltar — perguntamos se pode finalizar assim
    const falta: string[] = [];
    if (itensValidos.some((i) => !(i.preco > 0))) falta.push("valor de algum serviço");
    if (!prazo.trim()) falta.push("prazo de entrega");
    if (!pagamento.trim()) falta.push("forma de pagamento");

    if (falta.length) {
      setFaltando(falta);
      return; // mostra a confirmação "pode finalizar sem?"
    }
    enviar();
  }

  return (
    <form ref={formRef} action={criarOrcamentoManual} className="max-w-3xl">
      <input type="hidden" name="itens" value={JSON.stringify(itens)} />
      <input type="hidden" name="prazo" value={prazo} />
      <input type="hidden" name="pagamento" value={pagamento} />

      {/* Cliente */}
      <div className="card mb-4 p-5">
        <div className="mb-3 text-sm font-semibold text-tinta">Cliente</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="campo mb-0">
            <label>Nome do cliente *</label>
            <input name="cliente_nome" placeholder="Ex.: Maria Silva" />
          </div>
          <div className="campo mb-0">
            <label>Telefone (opcional)</label>
            <input name="cliente_telefone" placeholder="(85) 99999-9999" />
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="card mb-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-tinta">Serviços e valores *</span>
          <button type="button" className="btn btn-sec btn-sm" onClick={add}>
            + Adicionar serviço
          </button>
        </div>
        <div className="space-y-3">
          {itens.map((it, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-xl bg-slate-50 p-3">
              <div className="col-span-12 sm:col-span-5">
                <label className="mb-1 block text-xs font-semibold text-tinta-suave">Serviço</label>
                <input
                  value={it.descricao}
                  onChange={(e) => set(i, "descricao", e.target.value)}
                  placeholder="Ex.: Pintura de apartamento"
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-marca"
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-tinta-suave">Qtd</label>
                <input type="number" step="any" value={it.qtd} onChange={(e) => set(i, "qtd", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-marca" />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-tinta-suave">Unid.</label>
                <input value={it.unidade} onChange={(e) => set(i, "unidade", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-marca" />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-tinta-suave">Valor (R$)</label>
                <input type="number" step="any" value={it.preco} onChange={(e) => set(i, "preco", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-marca" />
              </div>
              <div className="col-span-2 sm:col-span-1 flex justify-end">
                <button type="button" onClick={() => rm(i)} title="Remover" className="rounded-lg px-2 py-2 text-rose-600 hover:bg-rose-50">✕</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 ml-auto w-64 text-sm">
          <div className="flex justify-between py-1"><span>Subtotal</span><span className="tabular-nums">{brl(subtotal)}</span></div>
          <div className="flex items-center justify-between py-1">
            <span>Desconto (R$)</span>
            <input type="number" step="any" value={desconto} name="desconto"
              onChange={(e) => setDesconto(Number(e.target.value.replace(",", ".")) || 0)}
              className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm outline-none focus:border-marca" />
          </div>
          <div className="mt-1 flex justify-between border-t-2 border-slate-800 pt-2 font-display text-lg font-bold">
            <span>Total</span><span className="tabular-nums">{brl(total)}</span>
          </div>
        </div>
      </div>

      {/* Condições */}
      <div className="card mb-4 p-5">
        <div className="mb-3 text-sm font-semibold text-tinta">Condições</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="campo mb-0">
            <label>Prazo de entrega</label>
            <input value={prazo} onChange={(e) => setPrazo(e.target.value)} placeholder="Ex.: 5 dias úteis" />
          </div>
          <div className="campo mb-0">
            <label>Forma de pagamento</label>
            <input value={pagamento} onChange={(e) => setPagamento(e.target.value)} placeholder="Ex.: 50% entrada e 50% na entrega" />
          </div>
          <div className="campo mb-0"><label>Garantia</label><input name="garantia" defaultValue={def.garantia_padrao ?? ""} placeholder="Ex.: 90 dias" /></div>
          <div className="campo mb-0"><label>Validade (dias)</label><input name="validade_dias" type="number" defaultValue={def.validade_padrao ?? 7} /></div>
        </div>
        <div className="campo mb-0 mt-3">
          <label>Observações</label>
          <textarea name="obs" rows={2} defaultValue={def.obs_padrao ?? ""} placeholder="Ex.: Inclui material e mão de obra" />
        </div>
      </div>

      {erro && <div className="mb-3 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{erro}</div>}

      {/* Confirmação: pode finalizar sem o campo que falta? */}
      {faltando.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="font-semibold">Faltou: {faltando.join(", ")}.</div>
          <div className="mt-1">Quer finalizar assim mesmo ou voltar e preencher?</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primario" disabled={enviando} onClick={enviar}>
              {enviando ? "Finalizando…" : "Finalizar assim mesmo"}
            </button>
            <button type="button" className="btn btn-sec" onClick={() => setFaltando([])}>
              Voltar e preencher
            </button>
          </div>
        </div>
      )}

      {faltando.length === 0 && (
        <button type="button" className="btn btn-primario" disabled={enviando} onClick={tentar}>
          {enviando ? "Criando…" : "Criar orçamento"}
        </button>
      )}
    </form>
  );
}
