// Lógica de cobrança/assinatura. Fica DESLIGADA até COBRANCA_ATIVA=true
// (assim dá para publicar tudo pronto e "ligar" quando o CNPJ/Mercado Pago estiverem prontos).

export const TRIAL_DIAS = Number(process.env.TRIAL_DIAS || 7);
// Quantidade de orçamentos liberados durante o teste grátis (não acumula).
export const TRIAL_COTA = Number(process.env.TRIAL_COTA || 5);

export type PlanoKey = "inicial" | "profissional" | "ilimitado";

// cota = orçamentos por mês (não acumula). null = ilimitado.
// Os "recursos" listam apenas o que o OrçaChat entrega de fato hoje.
export const PLANOS: Record<PlanoKey, { nome: string; preco: number; cota: number | null; recursos: string[] }> = {
  inicial: {
    nome: "Inicial",
    preco: Number(process.env.PRECO_INICIAL || 19.99),
    cota: 20,
    recursos: [
      "20 orçamentos por mês",
      "Orçamentos pelo WhatsApp e pelo site",
      "PDF profissional com a sua logo",
      "Link de aprovação para o cliente",
      "Histórico de clientes e serviços",
    ],
  },
  profissional: {
    nome: "Profissional",
    preco: Number(process.env.PRECO_PROFISSIONAL || 49.99),
    cota: 50,
    recursos: [
      "50 orçamentos por mês",
      "Tudo do plano Inicial",
      "Suporte por WhatsApp",
    ],
  },
  ilimitado: {
    nome: "Ilimitado",
    preco: Number(process.env.PRECO_ILIMITADO || 99.99),
    cota: null,
    recursos: [
      "Orçamentos ilimitados",
      "Tudo do plano Profissional",
      "Suporte prioritário",
    ],
  },
};

export function cobrancaAtiva(): boolean {
  return process.env.COBRANCA_ATIVA === "true";
}

export type PerfilAssinatura = {
  plano: string | null;
  assinatura_status: string | null;
  assinatura_ate: string | Date | null;
};

export type Situacao =
  | { modo: "livre" }
  | { modo: "trial"; dias: number }
  | { modo: "ativa"; plano: string }
  | { modo: "expirado" };

// Decide a situação da conta. Sem cobrança ligada => sempre "livre".
// O dono do negócio nunca é bloqueado (ehDono = true) — assim, ao "ligar" a
// cobrança, a conta do dono não cai no aviso de "teste terminou".
export function situacao(
  perfil: PerfilAssinatura | null,
  orgCriadaEm: string | Date,
  ehDono = false
): Situacao {
  if (!cobrancaAtiva() || ehDono) return { modo: "livre" };

  const agora = Date.now();
  const ate = perfil?.assinatura_ate ? new Date(perfil.assinatura_ate).getTime() : 0;
  if (perfil?.assinatura_status === "ativa" && ate > agora) {
    return { modo: "ativa", plano: perfil.plano || "inicial" };
  }
  const criada = new Date(orgCriadaEm).getTime();
  const fimTrial = criada + TRIAL_DIAS * 864e5;
  if (agora < fimTrial) {
    return { modo: "trial", dias: Math.ceil((fimTrial - agora) / 864e5) };
  }
  return { modo: "expirado" };
}
