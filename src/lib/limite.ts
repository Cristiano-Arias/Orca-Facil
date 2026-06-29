// Controle de cota: quantos orçamentos a conta pode criar por mês.
// A cota NÃO acumula — zera no início de cada mês. O teste grátis libera
// TRIAL_COTA orçamentos durante TRIAL_DIAS dias.
import { uma } from "./db";
import { situacao, PLANOS, TRIAL_COTA, type PerfilAssinatura, type PlanoKey } from "./billing";

export type Uso = {
  modo: "livre" | "trial" | "ativa" | "expirado";
  plano?: PlanoKey;
  limite: number | null; // null = ilimitado
  usados: number;
  restantes: number | null; // null = ilimitado
  bloqueado: boolean; // true = não pode criar agora
  dias?: number; // dias restantes do teste grátis
};

async function contar(sql: string, params: unknown[]): Promise<number> {
  const row = await uma<{ n: string }>(sql, params);
  return Number(row?.n ?? 0);
}

// Orçamentos criados no mês corrente (para planos pagos).
function contarMes(orgId: string) {
  return contar(
    `SELECT count(*) AS n FROM orcafacil.proposal
      WHERE org_id = $1 AND created_at >= date_trunc('month', now())`,
    [orgId]
  );
}

// Orçamentos criados desde a abertura da conta (para o teste grátis).
function contarTrial(orgId: string, desde: string | Date) {
  return contar(
    "SELECT count(*) AS n FROM orcafacil.proposal WHERE org_id = $1 AND created_at >= $2",
    [orgId, desde]
  );
}

// Calcula a situação de uso da conta. O dono nunca é limitado.
export async function usoDaConta(orgId: string, ehDono = false): Promise<Uso> {
  const perfil = await uma<PerfilAssinatura & { created_at: string }>(
    `SELECT pr.plano, pr.assinatura_status, pr.assinatura_ate, o.created_at
       FROM orcafacil.organization o LEFT JOIN orcafacil.profile pr ON pr.org_id = o.id
      WHERE o.id = $1`,
    [orgId]
  );
  const criada = perfil?.created_at ?? new Date();
  const sit = situacao(perfil, criada, ehDono);

  if (sit.modo === "livre") {
    return { modo: "livre", limite: null, usados: 0, restantes: null, bloqueado: false };
  }

  if (sit.modo === "ativa") {
    const cota = PLANOS[sit.plano as PlanoKey]?.cota ?? null;
    const usados = await contarMes(orgId);
    return {
      modo: "ativa",
      plano: sit.plano as PlanoKey,
      limite: cota,
      usados,
      restantes: cota === null ? null : Math.max(0, cota - usados),
      bloqueado: cota !== null && usados >= cota,
    };
  }

  if (sit.modo === "trial") {
    const usados = await contarTrial(orgId, criada);
    return {
      modo: "trial",
      dias: sit.dias,
      limite: TRIAL_COTA,
      usados,
      restantes: Math.max(0, TRIAL_COTA - usados),
      bloqueado: usados >= TRIAL_COTA,
    };
  }

  // expirado: teste grátis terminou e não há assinatura ativa
  return { modo: "expirado", limite: 0, usados: 0, restantes: 0, bloqueado: true };
}

// Mensagem curta explicando por que está bloqueado (usada no site e no WhatsApp).
export function motivoBloqueio(uso: Uso): string {
  if (uso.modo === "expirado") {
    return "Seu teste grátis terminou. Assine um plano para continuar criando orçamentos.";
  }
  if (uso.modo === "trial") {
    return `Você usou os ${uso.limite} orçamentos do teste grátis. Assine um plano para continuar.`;
  }
  // ativa, mas estourou a cota do mês
  return `Você atingiu o limite de ${uso.limite} orçamentos deste mês. Faça upgrade ou aguarde o próximo mês.`;
}
