import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { lerSessao } from "@/lib/auth";
import { carregarProposta } from "@/lib/proposal-data";
import ProposalDoc from "@/components/proposal-doc";
import { BotaoImprimir, CopiarLink } from "@/components/proposal-actions";
import { mudarStatus } from "@/app/actions/proposal";
import { ST_LABEL } from "@/lib/proposal-format";

const STATUS = ["RASCUNHO", "ENVIADA", "VISUALIZADA", "NEGOCIACAO", "APROVADA", "RECUSADA", "CONVERTIDA", "PAGA_PARCIAL", "PAGA", "CANCELADA"];

export default async function PropostaDetalhe({ params }: { params: { id: string } }) {
  const sessao = await lerSessao();
  const dados = await carregarProposta(params.id, sessao!.orgId);
  if (!dados) notFound();

  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const linkCliente = `${proto}://${host}/p/${params.id}`;

  return (
    <>
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[var(--bg)] px-7 py-4 print:hidden">
        <div>
          <Link href="/propostas" className="text-sm text-marca hover:underline">
            ← Propostas
          </Link>
          <h2 className="text-xl font-semibold text-tinta">
            {dados.proposta.numero} ·{" "}
            <span className="text-tinta-suave">{ST_LABEL[dados.proposta.status] ?? dados.proposta.status}</span>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/propostas/${params.id}/editar`} className="btn btn-sec">
            ✏️ Editar
          </Link>
          <CopiarLink url={linkCliente} />
          <BotaoImprimir id={params.id} />
        </div>
      </header>

      <div className="max-w-3xl px-7 py-6">
        {(dados.proposta as any).nota_cliente && dados.proposta.status === "NEGOCIACAO" && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
            <b>✋ O cliente pediu um ajuste:</b> {(dados.proposta as any).nota_cliente}
          </div>
        )}
        <ProposalDoc perfil={dados.perfil} proposta={dados.proposta} cliente={dados.cliente} itens={dados.itens} />

        <form action={mudarStatus} className="mt-5 flex items-center gap-2 print:hidden">
          <input type="hidden" name="id" value={params.id} />
          <label className="text-sm font-medium text-tinta">Status:</label>
          <select
            name="status"
            defaultValue={dados.proposta.status}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca"
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {ST_LABEL[s]}
              </option>
            ))}
          </select>
          <button className="btn btn-sec">Salvar status</button>
          <a href={linkCliente} target="_blank" rel="noreferrer" className="btn btn-sec">
            👁 Ver página do cliente
          </a>
        </form>
      </div>
    </>
  );
}
