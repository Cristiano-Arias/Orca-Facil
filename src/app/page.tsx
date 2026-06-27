import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import Landing from "@/components/landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sessao = await lerSessao();
  if (sessao) redirect("/painel");
  // visitante (sem login) vê a página de apresentação
  return <Landing />;
}
