import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import { uma } from "@/lib/db";
import OnboardingForm, { type OnboardingDados } from "@/components/onboarding-form";

export const dynamic = "force-dynamic";

export default async function BemVindoPage() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  const dados =
    (await uma<OnboardingDados & { onboarded: boolean }>(
      "SELECT whatsapp, pagamento_padrao, garantia_padrao, prazo_padrao, obs_padrao, validade_padrao, onboarded FROM orcafacil.profile WHERE org_id = $1",
      [sessao!.orgId]
    )) ?? ({} as OnboardingDados & { onboarded: boolean });

  // já concluiu o assistente? vai direto para o painel
  if (dados.onboarded) redirect("/painel");

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-marca font-display text-xl font-bold text-white">
          O
        </div>
        <h1 className="font-display text-3xl font-bold text-tinta">Bem-vindo ao OrçaChat! 👋</h1>
        <p className="mt-2 text-tinta-suave">
          Responda rapidinho para os seus orçamentos já saírem <strong>completos e do seu jeito</strong>. Leva 1 minuto.
        </p>
      </div>
      <OnboardingForm dados={dados} />
    </div>
  );
}
