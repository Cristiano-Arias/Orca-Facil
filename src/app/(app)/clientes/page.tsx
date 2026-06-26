import { lerSessao } from "@/lib/auth";
import { q } from "@/lib/db";
import { totaisPorProposta } from "@/lib/proposal-data";
import { brl } from "@/lib/proposal-format";

type Cli = { id: string; nome: string; telefone: string | null };
type Prop = { id: string; client_id: string | null; desconto: string };

export default async function ClientesPage() {
  const sessao = await lerSessao();
  const [clientes, props, totais] = await Promise.all([
    q<Cli>("SELECT id, nome, telefone FROM orcafacil.client WHERE org_id = $1 ORDER BY created_at DESC", [
      sessao!.orgId,
    ]),
    q<Prop>("SELECT id, client_id, desconto FROM orcafacil.proposal WHERE org_id = $1", [sessao!.orgId]),
    totaisPorProposta(sessao!.orgId),
  ]);

  // agrega por cliente em memória (simples e portável)
  const agg = new Map<string, { props: number; negociado: number; recebido: number }>();
  for (const p of props) {
    if (!p.client_id) continue;
    const t = totais.get(p.id) ?? { bruto: 0, recebido: 0 };
    const a = agg.get(p.client_id) ?? { props: 0, negociado: 0, recebido: 0 };
    a.props += 1;
    a.negociado += t.bruto - Number(p.desconto ?? 0);
    a.recebido += t.recebido;
    agg.set(p.client_id, a);
  }

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <h2 className="text-xl font-semibold text-tinta">Clientes</h2>
        <p className="text-sm text-tinta-suave">Criados automaticamente pelos seus orçamentos</p>
      </header>
      <div className="max-w-5xl px-7 py-6">
        {clientes.length === 0 ? (
          <div className="card p-10 text-center text-tinta-suave">
            Nenhum cliente ainda — eles aparecem sozinhos quando você cria orçamentos.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-tinta-suave">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3 text-right">Propostas</th>
                  <th className="px-4 py-3 text-right">Negociado</th>
                  <th className="px-4 py-3 text-right">Recebido</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => {
                  const a = agg.get(c.id) ?? { props: 0, negociado: 0, recebido: 0 };
                  return (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold">{c.nome}</td>
                      <td className="px-4 py-3">{c.telefone || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{a.props}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{brl(a.negociado)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{brl(a.recebido)}</td>
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
