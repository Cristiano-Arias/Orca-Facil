// Envio de mensagens pelo WhatsApp Cloud API (Meta).
// Requer as variáveis WHATSAPP_TOKEN e WHATSAPP_PHONE_ID no ambiente.

export function soDigitos(s: string | null | undefined): string {
  return (s || "").replace(/\D/g, "");
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

export async function enviarWhatsApp(para: string, texto: string): Promise<boolean> {
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
        to: soDigitos(para),
        type: "text",
        text: { body: texto.slice(0, 4000) },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) {
      console.error("Falha ao enviar WhatsApp:", resp.status, await resp.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("Erro ao enviar WhatsApp:", e);
    return false;
  }
}
