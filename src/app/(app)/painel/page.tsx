import Link from "next/link";
import { lerSessao } from "@/lib/auth";
import { uma } from "@/lib/db";
import WhatsAppCta from "@/components/whatsapp-cta";
import { usoDaConta } from "@/lib/limite";
import { ehDono } from "@/lib/owner";

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function contar(sql: string, orgId: string): Promise<number> {
  const row = await uma<{ n: string }>(sql, [orgId]);
  return Number(row?.n ?? 0);
}

export default async function PainelPage() {
  const sessao = await lerSessao();
  const orgId = sessao!.orgId;

  const [propostas, clientes, servicos, rec] = await Promise.all([
    contar("SELECT count(*) AS n FROM orcafacil.proposal WHERE org_id = $1", orgId),
    contar("SELECT count(*) AS n FROM orcafacil.client WHERE org_id = $1", orgId),
    contar("SELECT count(*) AS n FROM orcafacil.service WHERE org_id = $1", orgId),
    uma<{ s: string | null }>(
      "SELECT coalesce(sum(p.valor),0) AS s FROM orcafacil.payment p JOIN orcafacil.proposal pr ON pr.id = p.proposal_id WHERE pr.org_id = $1",
      [orgId]
    ),
  ]);
  const recebido = Number(rec?.s ?? 0);

  // uso/cota da conta (banners de teste, limite do mês e expiração)
  const uso = await usoDaConta(orgId, ehDono(sessao!.email));

  const kpis = [
    { rotulo: "Propostas", valor: String(propostas) },
    { rotulo: "Clientes", valor: String(clientes) },
    { rotulo: "Serviços", valor: String(servicos) },
    { rotulo: "Recebido", valor: brl(recebido) },
  ];

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <h2 className="text-xl font-semibold text-tinta">Painel</h2>
        <p className="text-sm text-tinta-suave">Visão geral do seu comercial</p>
      </header>

      <div className="max-w-5xl px-7 py-6">
        {uso.modo === "trial" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>
              ⏳ Teste grátis: <b>{uso.dias} dia(s)</b> restante(s) · <b>{uso.usados} de {uso.limite}</b> orçamentos usados.
              {uso.bloqueado ? " Você atingiu o limite do teste — assine para continuar." : " Assine para não perder o acesso."}
            </span>
            <Link href="/assinatura" className="btn btn-primario btn-sm">Ver planos</Link>
          </div>
        )}
        {uso.modo === "ativa" && uso.bloqueado && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>📦 Você usou os <b>{uso.limite}</b> orçamentos do seu plano neste mês. Faça upgrade ou aguarde o próximo mês.</span>
            <Link href="/assinatura" className="btn btn-primario btn-sm">Fazer upgrade</Link>
          </div>
        )}
        {uso.modo === "expirado" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <span>🔒 Seu teste grátis terminou. Assine um plano para continuar criando orçamentos.</span>
            <Link href="/assinatura" className="btn btn-primario btn-sm">Assinar agora</Link>
          </div>
        )}

        <div className="mb-6">
          <WhatsAppCta />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.rotulo} className="card p-4">
              <div className="text-xs font-medium text-tinta-suave">{k.rotulo}</div>
              <div className="mt-2 font-display text-2xl font-semibold text-tinta">{k.valor}</div>
            </div>
          ))}
        </div>

        {propostas === 0 ? (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-tinta">Bem-vindo ao OrçaChat 👋</h3>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-tinta-suave">
              Sua conta está pronta e seus dados ficam salvos na nuvem — acessíveis pelo celular e pelo
              computador com o mesmo login. Crie seu primeiro orçamento por texto, pelo WhatsApp ou passo a passo.
            </p>
            <div className="mt-4">
              <Link href="/propostas/novo" className="btn btn-primario">
                + Criar meu primeiro orçamento
              </Link>
            </div>
          </div>
        ) : (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-6">
            <div>
              <h3 className="text-lg font-semibold text-tinta">Tudo pronto para o próximo 🚀</h3>
              <p className="mt-1 text-sm text-tinta-suave">Crie um novo orçamento ou veja os que já enviou.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/propostas/novo" className="btn btn-primario">+ Novo orçamento</Link>
              <Link href="/propostas" className="btn btn-sec">Ver propostas</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
