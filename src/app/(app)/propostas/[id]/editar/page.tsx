import Link from "next/link";
import { notFound } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import { carregarProposta } from "@/lib/proposal-data";
import EditarPropostaForm from "@/components/editar-proposta-form";

export default async function EditarProposta({ params }: { params: { id: string } }) {
  const sessao = await lerSessao();
  const dados = await carregarProposta(params.id, sessao!.orgId);
  if (!dados) notFound();

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <Link href={`/propostas/${params.id}`} className="text-sm text-marca hover:underline">
          ← Voltar para a proposta
        </Link>
        <h2 className="text-xl font-semibold text-tinta">Editar {dados.proposta.numero}</h2>
      </header>
      <div className="px-7 py-6">
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
