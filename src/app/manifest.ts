import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OrçaChat",
    short_name: "OrçaChat",
    description: "Orçamentos e propostas profissionais pelo WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6fb",
    theme_color: "#4f46e5",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
