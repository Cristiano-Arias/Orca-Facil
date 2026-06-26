import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTEGIDAS = ["/painel", "/propostas", "/clientes", "/servicos", "/perfil"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const precisaLogin = PROTEGIDAS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!precisaLogin) return NextResponse.next();

  const token = req.cookies.get("of_session")?.value;
  let ok = false;
  if (token && process.env.AUTH_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      ok = true;
    } catch {
      ok = false;
    }
  }
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/entrar";
  url.searchParams.set("de", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/painel/:path*", "/propostas/:path*", "/clientes/:path*", "/servicos/:path*", "/perfil/:path*"],
};
