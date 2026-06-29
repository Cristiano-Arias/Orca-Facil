import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import { uma } from "@/lib/db";
import { ehDono } from "@/lib/owner";
import AppShell from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  // Busca o perfil: serve para (1) detectar sessão órfã e (2) mostrar o nome
  // sempre atualizado conforme o perfil (sem precisar sair e entrar de novo).
  const perfil = await uma<{ nome_comercial: string | null; responsavel: string | null }>(
    "SELECT nome_comercial, responsavel FROM orcafacil.profile WHERE org_id = $1",
    [sessao.orgId]
  );
  if (!perfil) redirect("/sair"); // conta do cookie não existe mais no banco

  const nomeExibicao = perfil.responsavel?.trim() || perfil.nome_comercial?.trim() || sessao.nome;

  return (
    <AppShell nome={nomeExibicao} ehDono={ehDono(sessao.email)}>
      {children}
    </AppShell>
  );
}
