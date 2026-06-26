"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { atualizarProposta } from "@/app/actions/proposal";
import { brl } from "@/lib/proposal-format";

type Item = { descricao: string; qtd: number; unidade: string; preco: number };

export type DadosEdicao = {
  id: string;
  prazo?: string | null;
  pagamento?: string | null;
  garantia?: string | null;
  validade_dias: number;
  desconto: number;
  obs?: string | null;
  cliente_nome: string;
  cliente_telefone?: string | null;
  itens: Item[];
};

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primario" disabled={pending}>
      {pending ? "Salvando…" : "Salvar alterações"}
    </button>
  );
}

export default function EditarPropostaForm({ dados }: { dados: DadosEdicao }) {
  const [itens, setItens] = useState<Item[]>(
    dados.itens.length ? dados.itens : [{ descricao: "", qtd: 1, unidade: "un", preco: 0 }]
  );
  const [desconto, setDesconto] = useState<number>(dados.desconto || 0);

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

  return (
    <form action={atualizarProposta} className="max-w-3xl">
      <input type="hidden" name="id" value={dados.id} />
      <input type="hidden" name="itens" value={JSON.stringify(itens)} />

      <div className="card mb-4 p-5">
        <div className="mb-3 text-sm font-semibold text-tinta">Cliente</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="campo mb-0">
            <label>Nome</label>
            <input name="cliente_nome" defaultValue={dados.cliente_nome} />
          </div>
          <div className="campo mb-0">
            <label>Telefone</label>
            <input name="cliente_telefone" defaultValue={dados.cliente_telefone ?? ""} />
          </div>
        </div>
      </div>

      <div className="card mb-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-tinta">Itens / serviços</span>
          <button type="button" className="btn btn-sec btn-sm" onClick={add}>
            + Adicionar item
          </button>
        </div>

        <div className="space-y-3">
          {itens.map((it, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-xl bg-slate-50 p-3">
              <div className="col-span-12 sm:col-span-5">
                <label className="mb-1 block text-xs font-semibold text-tinta-suave">Descrição</label>
                <input
                  value={it.descricao}
                  onChange={(e) => set(i, "descricao", e.target.value)}
                  placeholder="Ex.: Instalação de ar-condicionado"
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-marca"
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-tinta-suave">Qtd</label>
                <input
                  type="number" step="any" value={it.qtd}
                  onChange={(e) => set(i, "qtd", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-marca"
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-tinta-suave">Unid.</label>
                <input
                  value={it.unidade}
                  onChange={(e) => set(i, "unidade", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-marca"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-tinta-suave">Unitário (R$)</label>
                <input
                  type="number" step="any" value={it.preco}
                  onChange={(e) => set(i, "preco", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-marca"
                />
              </div>
              <div className="col-span-2 sm:col-span-1 flex justify-end">
                <button
                  type="button" onClick={() => rm(i)} title="Remover"
                  className="rounded-lg px-2 py-2 text-rose-600 hover:bg-rose-50"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 ml-auto w-64 text-sm">
          <div className="flex justify-between py-1"><span>Subtotal</span><span className="tabular-nums">{brl(subtotal)}</span></div>
          <div className="flex items-center justify-between py-1">
            <span>Desconto (R$)</span>
            <input
              type="number" step="any" value={desconto}
              onChange={(e) => setDesconto(Number(e.target.value.replace(",", ".")) || 0)}
              name="desconto"
              className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm outline-none focus:border-marca"
            />
          </div>
          <div className="mt-1 flex justify-between border-t-2 border-slate-800 pt-2 font-display text-lg font-bold">
            <span>Total</span><span className="tabular-nums">{brl(total)}</span>
          </div>
        </div>
      </div>

      <div className="card mb-4 p-5">
        <div className="mb-3 text-sm font-semibold text-tinta">Condições</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="campo mb-0"><label>Prazo de execução</label><input name="prazo" defaultValue={dados.prazo ?? ""} /></div>
          <div className="campo mb-0"><label>Pagamento</label><input name="pagamento" defaultValue={dados.pagamento ?? ""} /></div>
          <div className="campo mb-0"><label>Garantia</label><input name="garantia" defaultValue={dados.garantia ?? ""} /></div>
          <div className="campo mb-0"><label>Validade (dias)</label><input name="validade_dias" type="number" defaultValue={dados.validade_dias} /></div>
        </div>
        <div className="campo mb-0 mt-3">
          <label>Observações</label>
          <textarea name="obs" rows={3} defaultValue={dados.obs ?? ""} />
        </div>
      </div>

      <div className="flex gap-2">
        <Salvar />
        <a href={`/propostas/${dados.id}`} className="btn btn-sec">Cancelar</a>
      </div>
    </form>
  );
}
