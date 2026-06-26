import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Encerra a sessão (limpa o cookie) e volta para a tela de login.
// GET para poder ser chamado por redirect/link.
export async function GET(req: Request) {
  cookies().delete("of_session");
  return NextResponse.redirect(new URL("/entrar", req.url));
}
