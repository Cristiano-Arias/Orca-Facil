import { NextRequest, NextResponse } from "next/server";
import { orgPorWhatsapp, servicosDaOrg, criarProposta, lerSessaoWa, salvarSessaoWa, limparSessaoWa } from "@/lib/quotes";
import { uma } from "@/lib/db";
import { usoDaConta, motivoBloqueio } from "@/lib/limite";
import { ehDono } from "@/lib/owner";
import { extrairCampos, camposFaltando, sanitizar, type CamposExtraidos } from "@/lib/parser";
import { extrairComIA } from "@/lib/ai";
import { enviarWhatsApp, enviarDocumentoWhatsApp, soDigitos } from "@/lib/whatsapp";
import { brl } from "@/lib/proposal-format";

export const dynamic = "force-dynamic";

function baseUrl(): string {
  return (process.env.APP_URL || "https://orcachat.com.br").replace(/\/$/, "");
}

// 1) Verificação do webhook (Meta chama com GET ao configurar)
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mode = p.get("hub.mode");
  const token = p.get("hub.verify_token");
  const challenge = p.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

// 2) Recebimento de mensagens
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const mensagens: any[] = [];
    const statuses: any[] = [];
    for (const entry of body?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        for (const m of change?.value?.messages ?? []) {
          if (m?.type === "text" && m?.text?.body) mensagens.push({ from: m.from, texto: m.text.body });
        }
        for (const s of change?.value?.statuses ?? []) {
          statuses.push({ status: s?.status, para: s?.recipient_id, erros: s?.errors });
        }
      }
    }
    if (statuses.length) console.log(`[whatsapp] status de entrega:`, JSON.stringify(statuses));
    console.log(`[whatsapp] recebido callback — ${mensagens.length} mensagem(ns):`, JSON.stringify(mensagens));
    // processa em sequência (normalmente 1 mensagem por callback)
    for (const msg of mensagens) {
      await processar(msg.from, msg.texto);
    }
  } catch (e) {
    console.error("Erro no webhook do WhatsApp:", e);
  }
  // sempre 200 para a Meta não reenviar
  return NextResponse.json({ ok: true });
}

// junta o que já tinha na conversa com o que veio na mensagem nova.
function mesclar(ant: CamposExtraidos | undefined, novo: CamposExtraidos): CamposExtraidos {
  const out: Record<string, unknown> = { ...(ant ?? {}) };
  for (const [k, v] of Object.entries(novo)) {
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as CamposExtraidos;
}

// transforma a lista do que falta em uma pergunta amigável (só o que falta).
function perguntaFalta(falta: string[]): string {
  const mapa: Record<string, string> = {
    cliente: "o *nome do cliente*",
    serviço: "qual *serviço* você vai fazer",
    quantidade: "a *quantidade* (ex.: 80 m², 3 portas)",
    valor: "o *valor* (ex.: R$ 28 o metro, ou R$ 2.000 no total)",
    "valor de algum item": "o *valor* de cada serviço",
  };
  const itens = falta.map((f) => mapa[f] ?? f);
  const lista = itens.length === 1 ? itens[0] : itens.slice(0, -1).join(", ") + " e " + itens[itens.length - 1];
  return `Quase lá! 🙂 Só preciso saber ${lista}. Pode me mandar?`;
}

async function processar(from: string, texto: string) {
  const sender = soDigitos(from);
  const org = await orgPorWhatsapp(sender);
  const url = baseUrl();
  console.log(`[whatsapp] de=${sender} org=${org ? org.orgId : "NÃO ENCONTRADA"}`);

  if (!org) {
    await enviarWhatsApp(
      from,
      `Olá! 👋 Para criar orçamentos por aqui, primeiro conecte este número no OrçaChat:\n\n1) Entre em ${url}\n2) Vá em *Meu perfil*\n3) Informe este WhatsApp e salve.\n\nDepois é só me mandar os dados do serviço. 🙂`
    );
    return;
  }

  const sessao = await lerSessaoWa(org.orgId, sender);
  const limpo = texto.trim().toLowerCase();

  // comando para recomeçar
  if (/^(cancelar|cancela|recome[çc]ar|reiniciar|apagar|esquecer)\b/.test(limpo)) {
    await limparSessaoWa(org.orgId, sender);
    await enviarWhatsApp(from, "Ok, recomeçamos do zero. 👍 Pode me mandar os dados do novo orçamento.");
    return;
  }

  // "finalizar" = criar com o que já temos (mesmo faltando condições)
  const ehFinalizar = /^(finalizar|finaliza|pode finalizar|pode criar|criar|cria|assim mesmo|pode mandar|manda assim|sim,? pode|ok,? pode)\b/.test(limpo);

  // saudação só quando NÃO há conversa em andamento
  if (!sessao && !ehFinalizar && /^(oi|ol[áa]|ola|menu|ajuda|come[çc]ar|comecar|start|bom dia|boa tarde|boa noite)\b/.test(limpo)) {
    await enviarWhatsApp(
      from,
      `Oi! Sou o *OrçaChat*. 💬\nMe mande os dados de um serviço numa frase e eu monto a proposta. Ex.:\n\n_"Orçamento para João, pintura de apartamento, 80 m², R$ 28 por metro, prazo 5 dias, pagamento 50% entrada e 50% na entrega"_`
    );
    return;
  }

  // cota do plano (não acumula no mês): se estourou, bloqueia e orienta a assinar
  const dono = await uma<{ email: string }>(
    "SELECT email FROM orcafacil.app_user WHERE org_id = $1 ORDER BY created_at LIMIT 1",
    [org.orgId]
  );
  const uso = await usoDaConta(org.orgId, ehDono(dono?.email));
  if (uso.bloqueado) {
    await limparSessaoWa(org.orgId, sender);
    await enviarWhatsApp(from, `${motivoBloqueio(uso)}\n\n👉 Escolha um plano aqui:\n${url}/assinatura`);
    return;
  }

  // interpreta a mensagem e junta com o que já estava na conversa
  const conhecidos = await servicosDaOrg(org.orgId);
  const base = extrairCampos(texto, conhecidos);
  const ia = await extrairComIA(texto);
  const limparObj = (o: CamposExtraidos): CamposExtraidos => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined && v !== "") out[k] = v;
    return out as CamposExtraidos;
  };
  const novos = sanitizar(ia ? { ...base, ...limparObj(ia) } : base);
  const campos = mesclar(sessao?.campos, novos);

  // 1) perguntas ESSENCIAIS (cliente, serviço, valor) — pergunta só o que falta
  const falta = camposFaltando(campos);
  console.log(`[whatsapp] campos=${JSON.stringify(campos)} falta=${JSON.stringify(falta)} etapa=${sessao?.etapa}`);
  if (falta.length > 0) {
    await salvarSessaoWa(org.orgId, sender, campos, "coletando");
    await enviarWhatsApp(from, perguntaFalta(falta));
    return;
  }

  // 2) condições essenciais (prazo, pagamento) — pergunta uma vez, se não houver padrão
  const perfil = await uma<{ validade_padrao: number; prazo_padrao: string | null; pagamento_padrao: string | null }>(
    "SELECT validade_padrao, prazo_padrao, pagamento_padrao FROM orcafacil.profile WHERE org_id = $1",
    [org.orgId]
  );
  const faltaCond: string[] = [];
  if (!campos.prazo && !perfil?.prazo_padrao) faltaCond.push("o *prazo de entrega*");
  if (!campos.pagamento && !perfil?.pagamento_padrao) faltaCond.push("a *forma de pagamento*");
  if (faltaCond.length && !ehFinalizar && sessao?.etapa !== "condicoes") {
    await salvarSessaoWa(org.orgId, sender, campos, "condicoes");
    const lista = faltaCond.length === 1 ? faltaCond[0] : faltaCond.join(" e ");
    await enviarWhatsApp(
      from,
      `Faltou ${lista}. Me manda esses dados, ou responda *finalizar* que eu crio assim mesmo. 🙂`
    );
    return;
  }

  try {
    await limparSessaoWa(org.orgId, sender);
    const { proposalId, numero, avisos, itens, subtotal, desconto, total } = await criarProposta(
      org.orgId,
      campos,
      perfil?.validade_padrao ?? 7
    );

    // formata a quantidade sem casas decimais desnecessárias (2 em vez de 2,00)
    const fmtQtd = (n: number) => (Number.isInteger(n) ? String(n) : n.toLocaleString("pt-BR"));

    let resp = avisos.length ? avisos.join("\n") + "\n\n" : "";
    resp += `✅ Orçamento *${numero}* criado!\n`;
    if (campos.cliente) resp += `👤 Cliente: ${campos.cliente}\n`;
    resp += `\n*Itens:*\n`;
    for (const it of itens) {
      const totalItem = it.qtd * it.preco;
      // "• Pintura — 80 m² × R$ 28,00 = R$ 2.240,00"  (ou só o valor quando qtd=1)
      if (it.qtd === 1 && (it.unidade === "un" || it.unidade === "serviço")) {
        resp += `• ${it.descricao} — ${brl(totalItem)}\n`;
      } else {
        resp += `• ${it.descricao} — ${fmtQtd(it.qtd)} ${it.unidade} × ${brl(it.preco)} = ${brl(totalItem)}\n`;
      }
    }
    resp += `\n`;
    if (desconto > 0) {
      resp += `Subtotal: ${brl(subtotal)}\n`;
      resp += `Desconto: -${brl(desconto)}\n`;
    }
    resp += `💰 Total: *${brl(total)}*\n`;

    // condições, quando informadas
    const cond: string[] = [];
    if (campos.prazo) cond.push(`⏱️ Prazo: ${campos.prazo}`);
    if (campos.pagamento) cond.push(`💳 Pagamento: ${campos.pagamento}`);
    if (campos.garantia) cond.push(`🛡️ Garantia: ${campos.garantia}`);
    if (cond.length) resp += `\n${cond.join("\n")}\n`;

    resp += `\n📄 Baixar PDF:\n${url}/p/${proposalId}/pdf\n\n`;
    resp += `🔗 Link para o cliente (ele aprova online):\n${url}/p/${proposalId}\n\n`;
    resp += `✏️ Ver/editar:\n${url}/propostas/${proposalId}`;
    const enviado = await enviarWhatsApp(from, resp);

    // diferencial: envia o orçamento em PDF como documento na própria conversa
    const pdf = await enviarDocumentoWhatsApp(
      from,
      `${url}/p/${proposalId}/pdf`,
      `Orcamento-${numero}.pdf`,
      `Orçamento ${numero} — pronto para encaminhar ao cliente 👆`
    );
    console.log(`[whatsapp] proposta ${numero} criada (${proposalId}); texto=${enviado} pdf=${pdf}`);
  } catch (e) {
    console.error("Erro ao criar orçamento via WhatsApp:", e);
    await enviarWhatsApp(from, "Tive um problema para salvar o orçamento agora. Pode tentar de novo em instantes? 🙏");
  }
}
