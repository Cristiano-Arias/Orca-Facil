// Lógica de cobrança/assinatura. Fica DESLIGADA até COBRANCA_ATIVA=true
// (assim dá para publicar tudo pronto e "ligar" quando o CNPJ/Mercado Pago estiverem prontos).

export const TRIAL_DIAS = Number(process.env.TRIAL_DIAS || 7);

export type PlanoKey = "essencial" | "premium";

export const PLANOS: Record<PlanoKey, { nome: string; preco: number; recursos: string[] }> = {
  essencial: {
    nome: "Essencial",
    preco: Number(process.env.PRECO_ESSENCIAL || 39),
    recursos: ["Orçamentos ilimitados", "PDF com a sua marca", "Link de aprovação", "Painel de controle"],
  },
  premium: {
    nome: "Premium",
    preco: Number(process.env.PRECO_PREMIUM || 79),
    recursos: ["Tudo do Essencial", "Relatórios avançados", "Vários usuários", "Suporte prioritário"],
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
export function situacao(perfil: PerfilAssinatura | null, orgCriadaEm: string | Date): Situacao {
  if (!cobrancaAtiva()) return { modo: "livre" };

  const agora = Date.now();
  const ate = perfil?.assinatura_ate ? new Date(perfil.assinatura_ate).getTime() : 0;
  if (perfil?.assinatura_status === "ativa" && ate > agora) {
    return { modo: "ativa", plano: perfil.plano || "essencial" };
  }
  const criada = new Date(orgCriadaEm).getTime();
  const fimTrial = criada + TRIAL_DIAS * 864e5;
  if (agora < fimTrial) {
    return { modo: "trial", dias: Math.ceil((fimTrial - agora) / 864e5) };
  }
  return { modo: "expirado" };
}
