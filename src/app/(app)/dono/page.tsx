import Link from "next/link";
import { notFound } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import { q } from "@/lib/db";
import { ehDono } from "@/lib/owner";
import { brl } from "@/lib/proposal-format";
import DonoContas, { type ContaDono } from "@/components/dono-contas";

export const dynamic = "force-dynamic";

const APROVADOS = ["APROVADA", "CONVERTIDA", "PAGA", "PAGA_PARCIAL"];

type PropLinha = { org_id: string; status: string; desconto: string; emitido_em: string; bruto: string };
type ContaLinha = { id: string; nome: string; email: string | null; whatsapp: string | null; onboarded: boolean; created_at: string };

function n(v: unknown) {
  return Number(v ?? 0) || 0;
}

export default async function PainelDono({ searchParams }: { searchParams: { p?: string } }) {
  const sessao = await lerSessao();
  if (!ehDono(sessao?.email)) notFound(); // só o dono

  const periodo = searchParams?.p === "7" ? 7 : searchParams?.p === "tudo" ? 0 : 30;
  const desde = periodo === 0 ? new Date("2000-01-01") : new Date(Date.now() - periodo * 864e5);
  const desdeISO = desde.toISOString();

  // propostas do período (com valor bruto por proposta)
  const props = await q<PropLinha>(
    `SELECT p.org_id, p.status, p.desconto, p.emitido_em,
            COALESCE((SELECT sum(i.qtd*i.preco) FROM orcafacil.proposal_item i WHERE i.proposal_id = p.id),0) AS bruto
       FROM orcafacil.proposal p
      WHERE p.emitido_em >= $1`,
    [desdeISO]
  );
  const contasBase = await q<ContaLinha>(
    `SELECT o.id, COALESCE(NULLIF(pr.nome_comercial,''), o.nome) AS nome, pr.whatsapp, pr.onboarded, o.created_at,
            (SELECT email FROM orcafacil.app_user au WHERE au.org_id = o.id ORDER BY au.created_at LIMIT 1) AS email
       FROM orcafacil.organization o
       LEFT JOIN orcafacil.profile pr ON pr.org_id = o.id
      ORDER BY o.created_at DESC`
  );

  // agregações financeiras
  let valorTotal = 0, valorAprovado = 0, qtdAprovadas = 0;
  const porConta = new Map<string, { propostas: number; valor: number }>();
  const porDia = new Map<string, number>();
  const ini14 = Date.now() - 13 * 864e5;
  for (const p of props) {
    const liquido = Math.max(0, n(p.bruto) - n(p.desconto));
    valorTotal += liquido;
    if (APROVADOS.includes(p.status)) {
      valorAprovado += liquido;
      qtdAprovadas++;
    }
    const c = porConta.get(p.org_id) ?? { propostas: 0, valor: 0 };
    c.propostas++;
    c.valor += liquido;
    porConta.set(p.org_id, c);
    const d = new Date(p.emitido_em);
    if (d.getTime() >= ini14) {
      const k = d.toISOString().slice(0, 10);
      porDia.set(k, (porDia.get(k) ?? 0) + 1);
    }
  }
  const qtdProp = props.length;
  const ticket = qtdProp ? valorTotal / qtdProp : 0;
  const taxa = qtdProp ? Math.round((qtdAprovadas / qtdProp) * 100) : 0;

  const contas: ContaDono[] = contasBase.map((c) => ({
    id: c.id,
    nome: c.nome || "—",
    email: c.email,
    whatsapp: c.whatsapp,
    onboarded: !!c.onboarded,
    created_at: String(c.created_at),
    propostas: porConta.get(c.id)?.propostas ?? 0,
    valor: porConta.get(c.id)?.valor ?? 0,
  }));

  // série do gráfico (14 dias)
  const dias: { dia: string; n: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const k = d.toISOString().slice(0, 10);
    dias.push({ dia: `${d.getDate()}/${d.getMonth() + 1}`, n: porDia.get(k) ?? 0 });
  }
  const maxDia = Math.max(1, ...dias.map((d) => d.n));

  const kpis = [
    { rotulo: "Contas", valor: String(contasBase.length) },
    { rotulo: "Propostas", valor: String(qtdProp) },
    { rotulo: "Valor orçado", valor: brl(valorTotal) },
    { rotulo: "Valor fechado", valor: brl(valorAprovado) },
    { rotulo: "Ticket médio", valor: brl(ticket) },
    { rotulo: "Taxa de aprovação", valor: `${taxa}%` },
  ];

  const periodos = [
    { k: "7", label: "7 dias" },
    { k: "30", label: "30 dias" },
    { k: "tudo", label: "Desde o início" },
  ];
  const atual = periodo === 7 ? "7" : periodo === 0 ? "tudo" : "30";

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <h2 className="text-xl font-semibold text-tinta">👑 Painel do dono</h2>
        <p className="text-sm text-tinta-suave">Visão geral do OrçaChat — uso e indicadores (só você vê esta tela)</p>
      </header>

      <div className="px-7 py-6">
        {/* filtro de período */}
        <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {periodos.map((pp) => (
            <Link
              key={pp.k}
              href={`/dono?p=${pp.k}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${atual === pp.k ? "bg-marca text-white" : "text-tinta-suave hover:text-marca"}`}
            >
              {pp.label}
            </Link>
          ))}
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.rotulo} className="card p-4">
              <div className="text-xs font-medium text-tinta-suave">{k.rotulo}</div>
              <div className="mt-2 font-display text-xl font-semibold text-tinta">{k.valor}</div>
            </div>
          ))}
        </div>

        {/* gráfico: propostas por dia (14 dias) */}
        <div className="card mb-6 p-5">
          <div className="mb-4 text-sm font-semibold text-tinta">Propostas por dia (últimos 14 dias)</div>
          <div className="flex h-40 items-end gap-1.5">
            {dias.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-marca/80"
                    style={{ height: `${(d.n / maxDia) * 100}%`, minHeight: d.n > 0 ? 4 : 0 }}
                    title={`${d.n} proposta(s)`}
                  />
                </div>
                <div className="text-[10px] text-tinta-suave">{d.dia}</div>
              </div>
            ))}
          </div>
        </div>

        {/* tabela interativa */}
        <DonoContas contas={contas} />
      </div>
    </>
  );
}
