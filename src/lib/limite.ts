// Controle de cota: quantos orçamentos a conta pode criar por mês.
// A cota NÃO acumula — zera no início de cada mês. O teste grátis dá acesso
// ao plano escolhido durante os 7 dias (mesma cota do plano).
import { uma } from "./db";
import { situacao, getPlanos, TRIAL_COTA, TRIAL_DIAS, type PerfilAssinatura, type PlanoKey } from "./billing";

export type Uso = {
  modo: "livre" | "trial" | "ativa" | "expirado";
  plano?: PlanoKey;
  limite: number | null; // null = ilimitado
  usados: number;
  restantes: number | null; // null = ilimitado
  bloqueado: boolean; // true = não pode criar agora
  dias?: number; // dias restantes do teste grátis
  jaIniciou?: boolean; // já começou um teste/assinatura alguma vez (para a mensagem certa)
};

// Orçamentos criados no mês corrente (planos pagos).
async function contarMes(orgId: string): Promise<number> {
  const row = await uma<{ n: string }>(
    `SELECT count(*) AS n FROM orcafacil.proposal
      WHERE org_id = $1 AND created_at >= date_trunc('month', now())`,
    [orgId]
  );
  return Number(row?.n ?? 0);
}

// Orçamentos criados a partir de uma data (usado no teste grátis: conta só os do período do teste).
async function contarDesde(orgId: string, desde: Date): Promise<number> {
  const row = await uma<{ n: string }>(
    "SELECT count(*) AS n FROM orcafacil.proposal WHERE org_id = $1 AND created_at >= $2",
    [orgId, desde.toISOString()]
  );
  return Number(row?.n ?? 0);
}

// Calcula a situação de uso da conta. O dono nunca é limitado.
export async function usoDaConta(orgId: string, ehDono = false): Promise<Uso> {
  const perfil = await uma<PerfilAssinatura & { mp_preapproval_id: string | null }>(
    `SELECT plano, assinatura_status, assinatura_ate, trial_ate, mp_preapproval_id FROM orcafacil.profile WHERE org_id = $1`,
    [orgId]
  );
  const sit = situacao(perfil, ehDono);

  if (sit.modo === "livre") {
    return { modo: "livre", limite: null, usados: 0, restantes: null, bloqueado: false };
  }

  if (sit.modo === "expirado") {
    // "já iniciou" = já cadastrou cartão/assinatura ou já teve um teste com data.
    // Serve para escolher a mensagem certa: "comece o teste" x "seu teste terminou".
    const jaIniciou = !!perfil?.mp_preapproval_id || !!perfil?.trial_ate;
    return { modo: "expirado", limite: 0, usados: 0, restantes: 0, bloqueado: true, jaIniciou };
  }

  const plano = sit.plano as PlanoKey;

  // teste grátis: conta só os orçamentos feitos DURANTE o teste, até TRIAL_COTA.
  // O início do teste é o fim (trial_ate) menos a duração (TRIAL_DIAS).
  if (sit.modo === "trial") {
    const fim = perfil?.trial_ate ? new Date(perfil.trial_ate).getTime() : Date.now();
    const inicio = new Date(fim - TRIAL_DIAS * 864e5);
    const usados = await contarDesde(orgId, inicio);
    return {
      modo: "trial",
      plano,
      dias: sit.dias,
      limite: TRIAL_COTA,
      usados,
      restantes: Math.max(0, TRIAL_COTA - usados),
      bloqueado: usados >= TRIAL_COTA,
    };
  }

  // ativa: usa a cota do plano contratado, contando o mês corrente
  const planos = await getPlanos();
  const cota = planos[plano]?.cota ?? null;
  const usados = await contarMes(orgId);
  return {
    modo: "ativa",
    plano,
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
