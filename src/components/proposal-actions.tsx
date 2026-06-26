"use client";

import { useState } from "react";

export function BotaoImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-sec">
      ⬇ Baixar PDF
    </button>
  );
}

export function CopiarLink({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-sec"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch {
          window.prompt("Copie o link da proposta:", url);
        }
      }}
    >
      {copiado ? "✓ Link copiado" : "🔗 Link do cliente"}
    </button>
  );
}
