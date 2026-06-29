import { lerSessao } from "@/lib/auth";
import { getPlanos, PLANO_KEYS, PLANO_TESTE, TRIAL_DIAS, type PlanoKey } from "@/lib/billing";
import { usoDaConta } from "@/lib/limite";
import { brl } from "@/lib/proposal-format";
import { cancelarAssinatura } from "@/app/actions/billing";
import { ehDono } from "@/lib/owner";
import PlanosGrid, { type PlanoView } from "@/components/planos-grid";

export const dynamic = "force-dynamic";

const AVISO: Record<string, { tipo: "ok" | "erro"; texto: string }> = {
  "1": { tipo: "ok", texto: "Tudo certo! Seu cartão foi cadastrado. Você tem 7 dias grátis e só é cobrado depois disso." },
  cancelada: { tipo: "ok", texto: "Assinatura cancelada." },
  plano: { tipo: "erro", texto: "Plano inválido." },
  desligada: { tipo: "erro", texto: "A cobrança ainda não foi ativada. Em breve!" },
  indisponivel: { tipo: "erro", texto: "Pagamento indisponível no momento. Tente novamente em instantes." },
  limite: { tipo: "erro", texto: "Você atingiu o limite de orçamentos do seu plano. Escolha um plano maior para continuar." },
};

export default async function AssinaturaPage({ searchParams }: { searchParams: { ok?: string; erro?: string } }) {
  const sessao = await lerSessao();
  const uso = await usoDaConta(sessao!.orgId, ehDono(sessao!.email));
  const planos = await getPlanos();
  const avisoKey = searchParams?.ok || searchParams?.erro;
  const aviso = avisoKey ? AVISO[avisoKey] : null;

  // Card do teste grátis + os 3 planos pagos.
  const pTeste = planos[PLANO_TESTE];
  const cards: PlanoView[] = [
    {
      key: "teste",
      nome: "Teste Grátis",
      precoFmt: "Grátis",
      precoSub: "por 7 dias",
      cotaTexto: `Tudo do plano ${pTeste.nome}`,
      cta: "Começar teste grátis",
      teste: true,
      badge: "Comece aqui",
      recursos: [
        "7 dias grátis, sem pagar nada",
        "Pede o cartão (cancele quando quiser)",
        `Depois, ${brl(pTeste.preco)}/mês (plano ${pTeste.nome})`,
        "Acesso completo durante o teste",
      ],
    },
    ...PLANO_KEYS.map<PlanoView>((k) => ({
      key: k,
      nome: planos[k].nome,
      precoFmt: brl(planos[k].preco),
      cotaTexto: planos[k].cota === null ? "Orçamentos ilimitados" : `${planos[k].cota} orçamentos/mês`,
      recursos: planos[k].recursos,
    })),
  ];

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <h2 className="text-xl font-semibold text-tinta">Assinatura</h2>
        <p className="text-sm text-tinta-suave">Seu plano e formas de continuar usando o OrçaChat</p>
      </header>

      <div className="max-w-6xl px-7 py-6">
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
              Teste grátis: <b>{uso.dias} dia(s)</b> restante(s) — plano{" "}
              <b>{planos[uso.plano as PlanoKey]?.nome ?? uso.plano}</b>
              {uso.limite !== null && <> · {uso.usados} de {uso.limite} orçamentos usados este mês</>}.
            </p>
          )}
          {uso.modo === "ativa" && (
            <p className="mt-1 text-sm text-emerald-700">
              Plano <b>{planos[uso.plano as PlanoKey]?.nome ?? uso.plano}</b> ativo 🎉
              {uso.limite === null ? (
                <> — orçamentos ilimitados.</>
              ) : (
                <> — {uso.usados} de {uso.limite} orçamentos usados este mês.</>
              )}
            </p>
          )}
          {uso.modo === "expirado" && (
            <p className="mt-1 text-sm text-rose-700">
              Para criar orçamentos, comece seu teste grátis de 7 dias ou escolha um plano abaixo.
            </p>
          )}
        </div>

        {/* planos (seleção visual no cliente) */}
        <PlanosGrid
          planos={cards}
          selecaoInicial={uso.modo === "ativa" || uso.modo === "trial" ? (uso.plano ?? "teste") : "teste"}
          planoAtivo={uso.modo === "ativa" ? (uso.plano ?? null) : null}
        />

        {(uso.modo === "ativa" || uso.modo === "trial") && (
          <form action={cancelarAssinatura} className="mt-5">
            <button className="text-sm text-tinta-suave underline hover:text-rose-600">Cancelar assinatura</button>
          </form>
        )}

        <p className="mt-6 text-xs text-tinta-suave">
          Pagamento processado com segurança pelo Mercado Pago. No teste grátis o cartão é cadastrado mas você só é
          cobrado após {TRIAL_DIAS} dias — cancele antes e não paga nada. A cota de orçamentos não acumula (zera todo mês).
        </p>
      </div>
    </>
  );
}
