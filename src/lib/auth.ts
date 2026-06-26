import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const COOKIE = "of_session";
const ALG = "HS256";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET não definido");
  return new TextEncoder().encode(s);
}

export type Sessao = { userId: string; orgId: string; nome: string; email: string };

export async function hashSenha(senha: string) {
  return bcrypt.hash(senha, 10);
}
export async function conferirSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}

export async function criarSessao(dados: Sessao) {
  const token = await new SignJWT(dados as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function lerSessao(): Promise<Sessao | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      userId: String(payload.userId),
      orgId: String(payload.orgId),
      nome: String(payload.nome),
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}

export function encerrarSessao() {
  cookies().delete(COOKIE);
}
