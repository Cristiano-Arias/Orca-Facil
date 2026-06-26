"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth";
import { q, uma } from "@/lib/db";

const VALIDOS = [
  "RASCUNHO", "AGUARDANDO", "ENVIADA", "VISUALIZADA", "NEGOCIACAO",
  "APROVADA", "RECUSADA", "VENCIDA", "CANCELADA", "CONVERTIDA", "PAGA_PARCIAL", "PAGA",
];

// Muda o status de uma proposta (área logada).
export async function mudarStatus(formData: FormData) {
  const sessao = await lerSessao();
  if (!sessao) return;
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!VALIDOS.includes(status)) return;
  await q("UPDATE orcafacil.proposal SET status = $1 WHERE id = $2 AND org_id = $3", [status, id, sessao.orgId]);
  revalidatePath(`/propostas/${id}`);
  revalidatePath("/propostas");
}

// Resposta do cliente na página pública (sem login).
export async function responderCliente(formData: FormData) {
  const id = String(formData.get("id") || "");
  const acao = String(formData.get("acao") || "");
  const mapa: Record<string, string> = {
    aprovar: "APROVADA",
    recusar: "RECUSADA",
    ajuste: "NEGOCIACAO",
  };
  const status = mapa[acao];
  if (!status) return;
  // só avança se a proposta ainda não foi finalizada
  const pr = await uma<{ status: string }>("SELECT status FROM orcafacil.proposal WHERE id = $1", [id]);
  if (!pr) return;
  await q("UPDATE orcafacil.proposal SET status = $1 WHERE id = $2", [status, id]);
  revalidatePath(`/p/${id}`);
}
