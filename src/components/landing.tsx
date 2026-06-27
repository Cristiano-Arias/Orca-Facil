import Link from "next/link";

// Página pública de apresentação/vendas do OrçaChat.
// Foco: profissionais autônomos que fazem tudo pelo WhatsApp.
// Diferencial em destaque: orçamento em PDF profissional, direto no WhatsApp.

const PASSOS = [
  {
    icone: "💬",
    titulo: "Mande uma mensagem",
    texto:
      "Escreva o serviço numa frase, do seu jeito: “Pintura de apartamento 80 m² a R$ 28 o metro para a Maria, prazo 5 dias”.",
  },
  {
    icone: "🤖",
    titulo: "O OrçaChat monta",
    texto:
      "Ele entende o cliente, os itens e os valores, calcula tudo e ainda cadastra cliente e serviços sozinho.",
  },
  {
    icone: "📄",
    titulo: "Receba o orçamento em PDF",
    texto:
      "Uma proposta profissional, com a sua marca, pronta para enviar — mais um link onde o cliente aprova com um toque.",
  },
];

const RECURSOS = [
  { icone: "💬", titulo: "Tudo pelo WhatsApp", texto: "Sem formulário, sem planilha. Você fala e o orçamento nasce." },
  { icone: "📄", titulo: "PDF com a sua marca", texto: "Logo, cores e dados do seu negócio em cada proposta." },
  { icone: "✅", titulo: "Cliente aprova online", texto: "Link com botão de aprovar, recusar ou pedir ajuste." },
  { icone: "🧮", titulo: "Vários itens de uma vez", texto: "Mande vários serviços numa mensagem; ele separa e soma tudo." },
  { icone: "👥", titulo: "Clientes e serviços salvos", texto: "Cadastra na hora e lembra dos seus preços para a próxima." },
  { icone: "📊", titulo: "Painel de controle", texto: "Acompanhe propostas enviadas, aprovadas e o que entrou." },
];

const PROFISSOES = [
  "Pintores",
  "Eletricistas",
  "Encanadores",
  "Diaristas",
  "Marceneiros",
  "Refrigeração",
  "Jardinagem",
  "Pedreiros",
  "Montadores",
  "Vidraceiros",
  "Serviços gerais",
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-marca font-display text-lg font-bold text-white">O</div>
      <span className="font-display text-xl font-bold text-tinta">OrçaChat</span>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/entrar" className="btn btn-sec hidden sm:inline-flex">
              Entrar
            </Link>
            <Link href="/cadastrar" className="btn btn-primario">
              Criar conta grátis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-marca-clara to-white" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-marca-clara px-3 py-1 text-xs font-semibold text-marca">
              Para profissionais autônomos e MEIs
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] text-tinta sm:text-5xl">
              Orçamentos profissionais, <span className="text-marca">direto do seu WhatsApp</span>.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-tinta-suave">
              Mande os dados do serviço numa mensagem. O OrçaChat monta a proposta, gera o{" "}
              <strong className="text-tinta">PDF profissional</strong> e te devolve pronto para enviar ao cliente —
              tudo sem sair do WhatsApp.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/cadastrar" className="btn btn-primario px-6 py-3 text-base">
                Criar conta grátis
              </Link>
              <a href="#como-funciona" className="btn btn-sec px-6 py-3 text-base">
                Ver como funciona
              </a>
            </div>
            <p className="mt-3 text-sm text-tinta-suave">Grátis para começar · Sem cartão de crédito</p>
          </div>

          {/* Mockup de conversa no WhatsApp */}
          <div className="mx-auto w-full max-w-sm">
            <div className="rounded-[2rem] border-8 border-slate-900 bg-slate-900 shadow-2xl">
              <div className="overflow-hidden rounded-[1.4rem] bg-[#e6ddd4]">
                <div className="flex items-center gap-2 bg-[#075e54] px-4 py-3 text-white">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-sm font-bold">O</div>
                  <div className="text-sm font-semibold">OrçaChat</div>
                </div>
                <div className="space-y-2 px-3 py-4 text-[13px]">
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 text-slate-800 shadow-sm">
                    Orçamento pra Maria: pintura 80 m² a R$ 28 o metro, prazo 5 dias 👍
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-slate-800 shadow-sm">
                    ✅ Orçamento <strong>ORC-1042</strong> criado!
                    <br />
                    👤 Maria · 🎨 Pintura — 80 m²
                    <br />
                    💰 Total: <strong>R$ 2.240,00</strong>
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-2 py-2 text-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                      <div className="grid h-9 w-9 place-items-center rounded-md bg-rose-100 text-rose-600">PDF</div>
                      <div className="leading-tight">
                        <div className="font-semibold">Orçamento ORC-1042.pdf</div>
                        <div className="text-[11px] text-slate-500">Proposta profissional · 1 pág.</div>
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">📄 Pronto para enviar ao cliente</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-tinta sm:text-4xl">Como funciona</h2>
          <p className="mt-3 text-tinta-suave">Do recado ao orçamento pronto em segundos.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PASSOS.map((p, i) => (
            <div key={i} className="card relative p-6">
              <div className="absolute -top-3 left-6 grid h-7 w-7 place-items-center rounded-full bg-marca text-xs font-bold text-white">
                {i + 1}
              </div>
              <div className="text-3xl">{p.icone}</div>
              <h3 className="mt-3 font-display text-xl font-semibold text-tinta">{p.titulo}</h3>
              <p className="mt-2 text-sm text-tinta-suave">{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diferencial */}
      <section className="bg-marca">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 lg:grid-cols-2">
          <div className="text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              O nosso diferencial
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
              O orçamento em PDF, dentro do WhatsApp.
            </h2>
            <p className="mt-4 max-w-xl text-white/90">
              Enquanto outros apps te obrigam a abrir o computador e preencher formulários, aqui você fica onde já
              está: no WhatsApp. O orçamento volta como um <strong>PDF profissional</strong>, com a sua marca, pronto
              para repassar ao cliente na mesma conversa.
            </p>
            <ul className="mt-6 space-y-2 text-white/90">
              <li>✓ Nada de planilha ou formulário longo</li>
              <li>✓ Proposta com a sua identidade (logo e cores)</li>
              <li>✓ Cliente aprova por um link, sem complicação</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-xl">
            <div className="text-sm font-semibold text-tinta-suave">Antes × Depois</div>
            <div className="mt-3 grid gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-rose-500">Sem o OrçaChat</div>
                <p className="mt-1 text-sm text-tinta">
                  Abrir o computador, montar no Word/planilha, formatar, exportar PDF, achar o contato e enviar.
                </p>
              </div>
              <div className="rounded-xl bg-marca-clara p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-marca">Com o OrçaChat</div>
                <p className="mt-1 text-sm text-tinta">
                  Mandar uma mensagem. Receber o PDF pronto. Encaminhar para o cliente. ⏱️ segundos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-tinta sm:text-4xl">Tudo o que você precisa</h2>
          <p className="mt-3 text-tinta-suave">Feito para quem trabalha na rua e fecha negócio pelo celular.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map((r, i) => (
            <div key={i} className="card p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-marca-clara text-xl">{r.icone}</div>
              <h3 className="mt-3 font-display text-lg font-semibold text-tinta">{r.titulo}</h3>
              <p className="mt-1 text-sm text-tinta-suave">{r.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Para quem é */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="font-display text-3xl font-bold text-tinta sm:text-4xl">Para quem é o OrçaChat</h2>
          <p className="mt-3 text-tinta-suave">Se você faz serviço e manda orçamento, é para você.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {PROFISSOES.map((p) => (
              <span key={p} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-tinta">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="font-display text-3xl font-bold text-tinta sm:text-4xl">
          Pronto para impressionar seus clientes?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-tinta-suave">
          Crie sua conta grátis e mande seu primeiro orçamento pelo WhatsApp hoje mesmo.
        </p>
        <div className="mt-7 flex justify-center">
          <Link href="/cadastrar" className="btn btn-primario px-7 py-3 text-base">
            Criar conta grátis
          </Link>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <Logo />
          <div className="flex items-center gap-4 text-sm text-tinta-suave">
            <Link href="/entrar" className="hover:text-marca">
              Entrar
            </Link>
            <Link href="/cadastrar" className="hover:text-marca">
              Criar conta
            </Link>
          </div>
          <div className="text-xs text-tinta-suave">© {new Date().getFullYear()} OrçaChat · Orçamentos pelo WhatsApp</div>
        </div>
      </footer>
    </div>
  );
}
