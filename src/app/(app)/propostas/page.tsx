import Link from "next/link";
import { lerSessao } from "@/lib/auth";
import { q } from "@/lib/db";
import { totaisPorProposta } from "@/lib/proposal-data";
import { brl, brData, ST_LABEL, ST_CLASSE } from "@/lib/proposal-format";

type Linha = {
  id: string;
  numero: string;
  status: string;
  emitido_em: string;
  desconto: string;
  servico_base: string | null;
  cliente: string | null;
};

export default async function PropostasPage() {
  const sessao = await lerSessao();
  const [linhas, totais] = await Promise.all([
    q<Linha>(
      `SELECT pr.id, pr.numero, pr.status, pr.emitido_em, pr.desconto, pr.servico_base, c.nome AS cliente
         FROM orcafacil.proposal pr
         LEFT JOIN orcafacil.client c ON c.id = pr.client_id
        WHERE pr.org_id = $1
        ORDER BY pr.created_at DESC`,
      [sessao!.orgId]
    ),
    totaisPorProposta(sessao!.orgId),
  ]);

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Propostas</h2>
          <p className="text-sm text-tinta-suave">Suas propostas e status</p>
        </div>
        <Link href="/propostas/novo" className="btn btn-primario">
          + Novo orçamento
        </Link>
      </header>

      <div className="max-w-5xl px-7 py-6">
        {linhas.length === 0 ? (
          <div className="card p-10 text-center text-tinta-suave">
            Você ainda não tem propostas.{" "}
            <Link href="/propostas/novo" className="font-semibold text-marca hover:underline">
              Criar a primeira
            </Link>
            .
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-tinta-suave">
                  <th className="px-4 py-3">Nº</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Serviço</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => {
                  const total = (totais.get(l.id)?.bruto ?? 0) - Number(l.desconto ?? 0);
                  return (
                    <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <Link href={`/propostas/${l.id}`} className="font-semibold text-marca hover:underline">
                          {l.numero}
                        </Link>
                        <div className="text-xs text-tinta-suave">{brData(l.emitido_em)}</div>
                      </td>
                      <td className="px-4 py-3">{l.cliente ?? "—"}</td>
                      <td className="px-4 py-3">{l.servico_base ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{brl(total)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ST_CLASSE[l.status] ?? ""}`}>
                          {ST_LABEL[l.status] ?? l.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
