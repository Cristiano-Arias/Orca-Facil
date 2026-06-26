"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
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

type ItemEdit = { descricao: string; qtd: number; unidade: string; preco: number };

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// Edição completa da proposta (vários itens, condições, observações, desconto).
export async function atualizarProposta(formData: FormData) {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  const id = String(formData.get("id") || "");

  const pr = await uma<{ id: string; client_id: string | null }>(
    "SELECT id, client_id FROM orcafacil.proposal WHERE id = $1 AND org_id = $2",
    [id, sessao!.orgId]
  );
  if (!pr) redirect("/propostas");

  let itens: ItemEdit[] = [];
  try {
    const arr = JSON.parse(String(formData.get("itens") || "[]"));
    if (Array.isArray(arr)) {
      itens = arr
        .map((i: any) => ({
          descricao: String(i.descricao || "").trim(),
          qtd: num(i.qtd) || 1,
          unidade: String(i.unidade || "un").trim() || "un",
          preco: num(i.preco),
        }))
        .filter((i) => i.descricao);
    }
  } catch {
    /* ignora */
  }
  if (itens.length === 0) itens = [{ descricao: "Serviço", qtd: 1, unidade: "un", preco: 0 }];

  const str = (k: string) => {
    const v = String(formData.get(k) || "").trim();
    return v === "" ? null : v;
  };
  const validade = parseInt(String(formData.get("validade_dias") || "7")) || 7;
  const desconto = num(formData.get("desconto"));

  // cliente vinculado (nome/telefone)
  if (pr.client_id) {
    const cliNome = String(formData.get("cliente_nome") || "").trim();
    await q("UPDATE orcafacil.client SET nome = COALESCE(NULLIF($1,''), nome), telefone = $2 WHERE id = $3 AND org_id = $4", [
      cliNome,
      str("cliente_telefone"),
      pr.client_id,
      sessao!.orgId,
    ]);
  }

  await q(
    `UPDATE orcafacil.proposal SET servico_base = $1, prazo = $2, pagamento = $3, garantia = $4,
       validade_dias = $5, desconto = $6, obs = $7 WHERE id = $8 AND org_id = $9`,
    [itens[0].descricao, str("prazo"), str("pagamento"), str("garantia"), validade, desconto, str("obs"), id, sessao!.orgId]
  );

  await q("DELETE FROM orcafacil.proposal_item WHERE proposal_id = $1", [id]);
  for (const it of itens) {
    await q(
      "INSERT INTO orcafacil.proposal_item (id, proposal_id, descricao, qtd, unidade, preco, custo) VALUES ($1,$2,$3,$4,$5,$6,0)",
      [randomUUID(), id, it.descricao, it.qtd, it.unidade, it.preco]
    );
  }

  revalidatePath(`/propostas/${id}`);
  revalidatePath("/propostas");
  redirect(`/propostas/${id}`);
}

// Resposta do cliente na página pública (sem login).
export async function responderCliente(formData: FormData) {
  const id = String(formData.get("id") || "");
  const acao = String(formData.get("acao") || "");
  const nota = String(formData.get("nota") || "").trim().slice(0, 1000);
  const mapa: Record<string, string> = {
    aprovar: "APROVADA",
    recusar: "RECUSADA",
    ajuste: "NEGOCIACAO",
  };
  const status = mapa[acao];
  if (!status) return;
  const pr = await uma<{ status: string }>("SELECT status FROM orcafacil.proposal WHERE id = $1", [id]);
  if (!pr) return;
  if (acao === "ajuste") {
    await q("UPDATE orcafacil.proposal SET status = $1, nota_cliente = $2 WHERE id = $3", [
      status,
      nota || "Cliente solicitou ajuste (sem detalhes).",
      id,
    ]);
  } else {
    await q("UPDATE orcafacil.proposal SET status = $1 WHERE id = $2", [status, id]);
  }
  revalidatePath(`/p/${id}`);
  revalidatePath(`/propostas/${id}`);
}
