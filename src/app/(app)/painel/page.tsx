import Link from "next/link";
import { lerSessao } from "@/lib/auth";
import { uma } from "@/lib/db";

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
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.rotulo} className="card p-4">
              <div className="text-xs font-medium text-tinta-suave">{k.rotulo}</div>
              <div className="mt-2 font-display text-2xl font-semibold text-tinta">{k.valor}</div>
            </div>
          ))}
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-tinta">Bem-vindo ao Orça Fácil 👋</h3>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-tinta-suave">
            Sua conta está pronta e seus dados ficam salvos na nuvem — acessíveis pelo celular e pelo
            computador com o mesmo login. Nos próximos passos vamos ativar a criação de orçamentos por
            texto, a geração de propostas em PDF, a página do cliente e o assistente do WhatsApp.
          </p>
          <div className="mt-4">
            <Link href="/propostas/novo" className="btn btn-primario">
              + Criar meu primeiro orçamento
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
