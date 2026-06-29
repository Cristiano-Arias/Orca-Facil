import Link from "next/link";
import { lerSessao } from "@/lib/auth";
import { uma } from "@/lib/db";
import NovoOrcamentoTabs from "@/components/novo-orcamento-tabs";
import WhatsAppCta from "@/components/whatsapp-cta";
import type { GuiadoDefaults } from "@/components/novo-orcamento-guiado";

export const dynamic = "force-dynamic";

export default async function NovoOrcamentoPage() {
  const sessao = await lerSessao();
  const def =
    (await uma<GuiadoDefaults>(
      "SELECT prazo_padrao, pagamento_padrao, garantia_padrao, obs_padrao, validade_padrao FROM orcafacil.profile WHERE org_id = $1",
      [sessao!.orgId]
    )) ?? {};

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <h2 className="text-xl font-semibold text-tinta">Novo orçamento</h2>
        <p className="text-sm text-tinta-suave">Preencha passo a passo ou escreva em uma frase</p>
      </header>
      <div className="max-w-3xl px-7 py-6">
        <div className="mb-5">
          <WhatsAppCta compacto />
        </div>
        <NovoOrcamentoTabs def={def} />
        <p className="mt-4 text-sm text-tinta-suave">
          <Link href="/propostas" className="font-semibold text-marca hover:underline">
            ← Voltar para propostas
          </Link>
        </p>
      </div>
    </>
  );
}
