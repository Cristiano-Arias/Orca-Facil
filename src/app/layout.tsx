import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orça Fácil — Orçamentos pelo WhatsApp",
  description: "Crie orçamentos e propostas profissionais a partir do WhatsApp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
