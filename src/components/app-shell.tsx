"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { sair } from "@/app/actions/auth";

const NAV = [
  { href: "/painel", label: "Painel" },
  { href: "/propostas", label: "Propostas" },
  { href: "/clientes", label: "Clientes" },
  { href: "/servicos", label: "Serviços" },
  { href: "/perfil", label: "Meu perfil" },
  { href: "/ajuda", label: "Ajuda" },
];

export default function AppShell({ nome, ehDono = false, children }: { nome: string; ehDono?: boolean; children: React.ReactNode }) {
  const path = usePathname();
  const [aberto, setAberto] = useState(false);
  const nav = ehDono ? [...NAV, { href: "/dono", label: "👑 Painel do dono" }] : NAV;

  return (
    <div className="lg:flex">
      {/* Barra superior — só no celular */}
      <header className="flex items-center gap-3 bg-indigo-950 px-4 py-3 text-white lg:hidden">
        <button
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-marca font-display text-base font-bold">O</div>
          <span className="font-display text-lg font-semibold">OrçaChat</span>
        </div>
      </header>

      {/* Fundo escuro ao abrir o menu (celular) */}
      {aberto && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setAberto(false)} aria-hidden />
      )}

      {/* Menu lateral: gaveta no celular, fixo no computador */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-1 bg-gradient-to-b from-indigo-950 to-indigo-900 p-4 text-indigo-100 transition-transform duration-200 lg:static lg:z-auto lg:h-screen lg:w-60 lg:translate-x-0 ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2 pb-5 pt-1">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-marca font-display text-xl font-bold text-white">
              O
            </div>
            <div>
              <div className="font-display text-lg font-semibold leading-none text-white">OrçaChat</div>
              <div className="text-[10px] uppercase tracking-wider text-indigo-300">Pelo WhatsApp</div>
            </div>
          </div>
          <button onClick={() => setAberto(false)} aria-label="Fechar menu" className="rounded-lg p-1 hover:bg-white/10 lg:hidden">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {nav.map((n) => {
          const ativo = path === n.href || path.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setAberto(false)}
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
