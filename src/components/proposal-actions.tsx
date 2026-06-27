"use client";

import { useState } from "react";

export function BotaoImprimir({ id }: { id?: string }) {
  // Com o id, abrimos o PDF gerado no servidor (o mesmo enviado no WhatsApp);
  // sem id, cai no print do navegador.
  if (id) {
    return (
      <a href={`/p/${id}/pdf`} target="_blank" rel="noreferrer" className="btn btn-sec">
        ⬇ Baixar PDF
      </a>
    );
  }
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
