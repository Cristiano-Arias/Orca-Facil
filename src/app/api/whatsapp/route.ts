import { NextRequest, NextResponse } from "next/server";
import { orgPorWhatsapp, servicosDaOrg, criarProposta } from "@/lib/quotes";
import { uma } from "@/lib/db";
import { extrairCampos, camposFaltando, sanitizar, type CamposExtraidos } from "@/lib/parser";
import { extrairComIA } from "@/lib/ai";
import { enviarWhatsApp, soDigitos } from "@/lib/whatsapp";
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
    for (const entry of body?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        for (const m of change?.value?.messages ?? []) {
          if (m?.type === "text" && m?.text?.body) mensagens.push({ from: m.from, texto: m.text.body });
        }
      }
    }
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

  const limpo = texto.trim().toLowerCase();
  if (/^(oi|ol[áa]|menu|ajuda|come[çc]ar|start)\b/.test(limpo)) {
    await enviarWhatsApp(
      from,
      `Oi! Sou o *OrçaChat*. 💬\nMe mande os dados de um serviço numa frase e eu monto a proposta. Ex.:\n\n_"Orçamento para João, pintura de apartamento, 80 m², R$ 28 por metro, prazo 5 dias, pagamento 50% entrada e 50% na entrega"_`
    );
    return;
  }

  // interpreta (interpretador embutido + IA, se houver chave)
  const conhecidos = await servicosDaOrg(org.orgId);
  const base = extrairCampos(texto, conhecidos);
  const ia = await extrairComIA(texto);
  const limparObj = (o: CamposExtraidos): CamposExtraidos => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined && v !== "") out[k] = v;
    return out as CamposExtraidos;
  };
  const campos = sanitizar(ia ? { ...base, ...limparObj(ia) } : base);

  const falta = camposFaltando(campos);
  console.log(`[whatsapp] campos=${JSON.stringify(campos)} falta=${JSON.stringify(falta)}`);
  if (falta.length > 0) {
    await enviarWhatsApp(
      from,
      `Entendi parte da mensagem, mas faltou: *${falta.join(", ")}*.\nPode me mandar a frase completa? 🙂`
    );
    return;
  }

  try {
    const perfil = await uma<{ validade_padrao: number }>(
      "SELECT validade_padrao FROM orcafacil.profile WHERE org_id = $1",
      [org.orgId]
    );
    const { proposalId, numero, avisos } = await criarProposta(org.orgId, campos, perfil?.validade_padrao ?? 7);

    const itensTot = (campos.qtd ?? 1) * (campos.preco ?? 0);
    const total = campos.total ?? itensTot;
    let resp = avisos.length ? avisos.join("\n") + "\n\n" : "";
    resp += `✅ Orçamento *${numero}* criado!\n`;
    if (campos.cliente) resp += `Cliente: ${campos.cliente}\n`;
    if (campos.servico) resp += `Serviço: ${campos.servico}\n`;
    resp += `Total: *${brl(Number(total) || 0)}*\n\n`;
    resp += `📄 Link para o cliente:\n${url}/p/${proposalId}\n\n`;
    resp += `✏️ Ver/editar:\n${url}/propostas/${proposalId}`;
    const enviado = await enviarWhatsApp(from, resp);
    console.log(`[whatsapp] proposta ${numero} criada (${proposalId}); resposta enviada=${enviado}`);
  } catch (e) {
    console.error("Erro ao criar orçamento via WhatsApp:", e);
    await enviarWhatsApp(from, "Tive um problema para salvar o orçamento agora. Pode tentar de novo em instantes? 🙏");
  }
}
