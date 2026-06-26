// Camada de IA OPCIONAL. Se ANTHROPIC_API_KEY estiver definida, usa o Claude
// para interpretar a mensagem. Em qualquer falha (sem chave, erro de rede,
// resposta inválida), devolve null — e o app cai no interpretador embutido.
import type { CamposExtraidos } from "./parser";

const MODELO = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

const INSTRUCAO = `Você extrai dados de orçamentos de serviços a partir de uma mensagem em português.
Responda APENAS com um JSON válido (sem texto extra) com as chaves possíveis:
cliente (string), telefone (string), servico (string), unidade (string),
qtd (número), preco (número, valor unitário), total (número, valor total),
prazo (string), pagamento (string), garantia (string), validadeDias (número),
descontoPct (número). Inclua somente as chaves que conseguir identificar.
Valores monetários em número (ex: 2240.5). Não invente dados.`;

export async function extrairComIA(texto: string): Promise<CamposExtraidos | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 500,
        system: INSTRUCAO,
        messages: [{ role: "user", content: texto }],
      }),
      // evita travar a requisição do usuário se a IA demorar demais
      signal: AbortSignal.timeout(7000),
    });
    if (!resp.ok) return null;
    const data: any = await resp.json();
    const txt: string = data?.content?.[0]?.text ?? "";
    const jsonMatch = txt.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const obj = JSON.parse(jsonMatch[0]);
    return obj as CamposExtraidos;
  } catch {
    return null;
  }
}
