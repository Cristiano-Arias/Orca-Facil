// Lógica de cobrança/assinatura. Fica DESLIGADA até COBRANCA_ATIVA=true
// (assim dá para publicar tudo pronto e "ligar" quando o CNPJ/Mercado Pago estiverem prontos).
import { q } from "./db";

export const TRIAL_DIAS = Number(process.env.TRIAL_DIAS || 7);
// Orçamentos liberados durante o teste grátis (não acumula). É menor que o Inicial
// de propósito: o teste é uma amostra (até 5), depois vira o plano Inicial.
export const TRIAL_COTA = Number(process.env.TRIAL_COTA || 5);

export type PlanoKey = "inicial" | "profissional" | "ilimitado";

export type PlanoCfg = { nome: string; preco: number; cota: number | null; recursos: string[] };

// Valores PADRÃO dos planos (usados quando o dono ainda não editou no Painel do Dono).
// cota = orçamentos por mês (não acumula). null = ilimitado.
// Os "recursos" listam apenas o que o OrçaChat entrega de fato hoje.
export const PLANOS: Record<PlanoKey, PlanoCfg> = {
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
    recursos: ["50 orçamentos por mês", "Tudo do plano Inicial", "Suporte por WhatsApp"],
  },
  ilimitado: {
    nome: "Ilimitado",
    preco: Number(process.env.PRECO_ILIMITADO || 99.99),
    cota: null,
    recursos: ["Orçamentos ilimitados", "Tudo do plano Profissional", "Suporte prioritário"],
  },
};

export const PLANO_KEYS: PlanoKey[] = ["inicial", "profissional", "ilimitado"];
// Plano para o qual o teste grátis se converte ao final dos 7 dias.
export const PLANO_TESTE: PlanoKey = "inicial";

// Carrega os planos efetivos: padrão do código + ajustes salvos pelo dono no banco.
export async function getPlanos(): Promise<Record<PlanoKey, PlanoCfg>> {
  const out: Record<PlanoKey, PlanoCfg> = {
    inicial: { ...PLANOS.inicial, recursos: [...PLANOS.inicial.recursos] },
    profissional: { ...PLANOS.profissional, recursos: [...PLANOS.profissional.recursos] },
    ilimitado: { ...PLANOS.ilimitado, recursos: [...PLANOS.ilimitado.recursos] },
  };
  try {
    const rows = await q<{ chave: string; nome: string; preco: string; cota: number | null; recursos: any }>(
      "SELECT chave, nome, preco, cota, recursos FROM orcafacil.plan_config"
    );
    for (const r of rows) {
      const k = r.chave as PlanoKey;
      if (!out[k]) continue;
      const recursos = Array.isArray(r.recursos)
        ? r.recursos
        : typeof r.recursos === "string"
        ? JSON.parse(r.recursos || "[]")
        : out[k].recursos;
      out[k] = {
        nome: r.nome || out[k].nome,
        preco: Number(r.preco),
        cota: r.cota === null || r.cota === undefined ? null : Number(r.cota),
        recursos: recursos.length ? recursos : out[k].recursos,
      };
    }
  } catch {
    // se a tabela ainda não existe (migração não rodou), usa os padrões
  }
  return out;
}

export function cobrancaAtiva(): boolean {
  return process.env.COBRANCA_ATIVA === "true";
}

export type PerfilAssinatura = {
  plano: string | null;
  assinatura_status: string | null;
  assinatura_ate: string | Date | null;
  trial_ate?: string | Date | null;
};

export type Situacao =
  | { modo: "livre" }
  | { modo: "trial"; dias: number; plano: string }
  | { modo: "ativa"; plano: string }
  | { modo: "expirado" };

// Decide a situação da conta. Sem cobrança ligada => sempre "livre".
// O dono do negócio nunca é bloqueado (ehDono = true).
//
// Modelo: o acesso depende de uma assinatura ativa no Mercado Pago. O teste
// grátis é uma assinatura com 7 dias sem cobrança (cartão cadastrado). Durante
// esse período a conta fica "ativa" mas é rotulada como "trial" (trial_ate no futuro).
export function situacao(perfil: PerfilAssinatura | null, ehDono = false): Situacao {
  if (!cobrancaAtiva() || ehDono) return { modo: "livre" };

  const agora = Date.now();
  const ate = perfil?.assinatura_ate ? new Date(perfil.assinatura_ate).getTime() : 0;
  const plano = perfil?.plano || "inicial";

  if (perfil?.assinatura_status === "ativa" && ate > agora) {
    const trialAte = perfil?.trial_ate ? new Date(perfil.trial_ate).getTime() : 0;
    if (trialAte > agora) {
      return { modo: "trial", dias: Math.ceil((trialAte - agora) / 864e5), plano };
    }
    return { modo: "ativa", plano };
  }
  return { modo: "expirado" };
}
