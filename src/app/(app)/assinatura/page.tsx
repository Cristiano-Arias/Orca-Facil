import { lerSessao } from "@/lib/auth";
import { uma } from "@/lib/db";
import { PLANOS, TRIAL_DIAS, cobrancaAtiva, situacao, type PerfilAssinatura, type PlanoKey } from "@/lib/billing";
import { brl } from "@/lib/proposal-format";
import { assinar, cancelarAssinatura } from "@/app/actions/billing";

export const dynamic = "force-dynamic";

const AVISO: Record<string, { tipo: "ok" | "erro"; texto: string }> = {
  "1": { tipo: "ok", texto: "Recebemos seu pedido! Assim que o pagamento for confirmado, seu plano é liberado." },
  cancelada: { tipo: "ok", texto: "Assinatura cancelada." },
  plano: { tipo: "erro", texto: "Plano inválido." },
  desligada: { tipo: "erro", texto: "A cobrança ainda não foi ativada. Em breve!" },
  indisponivel: { tipo: "erro", texto: "Pagamento indisponível no momento. Tente novamente em instantes." },
};

export default async function AssinaturaPage({ searchParams }: { searchParams: { ok?: string; erro?: string } }) {
  const sessao = await lerSessao();
  const row = await uma<PerfilAssinatura & { created_at: string }>(
    `SELECT pr.plano, pr.assinatura_status, pr.assinatura_ate, o.created_at
       FROM orcafacil.organization o LEFT JOIN orcafacil.profile pr ON pr.org_id = o.id
      WHERE o.id = $1`,
    [sessao!.orgId]
  );
  const sit = situacao(row, row?.created_at ?? new Date());
  const avisoKey = searchParams?.ok || searchParams?.erro;
  const aviso = avisoKey ? AVISO[avisoKey] : null;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <h2 className="text-xl font-semibold text-tinta">Assinatura</h2>
        <p className="text-sm text-tinta-suave">Seu plano e formas de continuar usando o OrçaChat</p>
      </header>

      <div className="max-w-4xl px-7 py-6">
        {aviso && (
          <div
            className={`mb-5 rounded-xl px-4 py-3 text-sm font-medium ${
              aviso.tipo === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
            }`}
          >
            {aviso.texto}
          </div>
        )}

        {/* situação atual */}
        <div className="card mb-6 p-5">
          <div className="text-sm font-semibold text-tinta">Situação atual</div>
          {sit.modo === "livre" && (
            <p className="mt-1 text-sm text-tinta-suave">
              Você está usando o OrçaChat <b>gratuitamente</b>. A cobrança ainda não está ativa.
            </p>
          )}
          {sit.modo === "trial" && (
            <p className="mt-1 text-sm text-tinta-suave">
              Teste grátis (Degustação): <b>{sit.dias} dia(s)</b> restante(s). Assine para não perder o acesso.
            </p>
          )}
          {sit.modo === "ativa" && (
            <p className="mt-1 text-sm text-emerald-700">
              Plano <b>{PLANOS[sit.plano as PlanoKey]?.nome ?? sit.plano}</b> ativo. 🎉
            </p>
          )}
          {sit.modo === "expirado" && (
            <p className="mt-1 text-sm text-rose-700">Seu teste grátis terminou. Escolha um plano abaixo para continuar.</p>
          )}
        </div>

        {/* planos */}
        <div className="grid gap-5 sm:grid-cols-2">
          {(Object.keys(PLANOS) as PlanoKey[]).map((k) => {
            const p = PLANOS[k];
            const ativo = sit.modo === "ativa" && sit.plano === k;
            return (
              <div key={k} className={`card flex flex-col p-6 ${k === "essencial" ? "ring-2 ring-marca" : ""}`}>
                <h3 className="font-display text-xl font-bold text-tinta">{p.nome}</h3>
                <div className="mt-1 flex items-end gap-1">
                  <span className="font-display text-3xl font-bold text-tinta">{brl(p.preco)}</span>
                  <span className="mb-1 text-sm text-tinta-suave">/mês</span>
                </div>
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
                  <form action={assinar} className="mt-6">
                    <input type="hidden" name="plano" value={k} />
                    <button className={`btn w-full ${k === "essencial" ? "btn-primario" : "btn-sec"}`}>
                      Assinar {p.nome}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        {sit.modo === "ativa" && (
          <form action={cancelarAssinatura} className="mt-5">
            <button className="text-sm text-tinta-suave underline hover:text-rose-600">Cancelar assinatura</button>
          </form>
        )}

        {!cobrancaAtiva() && (
          <p className="mt-6 text-xs text-tinta-suave">
            Pagamento processado pelo Mercado Pago. O teste grátis é de {TRIAL_DIAS} dias.
          </p>
        )}
      </div>
    </>
  );
}
