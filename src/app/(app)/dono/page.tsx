import { notFound } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import { q, uma } from "@/lib/db";
import { ehDono } from "@/lib/owner";
import { brData } from "@/lib/proposal-format";

export const dynamic = "force-dynamic";

type Conta = {
  id: string;
  org_nome: string;
  created_at: string;
  nome_comercial: string | null;
  whatsapp: string | null;
  onboarded: boolean;
  email: string | null;
  propostas: string;
};

async function n(sql: string): Promise<number> {
  const r = await uma<{ n: string }>(sql);
  return Number(r?.n ?? 0);
}

export default async function PainelDono() {
  const sessao = await lerSessao();
  if (!ehDono(sessao?.email)) notFound(); // área secreta: só o dono

  const [contas, comWhats, ativados, propostas, propostas7, clientes] = await Promise.all([
    n("SELECT count(*) n FROM orcafacil.organization"),
    n("SELECT count(*) n FROM orcafacil.profile WHERE whatsapp IS NOT NULL AND whatsapp <> ''"),
    n("SELECT count(*) n FROM orcafacil.profile WHERE onboarded = true"),
    n("SELECT count(*) n FROM orcafacil.proposal"),
    n("SELECT count(*) n FROM orcafacil.proposal WHERE emitido_em > now() - interval '7 days'"),
    n("SELECT count(*) n FROM orcafacil.client"),
  ]);

  const lista = await q<Conta>(
    `SELECT o.id, o.nome AS org_nome, o.created_at, pr.nome_comercial, pr.whatsapp, pr.onboarded,
            u.email,
            (SELECT count(*) FROM orcafacil.proposal p WHERE p.org_id = o.id) AS propostas
       FROM orcafacil.organization o
       LEFT JOIN orcafacil.profile pr ON pr.org_id = o.id
       LEFT JOIN LATERAL (
         SELECT email FROM orcafacil.app_user au WHERE au.org_id = o.id ORDER BY au.created_at LIMIT 1
       ) u ON true
      ORDER BY o.created_at DESC
      LIMIT 200`
  );

  const kpis = [
    { rotulo: "Contas", valor: String(contas) },
    { rotulo: "Com WhatsApp", valor: String(comWhats) },
    { rotulo: "Configuradas", valor: String(ativados) },
    { rotulo: "Propostas", valor: String(propostas) },
    { rotulo: "Propostas (7 dias)", valor: String(propostas7) },
    { rotulo: "Clientes", valor: String(clientes) },
  ];

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <h2 className="text-xl font-semibold text-tinta">👑 Painel do dono</h2>
        <p className="text-sm text-tinta-suave">Visão geral de todas as contas do OrçaChat (só você vê esta tela)</p>
      </header>

      <div className="px-7 py-6">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.rotulo} className="card p-4">
              <div className="text-xs font-medium text-tinta-suave">{k.rotulo}</div>
              <div className="mt-2 font-display text-2xl font-semibold text-tinta">{k.valor}</div>
            </div>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-tinta">
            Contas cadastradas ({lista.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2">Negócio</th>
                  <th className="px-3 py-2">E-mail</th>
                  <th className="px-3 py-2">WhatsApp</th>
                  <th className="px-3 py-2 text-center">Configurada</th>
                  <th className="px-3 py-2 text-right">Propostas</th>
                  <th className="px-3 py-2">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="px-5 py-2 font-medium text-tinta">{c.nome_comercial || c.org_nome || "—"}</td>
                    <td className="px-3 py-2 text-tinta-suave">{c.email || "—"}</td>
                    <td className="px-3 py-2 text-tinta-suave">{c.whatsapp || "—"}</td>
                    <td className="px-3 py-2 text-center">{c.onboarded ? "✅" : "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.propostas}</td>
                    <td className="px-3 py-2 text-tinta-suave">{brData(c.created_at)}</td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-tinta-suave">Nenhuma conta ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
