// Controle de cota: quantos orçamentos a conta pode criar por mês.
// A cota NÃO acumula — zera no início de cada mês. O teste grátis dá acesso
// ao plano escolhido durante os 7 dias (mesma cota do plano).
import { uma } from "./db";
import { situacao, getPlanos, type PerfilAssinatura, type PlanoKey } from "./billing";

export type Uso = {
  modo: "livre" | "trial" | "ativa" | "expirado";
  plano?: PlanoKey;
  limite: number | null; // null = ilimitado
  usados: number;
  restantes: number | null; // null = ilimitado
  bloqueado: boolean; // true = não pode criar agora
  dias?: number; // dias restantes do teste grátis
};

// Orçamentos criados no mês corrente.
async function contarMes(orgId: string): Promise<number> {
  const row = await uma<{ n: string }>(
    `SELECT count(*) AS n FROM orcafacil.proposal
      WHERE org_id = $1 AND created_at >= date_trunc('month', now())`,
    [orgId]
  );
  return Number(row?.n ?? 0);
}

// Calcula a situação de uso da conta. O dono nunca é limitado.
export async function usoDaConta(orgId: string, ehDono = false): Promise<Uso> {
  const perfil = await uma<PerfilAssinatura>(
    `SELECT plano, assinatura_status, assinatura_ate, trial_ate FROM orcafacil.profile WHERE org_id = $1`,
    [orgId]
  );
  const sit = situacao(perfil, ehDono);

  if (sit.modo === "livre") {
    return { modo: "livre", limite: null, usados: 0, restantes: null, bloqueado: false };
  }

  if (sit.modo === "expirado") {
    return { modo: "expirado", limite: 0, usados: 0, restantes: 0, bloqueado: true };
  }

  // trial ou ativa: usa a cota do plano
  const planos = await getPlanos();
  const plano = sit.plano as PlanoKey;
  const cota = planos[plano]?.cota ?? null;
  const usados = await contarMes(orgId);
  return {
    modo: sit.modo,
    plano,
    dias: sit.modo === "trial" ? sit.dias : undefined,
    limite: cota,
    usados,
    restantes: cota === null ? null : Math.max(0, cota - usados),
    bloqueado: cota !== null && usados >= cota,
  };
}

// Mensagem curta explicando por que está bloqueado (usada no site e no WhatsApp).
export function motivoBloqueio(uso: Uso): string {
  if (uso.modo === "expirado") {
    return "Para criar orçamentos, comece seu teste grátis de 7 dias ou assine um plano.";
  }
  return `Você atingiu o limite de ${uso.limite} orçamentos deste mês. Faça upgrade ou aguarde o próximo mês.`;
}
