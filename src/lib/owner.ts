// Identifica o "dono" do negócio (acesso ao Painel do Dono) e os contatos de suporte.
// Configuráveis por variáveis de ambiente; têm padrão para já funcionar.

const OWNER_EMAIL = (process.env.OWNER_EMAIL || "cristianoarias@hotmail.com").trim().toLowerCase();

export function ehDono(email?: string | null): boolean {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || e === "undefined" || e === "null") return false;
  // permite mais de um dono (lista separada por vírgula em OWNER_EMAIL)
  const donos = OWNER_EMAIL.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  return donos.includes(e);
}

// Contato de suporte mostrado aos profissionais (WhatsApp + e-mail).
export function suporteWhatsapp(): string {
  return (process.env.SUPORTE_WHATSAPP || process.env.ORCACHAT_WHATSAPP || "5585920090984").replace(/\D/g, "");
}
export function suporteEmail(): string {
  return process.env.SUPORTE_EMAIL || "suporte@orcachat.com.br";
}
