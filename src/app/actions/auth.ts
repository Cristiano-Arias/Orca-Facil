"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { q, uma } from "@/lib/db";
import { hashSenha, conferirSenha, criarSessao, encerrarSessao } from "@/lib/auth";

export type EstadoForm = { erro?: string };

function normalizarEmail(v: FormDataEntryValue | null) {
  return String(v || "").trim().toLowerCase();
}

type LinhaUser = { id: string; email: string; senha_hash: string; nome: string; org_id: string };

export async function cadastrar(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const nome = String(form.get("nome") || "").trim();
  const email = normalizarEmail(form.get("email"));
  const senha = String(form.get("senha") || "");
  const empresa = String(form.get("empresa") || "").trim() || nome;

  if (!nome || !email || senha.length < 6) {
    return { erro: "Preencha nome, e-mail e uma senha de pelo menos 6 caracteres." };
  }
  const existe = await uma("SELECT id FROM orcafacil.app_user WHERE email = $1", [email]);
  if (existe) return { erro: "Já existe uma conta com esse e-mail. Faça login." };

  const orgId = randomUUID();
  const userId = randomUUID();
  const senhaHash = await hashSenha(senha);

  await q("INSERT INTO orcafacil.organization (id, nome) VALUES ($1, $2)", [orgId, empresa]);
  await q(
    "INSERT INTO orcafacil.profile (org_id, nome_comercial, responsavel) VALUES ($1, $2, $3)",
    [orgId, empresa, nome]
  );
  await q(
    "INSERT INTO orcafacil.app_user (id, email, senha_hash, nome, org_id) VALUES ($1, $2, $3, $4, $5)",
    [userId, email, senhaHash, nome, orgId]
  );

  await criarSessao({ userId, orgId, nome, email });
  redirect("/painel");
}

export async function entrar(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const email = normalizarEmail(form.get("email"));
  const senha = String(form.get("senha") || "");
  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  const user = await uma<LinhaUser>("SELECT * FROM orcafacil.app_user WHERE email = $1", [email]);
  if (!user || !(await conferirSenha(senha, user.senha_hash))) {
    return { erro: "E-mail ou senha incorretos." };
  }
  await criarSessao({ userId: user.id, orgId: user.org_id, nome: user.nome, email: user.email });
  redirect("/painel");
}

export async function sair() {
  encerrarSessao();
  redirect("/entrar");
}
