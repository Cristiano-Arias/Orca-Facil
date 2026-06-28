import Link from "next/link";
import NovoOrcamentoForm from "@/components/novo-orcamento-form";
import WhatsAppCta from "@/components/whatsapp-cta";

export default function NovoOrcamentoPage() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <h2 className="text-xl font-semibold text-tinta">Novo orçamento</h2>
        <p className="text-sm text-tinta-suave">Escreva como você falaria no WhatsApp</p>
      </header>
      <div className="max-w-3xl px-7 py-6">
        <div className="mb-5">
          <WhatsAppCta compacto />
        </div>
        <NovoOrcamentoForm />
        <p className="mt-4 text-sm text-tinta-suave">
          <Link href="/propostas" className="font-semibold text-marca hover:underline">
            ← Voltar para propostas
          </Link>
        </p>
      </div>
    </>
  );
}
