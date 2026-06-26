"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sair } from "@/app/actions/auth";

const NAV = [
  { href: "/painel", label: "Painel" },
  { href: "/propostas", label: "Propostas" },
  { href: "/clientes", label: "Clientes" },
  { href: "/servicos", label: "Serviços" },
  { href: "/perfil", label: "Meu perfil" },
];

export default function AppShell({
  nome,
  children,
}: {
  nome: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 flex-shrink-0 flex-col gap-1 bg-gradient-to-b from-indigo-950 to-indigo-900 p-4 text-indigo-100">
        <div className="flex items-center gap-3 px-2 pb-5 pt-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-marca font-display text-xl font-bold text-white">
            O
          </div>
          <div>
            <div className="font-display text-lg font-semibold leading-none text-white">Orça Fácil</div>
            <div className="text-[10px] uppercase tracking-wider text-indigo-300">Pelo WhatsApp</div>
          </div>
        </div>
        {NAV.map((n) => {
          const ativo = path === n.href || path.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                ativo ? "bg-marca text-white" : "text-indigo-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
        <form action={sair} className="mt-auto px-2 pt-4">
          <div className="mb-2 text-xs text-indigo-300">
            Olá, <b className="text-indigo-100">{nome}</b>
          </div>
          <button className="text-xs text-indigo-300 underline hover:text-white">Sair</button>
        </form>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
