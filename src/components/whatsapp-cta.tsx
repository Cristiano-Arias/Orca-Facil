// Aviso (dentro do app) mostrando o número do OrçaChat e um botão que já
// abre a conversa no WhatsApp. O número vem da env ORCACHAT_WHATSAPP
// (com DDI), e cai num padrão se não estiver definida.
const NUM_PADRAO = "5585920090984"; // 85 92009-0984

function formatarBR(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) {
    const ddd = d.slice(2, 4);
    const resto = d.slice(4);
    if (resto.length === 9) return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
    if (resto.length === 8) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
    return `(${ddd}) ${resto}`;
  }
  return digits;
}

export default function WhatsAppCta({ compacto = false }: { compacto?: boolean }) {
  const num = (process.env.ORCACHAT_WHATSAPP || NUM_PADRAO).replace(/\D/g, "");
  const link = `https://wa.me/${num}?text=${encodeURIComponent("Oi! Quero criar um orçamento 🙂")}`;
  const numFmt = formatarBR(num);

  return (
    <div className="card border-emerald-200 bg-emerald-50/60 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-emerald-900">📱 Crie orçamentos pelo WhatsApp</h3>
          {!compacto && (
            <p className="mt-1 max-w-prose text-sm text-emerald-800">
              Mande uma mensagem para o número do OrçaChat e receba a proposta pronta — com PDF — na hora.
            </p>
          )}
          <div className="mt-2 text-sm text-emerald-900">
            Número do OrçaChat: <span className="font-display text-xl font-bold">{numFmt}</span>
          </div>
        </div>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="btn shrink-0 bg-zap text-emerald-950 hover:brightness-105"
        >
          Abrir conversa no WhatsApp
        </a>
      </div>
      <p className="mt-3 text-xs text-emerald-700">
        Importante: envie do <strong>seu WhatsApp cadastrado</strong> em “Meu perfil”, para o OrçaChat te reconhecer.
      </p>
    </div>
  );
}
