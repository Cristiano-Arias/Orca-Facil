// Envio de mensagens pelo WhatsApp Cloud API (Meta).
// Requer as variáveis WHATSAPP_TOKEN e WHATSAPP_PHONE_ID no ambiente.

export function soDigitos(s: string | null | undefined): string {
  return (s || "").replace(/\D/g, "");
}

// Corrige o "nono dígito" de celulares brasileiros: a Meta às vezes entrega o
// número sem o 9 (55 + DDD + 8 dígitos = 12). Para enviar, recolocamos o 9
// (55 + DDD + 9 + 8 = 13), que é o formato real do WhatsApp.
export function ajustarNumeroBR(digits: string): string {
  if (digits.startsWith("55") && digits.length === 12) {
    return digits.slice(0, 4) + "9" + digits.slice(4);
  }
  return digits;
}

// Compara dois números de telefone de forma tolerante (ignora DDI/9º dígito):
// considera iguais se os últimos 8 dígitos baterem.
export function mesmoNumero(a: string, b: string): boolean {
  const x = soDigitos(a);
  const y = soDigitos(b);
  if (!x || !y) return false;
  const n = 8;
  return x.slice(-n) === y.slice(-n);
}

// Envia uma mensagem (texto ou documento) pela API do WhatsApp Cloud.
async function enviarPayload(para: string, payload: Record<string, unknown>): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    console.warn("WhatsApp não configurado (WHATSAPP_TOKEN / WHATSAPP_PHONE_ID).");
    return false;
  }
  try {
    const resp = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: ajustarNumeroBR(soDigitos(para)),
        ...payload,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) {
      console.error("Falha ao enviar WhatsApp:", resp.status, await resp.text().catch(() => ""));
      return false;
    }
    console.log(`[whatsapp] ${payload.type} enviado para ${soDigitos(para)}`);
    return true;
  } catch (e) {
    console.error("Erro ao enviar WhatsApp:", e);
    return false;
  }
}

export async function enviarWhatsApp(para: string, texto: string): Promise<boolean> {
  return enviarPayload(para, { type: "text", text: { body: texto.slice(0, 4000) } });
}

// Envia um documento (ex.: o PDF do orçamento) na conversa do WhatsApp.
// `link` precisa ser um endereço HTTPS público (a Meta busca o arquivo).
export async function enviarDocumentoWhatsApp(
  para: string,
  link: string,
  filename: string,
  caption?: string
): Promise<boolean> {
  return enviarPayload(para, {
    type: "document",
    document: { link, filename, ...(caption ? { caption: caption.slice(0, 1000) } : {}) },
  });
}
