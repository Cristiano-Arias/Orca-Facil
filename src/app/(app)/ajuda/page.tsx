import { suporteWhatsapp, suporteEmail } from "@/lib/owner";

export const dynamic = "force-dynamic";

const FAQ = [
  {
    q: "Como crio um orçamento?",
    a: "De 3 formas: pelo WhatsApp (mande os dados numa mensagem), na tela “Novo orçamento” passo a passo, ou escrevendo em uma frase. O OrçaChat monta a proposta e gera o PDF.",
  },
  {
    q: "Por que o WhatsApp não me reconhece?",
    a: "O número de onde você manda a mensagem precisa estar salvo em “Meu perfil → WhatsApp”. Use o seu número pessoal (não o número do OrçaChat).",
  },
  {
    q: "Como o cliente aprova a proposta?",
    a: "Você envia o link da proposta. O cliente abre, vê tudo e clica em Aprovar, Recusar ou Pedir ajuste. Você é avisado.",
  },
  {
    q: "Os padrões (prazo, pagamento, garantia) entram sozinhos?",
    a: "Sim. O que você definiu em “Meu perfil → Padrões dos orçamentos” entra automaticamente em toda proposta. Você pode mudar em cada uma.",
  },
  {
    q: "Posso usar no celular e no computador?",
    a: "Sim. É o mesmo login, e seus dados ficam na nuvem. Dá para instalar como app no celular também.",
  },
];

export default function AjudaPage() {
  const wpp = suporteWhatsapp();
  const email = suporteEmail();
  const wppLink = `https://wa.me/${wpp}?text=${encodeURIComponent("Olá! Preciso de ajuda com o OrçaChat.")}`;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <h2 className="text-xl font-semibold text-tinta">Ajuda e suporte</h2>
        <p className="text-sm text-tinta-suave">Tire dúvidas ou fale com a gente</p>
      </header>

      <div className="max-w-3xl px-7 py-6">
        {/* Contato */}
        <div className="card mb-6 p-6">
          <h3 className="font-display text-lg font-semibold text-tinta">Precisa de ajuda?</h3>
          <p className="mt-1 text-sm text-tinta-suave">Fale com o suporte do OrçaChat — respondemos o quanto antes.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={wppLink} target="_blank" rel="noreferrer" className="btn bg-zap text-emerald-950 hover:brightness-105">
              💬 Falar no WhatsApp
            </a>
            <a href={`mailto:${email}`} className="btn btn-sec">
              ✉️ {email}
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="card p-6">
          <h3 className="mb-3 font-display text-lg font-semibold text-tinta">Perguntas frequentes</h3>
          <div className="divide-y divide-slate-100">
            {FAQ.map((f) => (
              <div key={f.q} className="py-3">
                <div className="font-semibold text-tinta">{f.q}</div>
                <p className="mt-1 text-sm text-tinta-suave">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
