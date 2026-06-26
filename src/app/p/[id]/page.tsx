import { notFound } from "next/navigation";
import { carregarProposta } from "@/lib/proposal-data";
import ProposalDoc from "@/components/proposal-doc";
import { responderCliente } from "@/app/actions/proposal";
import { ST_LABEL } from "@/lib/proposal-format";

export const dynamic = "force-dynamic";

const FINALIZADAS = ["APROVADA", "RECUSADA", "CONVERTIDA", "PAGA", "PAGA_PARCIAL", "CANCELADA"];

export default async function PaginaCliente({ params }: { params: { id: string } }) {
  const dados = await carregarProposta(params.id);
  if (!dados) notFound();

  const respondida = FINALIZADAS.includes(dados.proposta.status);
  const tel = (dados.perfil.telefone || "").replace(/\D/g, "");
  const zap = tel ? `https://wa.me/55${tel}` : null;

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <ProposalDoc perfil={dados.perfil} proposta={dados.proposta} cliente={dados.cliente} itens={dados.itens} />

        <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-center text-white">
          {respondida ? (
            <div className="text-sm">
              Status atual desta proposta:{" "}
              <b className="font-semibold">{ST_LABEL[dados.proposta.status] ?? dados.proposta.status}</b>
              {dados.proposta.status === "APROVADA" && " — obrigado! 🎉"}
            </div>
          ) : (
            <>
              <div className="mb-3 text-sm opacity-90">O que você gostaria de fazer com esta proposta?</div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <form action={responderCliente}>
                  <input type="hidden" name="id" value={params.id} />
                  <input type="hidden" name="acao" value="aprovar" />
                  <button className="btn bg-verde text-white hover:brightness-110">✓ Aprovar proposta</button>
                </form>
                <form action={responderCliente}>
                  <input type="hidden" name="id" value={params.id} />
                  <input type="hidden" name="acao" value="ajuste" />
                  <button className="btn btn-sec">Solicitar ajuste</button>
                </form>
                <form action={responderCliente}>
                  <input type="hidden" name="id" value={params.id} />
                  <input type="hidden" name="acao" value="recusar" />
                  <button className="btn bg-rose-600 text-white hover:brightness-110">Recusar</button>
                </form>
                {zap && (
                  <a href={zap} target="_blank" rel="noreferrer" className="btn bg-zap text-emerald-950">
                    Falar no WhatsApp
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-tinta-suave">Proposta gerada pelo Orça Fácil</p>
      </div>
    </main>
  );
}
