import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import { uma } from "@/lib/db";
import { ehDono } from "@/lib/owner";
import AppShell from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  // Sessão órfã: a conta do cookie não existe mais no banco (ex.: criada numa
  // versão anterior). Em vez de erros confusos, encerra e pede login de novo.
  const org = await uma("SELECT 1 FROM orcafacil.organization WHERE id = $1", [sessao.orgId]);
  if (!org) redirect("/sair");

  return (
    <AppShell nome={sessao.nome} ehDono={ehDono(sessao.email)}>
      {children}
    </AppShell>
  );
}
