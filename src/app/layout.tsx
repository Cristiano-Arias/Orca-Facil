import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegistrarSW from "@/components/registrar-sw";

export const metadata: Metadata = {
  title: "Orça Fácil — Orçamentos pelo WhatsApp",
  description: "Crie orçamentos e propostas profissionais a partir do WhatsApp.",
  appleWebApp: { capable: true, title: "Orça Fácil", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
