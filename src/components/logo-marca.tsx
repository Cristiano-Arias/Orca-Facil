import { corValida } from "@/lib/proposal-format";

// Componente puro (sem hooks) — funciona tanto no servidor (proposta) quanto
// no cliente (pré-visualização do perfil). Mostra o logo do profissional, ou
// um ícone escolhido, ou as iniciais — sempre bem apresentado.
export type LogoMarcaProps = {
  logo?: string | null; // data URL da imagem (ignora "__remover__")
  emoji?: string | null; // ícone escolhido quando não há imagem
  nome?: string | null; // para tirar a inicial
  cor?: string | null; // cor da marca (texto das iniciais)
  fundo?: string | null; // "branco" | "transparente"
  formato?: string | null; // "quadrado" | "redondo"
  size?: number; // tamanho em px (lado do quadrado)
  className?: string;
};

export default function LogoMarca({
  logo,
  emoji,
  nome,
  cor,
  fundo = "branco",
  formato = "quadrado",
  size = 56,
  className = "",
}: LogoMarcaProps) {
  const temLogo = !!logo && logo !== "__remover__";
  const inicial = (nome || "O").trim().charAt(0).toUpperCase() || "O";
  const marca = corValida(cor);
  const shape = formato === "redondo" ? "rounded-full" : "rounded-xl";
  const fundoBranco = fundo !== "transparente";
  const dim = { width: size, height: size } as const;
  const fonte = Math.round(size * 0.5);

  // imagem de logo enviada pelo profissional
  if (temLogo) {
    return (
      <div
        className={`grid place-items-center overflow-hidden ${shape} ${fundoBranco ? "bg-white shadow-sm ring-1 ring-black/5" : ""} ${className}`}
        style={dim}
      >
        {/* object-contain: mostra o logo INTEIRO, sem cortar */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo!} alt="logo" className={`h-full w-full object-contain ${fundoBranco ? "p-1.5" : ""}`} />
      </div>
    );
  }

  // ícone escolhido (para quem não tem logo)
  if (emoji) {
    return (
      <div
        className={`grid place-items-center ${shape} ${fundoBranco ? "bg-white shadow-sm ring-1 ring-black/5" : "bg-white/20"} ${className}`}
        style={dim}
      >
        <span style={{ fontSize: fonte, lineHeight: 1 }}>{emoji}</span>
      </div>
    );
  }

  // iniciais (monograma)
  return (
    <div
      className={`grid place-items-center font-display font-bold ${shape} ${fundoBranco ? "bg-white shadow-sm ring-1 ring-black/5" : "bg-white/20"} ${className}`}
      style={dim}
    >
      <span style={{ fontSize: fonte, lineHeight: 1, color: fundoBranco ? marca : "inherit" }}>{inicial}</span>
    </div>
  );
}

// Sugestões de ícone por tipo de trabalho (para quem não tem logotipo).
export const ICONES_SUGERIDOS: { emoji: string; rotulo: string }[] = [
  { emoji: "🎨", rotulo: "Pintura" },
  { emoji: "⚡", rotulo: "Elétrica" },
  { emoji: "🔧", rotulo: "Manutenção" },
  { emoji: "🚿", rotulo: "Hidráulica" },
  { emoji: "❄️", rotulo: "Ar / Refrigeração" },
  { emoji: "🔨", rotulo: "Reforma" },
  { emoji: "🪚", rotulo: "Marcenaria" },
  { emoji: "🧱", rotulo: "Alvenaria" },
  { emoji: "🪟", rotulo: "Vidraçaria" },
  { emoji: "🚪", rotulo: "Portas" },
  { emoji: "💡", rotulo: "Iluminação" },
  { emoji: "🌿", rotulo: "Jardinagem" },
  { emoji: "🧹", rotulo: "Limpeza" },
  { emoji: "🏠", rotulo: "Imóveis" },
  { emoji: "🛠️", rotulo: "Serviços gerais" },
  { emoji: "🚧", rotulo: "Construção" },
];
