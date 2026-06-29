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

  const status = dados.proposta.status;
  const respondida = FINALIZADAS.includes(status) || status === "NEGOCIACAO";
  const tel = (dados.perfil.telefone || "").replace(/\D/g, "");
  const zap = tel ? `https://wa.me/55${tel}` : null;

  const mensagemResposta: Record<string, string> = {
    APROVADA: "Proposta aprovada — obrigado! 🎉 O profissional já foi avisado.",
    RECUSADA: "Você recusou esta proposta. Obrigado pelo retorno.",
    NEGOCIACAO: "Recebemos seu pedido de ajuste. O profissional vai te retornar em breve. 👍",
    CONVERTIDA: "Proposta aprovada e em execução. 🎉",
    PAGA: "Proposta paga. Obrigado!",
    PAGA_PARCIAL: "Pagamento parcial registrado. Obrigado!",
    CANCELADA: "Esta proposta foi cancelada.",
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {status === "AJUSTADA" && (
          <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-center text-sm text-sky-800">
            ✅ <b>Proposta ajustada!</b> O profissional revisou conforme o seu pedido. Confira abaixo e responda.
          </div>
        )}
        <ProposalDoc perfil={dados.perfil} proposta={dados.proposta} cliente={dados.cliente} itens={dados.itens} />

        <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-white">
          {respondida ? (
            <div className="text-center">
              <div className="text-sm">{mensagemResposta[status] ?? `Status: ${ST_LABEL[status] ?? status}`}</div>
              {zap && (
                <a href={zap} target="_blank" rel="noreferrer" className="btn bg-zap mt-3 text-emerald-950">
                  Falar no WhatsApp
                </a>
              )}
            </div>
          ) : (
            <>
              <div className="mb-3 text-center text-sm opacity-90">O que você gostaria de fazer com esta proposta?</div>
              <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                <form action={responderCliente}>
                  <input type="hidden" name="id" value={params.id} />
                  <input type="hidden" name="acao" value="aprovar" />
                  <button className="btn bg-verde text-white hover:brightness-110">✓ Aprovar proposta</button>
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

              <form action={responderCliente} className="rounded-xl bg-white/10 p-3">
                <input type="hidden" name="id" value={params.id} />
                <input type="hidden" name="acao" value="ajuste" />
                <div className="mb-2 text-sm font-medium">Quer pedir um ajuste? Conte o que mudar:</div>
                <textarea
                  name="nota"
                  rows={2}
                  placeholder="Ex.: pode fazer por R$ 1.100? Ou mudar o prazo para sexta?"
                  className="w-full rounded-lg border-0 px-3 py-2 text-sm text-tinta outline-none"
                />
                <button className="btn btn-sec mt-2 w-full">Solicitar ajuste</button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-tinta-suave">Proposta gerada pelo OrçaChat</p>
      </div>
    </main>
  );
}
