"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { cadastrar, entrar, type EstadoForm } from "@/app/actions/auth";

function Botao({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primario w-full" disabled={pending}>
      {pending ? "Aguarde…" : texto}
    </button>
  );
}

export default function AuthForm({ modo }: { modo: "entrar" | "cadastrar" }) {
  const action = modo === "entrar" ? entrar : cadastrar;
  const [estado, formAction] = useFormState<EstadoForm, FormData>(action, {});

  return (
    <div className="w-full max-w-md">
      <div className="mb-7 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-marca font-display text-2xl font-bold text-white shadow-lg shadow-marca/40">
          O
        </div>
        <div>
          <div className="font-display text-2xl font-semibold leading-none text-tinta">OrçaChat</div>
          <div className="text-xs uppercase tracking-wider text-tinta-suave">Orçamentos pelo WhatsApp</div>
        </div>
      </div>

      <div className="card p-7">
        <h1 className="mb-1 text-2xl font-semibold text-tinta">
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mb-6 text-sm text-tinta-suave">
          {modo === "entrar"
            ? "Acesse seus orçamentos, clientes e painel."
            : "Comece grátis. Sem cadastro longo — só o essencial."}
        </p>

        <form action={formAction}>
          {modo === "cadastrar" && (
            <>
              <div className="campo">
                <label htmlFor="nome">Seu nome</label>
                <input id="nome" name="nome" autoComplete="name" required />
              </div>
              <div className="campo">
                <label htmlFor="empresa">Nome comercial / empresa (opcional)</label>
                <input id="empresa" name="empresa" placeholder="Ex.: Cristiano Serviços" />
              </div>
            </>
          )}
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              required
            />
          </div>

          {estado?.erro && (
            <div className="mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
              {estado.erro}
            </div>
          )}

          <Botao texto={modo === "entrar" ? "Entrar" : "Criar minha conta"} />
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-tinta-suave">
        {modo === "entrar" ? (
          <>
            Ainda não tem conta?{" "}
            <Link href="/cadastrar" className="font-semibold text-marca hover:underline">
              Criar conta
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <Link href="/entrar" className="font-semibold text-marca hover:underline">
              Entrar
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
