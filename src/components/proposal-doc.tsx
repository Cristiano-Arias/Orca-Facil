import { brl, brData, gradienteMarca, textoSobre, corValida } from "@/lib/proposal-format";

export type DocPerfil = {
  nome_comercial?: string | null;
  responsavel?: string | null;
  telefone?: string | null;
  email?: string | null;
  documento?: string | null;
  pix?: string | null;
  logo_data_url?: string | null;
  cor?: string | null;
};
export type DocProposta = {
  numero: string;
  prazo?: string | null;
  pagamento?: string | null;
  garantia?: string | null;
  validade_dias: number;
  desconto: number;
  emitido_em: string | Date;
  obs?: string | null;
};
export type DocCliente = { nome: string; telefone?: string | null; endereco?: string | null } | null;
export type DocItem = { descricao: string; qtd: number; unidade: string; preco: number };

export default function ProposalDoc({
  perfil,
  proposta,
  cliente,
  itens,
}: {
  perfil: DocPerfil;
  proposta: DocProposta;
  cliente: DocCliente;
  itens: DocItem[];
}) {
  const bruto = itens.reduce((s, i) => s + i.qtd * i.preco, 0);
  const total = bruto - (proposta.desconto || 0);
  const emitido = new Date(proposta.emitido_em);
  const venc = new Date(emitido);
  venc.setDate(venc.getDate() + (proposta.validade_dias || 7));
  const nome = perfil.nome_comercial || "Profissional";
  const inicial = (nome || "O").trim().charAt(0).toUpperCase();
  const cor = corValida(perfil.cor);
  const txtHead = textoSobre(cor);

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0">
      <div
        className="flex items-start justify-between px-7 py-6"
        style={{ background: gradienteMarca(cor), color: txtHead, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl bg-white/20 font-display text-2xl font-bold">
            {perfil.logo_data_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={perfil.logo_data_url} alt="logo" className="h-full w-full object-cover" />
            ) : (
              inicial
            )}
          </div>
          <div>
            <div className="font-display text-lg font-semibold">{nome}</div>
            {perfil.responsavel && <div className="text-sm opacity-90">{perfil.responsavel}</div>}
            <div className="text-xs opacity-90">
              {perfil.telefone}
              {perfil.email ? ` · ${perfil.email}` : ""}
            </div>
            {perfil.documento && <div className="text-xs opacity-90">{perfil.documento}</div>}
          </div>
        </div>
        <div className="text-right text-xs opacity-95">
          <div>PROPOSTA</div>
          <div className="font-display text-base font-bold">{proposta.numero}</div>
          <div>Emissão: {brData(emitido)}</div>
          <div>Validade: {brData(venc)}</div>
        </div>
      </div>

      <div className="px-7 py-6">
        <div className="mb-5">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Cliente</div>
          <div className="font-semibold">{cliente?.nome || "—"}</div>
          <div className="text-sm text-slate-500">
            {cliente?.telefone || ""}
            {cliente?.endereco ? ` · ${cliente.endereco}` : ""}
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Escopo / itens</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2">Descrição</th>
                <th className="py-2 text-right">Qtd</th>
                <th className="py-2 text-right">Unitário</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i, idx) => (
                <tr key={idx} className="border-b border-slate-50">
                  <td className="py-2">{i.descricao}</td>
                  <td className="py-2 text-right tabular-nums">
                    {i.qtd} {i.unidade}
                  </td>
                  <td className="py-2 text-right tabular-nums">{brl(i.preco)}</td>
                  <td className="py-2 text-right tabular-nums">{brl(i.qtd * i.preco)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ml-auto mt-3 w-64">
            <div className="flex justify-between py-1 text-sm">
              <span>Subtotal</span>
              <span className="tabular-nums">{brl(bruto)}</span>
            </div>
            {proposta.desconto > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span>Desconto</span>
                <span className="tabular-nums">− {brl(proposta.desconto)}</span>
              </div>
            )}
            <div
              className="mt-1 flex justify-between border-t-2 pt-2 font-display text-lg font-bold"
              style={{ borderColor: cor }}
            >
              <span>Total</span>
              <span className="tabular-nums" style={{ color: cor }}>
                {brl(total)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo k="Prazo de execução" v={proposta.prazo || "a combinar"} />
          <Campo k="Pagamento" v={proposta.pagamento || "a combinar"} />
          <Campo k="Garantia" v={proposta.garantia || "—"} />
          <Campo k="Validade" v={`${proposta.validade_dias} dias (até ${brData(venc)})`} />
        </div>

        {proposta.obs && (
          <div className="mt-5">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Observações</div>
            <div className="text-sm">{proposta.obs}</div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-7 py-4 text-center text-xs text-slate-500">
        {nome} · {perfil.telefone || ""}
        {perfil.pix ? ` · Pix: ${perfil.pix}` : ""} — Proposta gerada pelo Orça Fácil
      </div>
    </div>
  );
}

function Campo({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{k}</div>
      <div className="text-sm">{v}</div>
    </div>
  );
}
