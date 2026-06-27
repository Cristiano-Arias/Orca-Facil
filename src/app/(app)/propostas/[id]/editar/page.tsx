import Link from "next/link";
import { notFound } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import { carregarProposta } from "@/lib/proposal-data";
import EditarPropostaForm from "@/components/editar-proposta-form";

export default async function EditarProposta({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { novo?: string };
}) {
  const sessao = await lerSessao();
  const dados = await carregarProposta(params.id, sessao!.orgId);
  if (!dados) notFound();
  const novo = searchParams?.novo === "1";

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <Link href={`/propostas/${params.id}`} className="text-sm text-marca hover:underline">
          ← Voltar para a proposta
        </Link>
        <h2 className="text-xl font-semibold text-tinta">
          {novo ? "Confira a proposta" : "Editar"} {dados.proposta.numero}
        </h2>
      </header>
      <div className="px-7 py-6">
        {novo && (
          <div className="mb-5 max-w-3xl rounded-xl border border-marca/30 bg-marca-clara px-4 py-3 text-sm text-tinta">
            <strong>Confira antes de enviar.</strong> Montei a proposta a partir da sua mensagem.
            Revise os itens, quantidades e valores abaixo, ajuste o que precisar e toque em{" "}
            <em>Salvar</em>. Assim a proposta fica exatamente como você quer. 👇
          </div>
        )}
        <EditarPropostaForm
          dados={{
            id: params.id,
            prazo: dados.proposta.prazo,
            pagamento: dados.proposta.pagamento,
            garantia: dados.proposta.garantia,
            validade_dias: dados.proposta.validade_dias,
            desconto: dados.proposta.desconto,
            obs: dados.proposta.obs,
            cliente_nome: dados.cliente?.nome ?? "",
            cliente_telefone: dados.cliente?.telefone ?? "",
            itens: dados.itens.map((i) => ({ descricao: i.descricao, qtd: i.qtd, unidade: i.unidade, preco: i.preco })),
          }}
        />
      </div>
    </>
  );
}
