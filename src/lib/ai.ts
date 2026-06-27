// Camada de IA OPCIONAL. Se ANTHROPIC_API_KEY estiver definida, usa o Claude
// para interpretar a mensagem. Em qualquer falha (sem chave, erro de rede,
// resposta inválida), devolve null — e o app cai no interpretador embutido.
import type { CamposExtraidos } from "./parser";

const MODELO = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

const INSTRUCAO = `Você extrai dados de orçamentos de serviços a partir de uma mensagem em português.
Responda APENAS com um JSON válido (sem texto extra) com as chaves possíveis:
cliente (string, nome do cliente), telefone (string),
prazo (string), pagamento (string, condição completa de pagamento, preservando
detalhes), garantia (string), validadeDias (número), descontoPct (número),
obs (string com observações e detalhes adicionais: local, descrição detalhada,
condições especiais, retoque etc.),
itens (array) — UMA entrada por serviço/produto orçado, cada uma com:
  descricao (string, nome curto e claro — ex: "Pintura de apartamento"),
  qtd (número), unidade (string, ex: "m²", "un", "h", "serviço"),
  preco (número, valor unitário) OU total (número, valor total do item).
Se houver vários serviços na mensagem, inclua TODOS em "itens".
Inclua somente as chaves que conseguir identificar.
Valores monetários em número (ex: 1200.5, sem "R$" nem pontos de milhar).
Não invente dados.`;

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
      signal: AbortSignal.timeout(15000),
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
