import { lerSessao } from "@/lib/auth";
import { q } from "@/lib/db";
import { brl } from "@/lib/proposal-format";

type Linha = {
  id: string;
  nome: string;
  unidade: string;
  preco_padrao: string;
  custo_padrao: string;
  garantia_padrao: string | null;
  historico: number[];
};

export default async function ServicosPage() {
  const sessao = await lerSessao();
  const linhas = await q<Linha>(
    "SELECT id, nome, unidade, preco_padrao, custo_padrao, garantia_padrao, historico FROM orcafacil.service WHERE org_id = $1 ORDER BY created_at DESC",
    [sessao!.orgId]
  );

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <h2 className="text-xl font-semibold text-tinta">Serviços</h2>
        <p className="text-sm text-tinta-suave">Seu catálogo e histórico de preços (aprende com seus orçamentos)</p>
      </header>
      <div className="max-w-5xl px-7 py-6">
        {linhas.length === 0 ? (
          <div className="card p-10 text-center text-tinta-suave">
            Nenhum serviço ainda — eles são cadastrados sozinhos quando você cria orçamentos.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-tinta-suave">
                  <th className="px-4 py-3">Serviço</th>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3 text-right">Preço padrão</th>
                  <th className="px-4 py-3 text-right">Margem est.</th>
                  <th className="px-4 py-3 text-right">Preços salvos</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => {
                  const preco = Number(l.preco_padrao);
                  const custo = Number(l.custo_padrao);
                  const margem = preco ? ((preco - custo) / preco) * 100 : 0;
                  return (
                    <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{l.nome}</div>
                        {l.garantia_padrao && (
                          <div className="text-xs text-tinta-suave">Garantia: {l.garantia_padrao}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">{l.unidade}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{brl(preco)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{margem.toFixed(0)}%</td>
                      <td className="px-4 py-3 text-right tabular-nums">{(l.historico || []).length}</td>
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
