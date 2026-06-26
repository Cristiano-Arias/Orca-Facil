import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import AppShell from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  return <AppShell nome={sessao.nome}>{children}</AppShell>;
}
