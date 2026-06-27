import { NextRequest, NextResponse } from "next/server";
import { carregarProposta } from "@/lib/proposal-data";
import { gerarPdfProposta } from "@/lib/proposal-pdf";

export const dynamic = "force-dynamic";

// Serve o PDF da proposta num endereço público e estável:
//   GET /p/{id}/pdf  →  application/pdf
// Usado para baixar e para enviar como documento no WhatsApp.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const dados = await carregarProposta(params.id);
  if (!dados) return new NextResponse("Proposta não encontrada", { status: 404 });

  const pdf = await gerarPdfProposta(dados);
  const nomeArq = `Orcamento-${dados.proposta.numero}.pdf`;

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomeArq}"`,
      "Cache-Control": "no-store",
    },
  });
}
