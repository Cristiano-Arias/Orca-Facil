import { lerSessao } from "@/lib/auth";
import { PLANOS, TRIAL_DIAS, cobrancaAtiva, type PlanoKey } from "@/lib/billing";
import { usoDaConta } from "@/lib/limite";
import { brl } from "@/lib/proposal-format";
import { assinar, cancelarAssinatura } from "@/app/actions/billing";
import { ehDono } from "@/lib/owner";

export const dynamic = "force-dynamic";

const AVISO: Record<string, { tipo: "ok" | "erro"; texto: string }> = {
  "1": { tipo: "ok", texto: "Recebemos seu pedido! Assim que o pagamento for confirmado, seu plano é liberado." },
  cancelada: { tipo: "ok", texto: "Assinatura cancelada." },
  plano: { tipo: "erro", texto: "Plano inválido." },
  desligada: { tipo: "erro", texto: "A cobrança ainda não foi ativada. Em breve!" },
  indisponivel: { tipo: "erro", texto: "Pagamento indisponível no momento. Tente novamente em instantes." },
  limite: { tipo: "erro", texto: "Você atingiu o limite de orçamentos do seu plano. Escolha um plano maior para continuar." },
};

// destaque do plano "recomendado" (o do meio)
const RECOMENDADO: PlanoKey = "profissional";

export default async function AssinaturaPage({ searchParams }: { searchParams: { ok?: string; erro?: string } }) {
  const sessao = await lerSessao();
  const uso = await usoDaConta(sessao!.orgId, ehDono(sessao!.email));
  const avisoKey = searchParams?.ok || searchParams?.erro;
  const aviso = avisoKey ? AVISO[avisoKey] : null;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <h2 className="text-xl font-semibold text-tinta">Assinatura</h2>
        <p className="text-sm text-tinta-suave">Seu plano e formas de continuar usando o OrçaChat</p>
      </header>

      <div className="max-w-5xl px-7 py-6">
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
          {uso.modo === "livre" && (
            <p className="mt-1 text-sm text-tinta-suave">
              Você está usando o OrçaChat <b>gratuitamente</b>. A cobrança ainda não está ativa.
            </p>
          )}
          {uso.modo === "trial" && (
            <p className="mt-1 text-sm text-tinta-suave">
              Teste grátis: <b>{uso.dias} dia(s)</b> restante(s) — você já usou <b>{uso.usados} de {uso.limite}</b> orçamentos.
            </p>
          )}
          {uso.modo === "ativa" && (
            <p className="mt-1 text-sm text-emerald-700">
              Plano <b>{PLANOS[uso.plano as PlanoKey]?.nome ?? uso.plano}</b> ativo 🎉
              {uso.limite === null ? (
                <> — orçamentos ilimitados.</>
              ) : (
                <> — {uso.usados} de {uso.limite} orçamentos usados este mês.</>
              )}
            </p>
          )}
          {uso.modo === "expirado" && (
            <p className="mt-1 text-sm text-rose-700">Seu teste grátis terminou. Escolha um plano abaixo para continuar.</p>
          )}
        </div>

        {/* planos */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(PLANOS) as PlanoKey[]).map((k) => {
            const p = PLANOS[k];
            const ativo = uso.modo === "ativa" && uso.plano === k;
            const destaque = k === RECOMENDADO;
            return (
              <div key={k} className={`card relative flex flex-col p-6 ${destaque ? "ring-2 ring-marca" : ""}`}>
                {destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-marca px-3 py-0.5 text-xs font-semibold text-white">
                    Mais escolhido
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-tinta">{p.nome}</h3>
                <div className="mt-1 flex items-end gap-1">
                  <span className="font-display text-3xl font-bold text-tinta">{brl(p.preco)}</span>
                  <span className="mb-1 text-sm text-tinta-suave">/mês</span>
                </div>
                <div className="mt-1 text-sm font-medium text-marca">
                  {p.cota === null ? "Orçamentos ilimitados" : `${p.cota} orçamentos/mês`}
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
                    <button className={`btn w-full ${destaque ? "btn-primario" : "btn-sec"}`}>
                      Assinar {p.nome}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        {uso.modo === "ativa" && (
          <form action={cancelarAssinatura} className="mt-5">
            <button className="text-sm text-tinta-suave underline hover:text-rose-600">Cancelar assinatura</button>
          </form>
        )}

        <p className="mt-6 text-xs text-tinta-suave">
          Pagamento processado com segurança pelo Mercado Pago. A cota de orçamentos não acumula — zera no início de cada mês.
          {!cobrancaAtiva() && <> O teste grátis é de {TRIAL_DIAS} dias.</>}
        </p>
      </div>
    </>
  );
}
