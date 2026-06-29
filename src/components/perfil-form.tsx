"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { salvarPerfil, type EstadoPerfil } from "@/app/actions/profile";
import { PALETA, corValida, gradienteMarca, textoSobre } from "@/lib/proposal-format";
import LogoMarca, { ICONES_SUGERIDOS } from "@/components/logo-marca";

export type PerfilDados = {
  nome_comercial?: string | null;
  responsavel?: string | null;
  telefone?: string | null;
  email?: string | null;
  documento?: string | null;
  endereco?: string | null;
  pix?: string | null;
  validade_padrao?: number | null;
  logo_data_url?: string | null;
  cor?: string | null;
  whatsapp?: string | null;
  logo_fundo?: string | null;
  logo_formato?: string | null;
  logo_emoji?: string | null;
  pagamento_padrao?: string | null;
  garantia_padrao?: string | null;
  prazo_padrao?: string | null;
  obs_padrao?: string | null;
};

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primario" disabled={pending}>
      {pending ? "Salvando…" : "Salvar perfil"}
    </button>
  );
}

// extrai a cor predominante (mais marcante) de uma imagem
function corDominante(img: HTMLImageElement): string | null {
  try {
    const cv = document.createElement("canvas");
    const w = 48, h = 48;
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const buckets = new Map<string, { c: number; r: number; g: number; b: number }>();
    let best: { c: number; r: number; g: number; b: number } | null = null;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 200) continue;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      if (max > 235 && min > 235) continue; // quase branco
      if (max < 25) continue; // quase preto
      const sat = max === 0 ? 0 : (max - min) / max;
      if (sat < 0.12) continue; // cinza
      const key = `${Math.round(r / 24)},${Math.round(g / 24)},${Math.round(b / 24)}`;
      const cur = buckets.get(key) ?? { c: 0, r: 0, g: 0, b: 0 };
      cur.c++; cur.r += r; cur.g += g; cur.b += b;
      buckets.set(key, cur);
      if (!best || cur.c > best.c) best = cur;
    }
    if (!best) return null;
    const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
    return "#" + hex(best.r / best.c) + hex(best.g / best.c) + hex(best.b / best.c);
  } catch {
    return null;
  }
}

export default function PerfilForm({ perfil }: { perfil: PerfilDados }) {
  const [estado, formAction] = useFormState<EstadoPerfil, FormData>(salvarPerfil, {});
  const [logo, setLogo] = useState<string | null>(perfil.logo_data_url ?? null);
  const [cor, setCor] = useState<string>(corValida(perfil.cor));
  const [corLogo, setCorLogo] = useState<string | null>(null);
  const [fundo, setFundo] = useState<string>(perfil.logo_fundo === "transparente" ? "transparente" : "branco");
  const [formato, setFormato] = useState<string>(perfil.logo_formato === "redondo" ? "redondo" : "quadrado");
  const [emoji, setEmoji] = useState<string>(perfil.logo_emoji ?? "");
  const temLogo = !!logo && logo !== "__remover__";

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setLogo(url);
      const img = new Image();
      img.onload = () => setCorLogo(corDominante(img));
      img.src = url;
    };
    reader.readAsDataURL(f);
  }

  const nomePrev = perfil.nome_comercial || "Sua empresa";
  const inicial = nomePrev.trim().charAt(0).toUpperCase();

  return (
    <form action={formAction} className="grid max-w-4xl gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card p-6">
        {/* Logo / marca */}
        <div className="mb-6 rounded-xl border border-slate-200 p-4">
          <div className="mb-3 text-sm font-semibold text-tinta">Logo / marca</div>

          <div className="flex items-center gap-4">
            {/* prévia do logo dentro de um fundo na cor da marca, como na proposta */}
            <div className="grid place-items-center rounded-xl p-2" style={{ background: gradienteMarca(cor) }}>
              <LogoMarca logo={logo} emoji={temLogo ? null : emoji} nome={nomePrev} cor={cor} fundo={fundo} formato={formato} size={56} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="btn btn-sec cursor-pointer">
                📤 Enviar logotipo
                <input type="file" accept="image/*" className="hidden" onChange={onFile} />
              </label>
              {temLogo && (
                <button type="button" className="btn btn-sec" onClick={() => { setLogo("__remover__"); setCorLogo(null); }}>
                  Remover
                </button>
              )}
            </div>
          </div>
          <input type="hidden" name="logo_data_url" value={logo ?? ""} />
          <input type="hidden" name="logo_fundo" value={fundo} />
          <input type="hidden" name="logo_formato" value={formato} />
          <input type="hidden" name="logo_emoji" value={temLogo ? "" : emoji} />

          {/* opções de exibição (valem para logo, ícone ou iniciais) */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold text-tinta-suave">Fundo</div>
              <div className="flex gap-2">
                {[["branco", "Branco"], ["transparente", "Transparente"]].map(([v, lbl]) => (
                  <button key={v} type="button" onClick={() => setFundo(v)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-sm ${fundo === v ? "border-marca bg-marca-clara font-semibold text-marca" : "border-slate-300 text-tinta"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-tinta-suave">Formato</div>
              <div className="flex gap-2">
                {[["quadrado", "Quadrado"], ["redondo", "Redondo"]].map(([v, lbl]) => (
                  <button key={v} type="button" onClick={() => setFormato(v)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-sm ${formato === v ? "border-marca bg-marca-clara font-semibold text-marca" : "border-slate-300 text-tinta"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* sem logo enviado → sugestões de ícone por profissão */}
          {!temLogo && (
            <div className="mt-4">
              <div className="mb-1 text-xs font-semibold text-tinta-suave">
                Não tem logo? Escolha um ícone (ou use suas iniciais)
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setEmoji("")} title="Usar iniciais"
                  className={`grid h-10 w-10 place-items-center rounded-lg border font-display font-bold ${emoji === "" ? "border-marca bg-marca-clara text-marca" : "border-slate-300 text-tinta"}`}>
                  {inicial}
                </button>
                {ICONES_SUGERIDOS.map((ic) => (
                  <button key={ic.emoji} type="button" onClick={() => setEmoji(ic.emoji)} title={ic.rotulo}
                    className={`grid h-10 w-10 place-items-center rounded-lg border text-xl ${emoji === ic.emoji ? "border-marca bg-marca-clara" : "border-slate-300"}`}>
                    {ic.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cor da marca */}
        <div className="mb-6 rounded-xl border border-slate-200 p-4">
          <div className="mb-1 text-sm font-semibold text-tinta">Cor da marca</div>
          <p className="mb-3 text-xs text-tinta-suave">Usada no topo e no total das suas propostas.</p>

          {corLogo && corLogo.toLowerCase() !== cor.toLowerCase() && (
            <button
              type="button"
              onClick={() => setCor(corLogo)}
              className="mb-3 flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm hover:border-marca"
            >
              <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: corLogo }} />
              Usar a cor do seu logo ({corLogo})
            </button>
          )}

          <div className="mb-3 flex flex-wrap gap-2">
            {PALETA.map((p) => (
              <button
                key={p.cor}
                type="button"
                title={p.nome}
                onClick={() => setCor(p.cor)}
                className={`h-8 w-8 rounded-full ring-2 transition ${
                  cor.toLowerCase() === p.cor.toLowerCase() ? "ring-offset-2 ring-tinta" : "ring-transparent"
                }`}
                style={{ background: p.cor }}
              />
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-tinta">
            <input
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
            />
            Cor personalizada ({cor})
          </label>
          <input type="hidden" name="cor" value={cor} />
        </div>

        {/* WhatsApp do profissional */}
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <label className="mb-1 block text-sm font-semibold text-emerald-900">
            📱 Seu WhatsApp (para criar orçamentos por mensagem)
          </label>
          <input
            name="whatsapp"
            defaultValue={perfil.whatsapp ?? ""}
            placeholder="Ex.: (85) 99789-1302"
            className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <p className="mt-1 text-xs text-emerald-800">
            É o número de onde você vai mandar mensagens para o OrçaChat criar os orçamentos.
          </p>
        </div>

        {/* Dados */}
        <div className="campo">
          <label>Nome comercial / empresa</label>
          <input name="nome_comercial" defaultValue={perfil.nome_comercial ?? ""} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="campo">
            <label>Responsável</label>
            <input name="responsavel" defaultValue={perfil.responsavel ?? ""} />
          </div>
          <div className="campo">
            <label>Telefone / WhatsApp</label>
            <input name="telefone" defaultValue={perfil.telefone ?? ""} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="campo">
            <label>E-mail</label>
            <input name="email" defaultValue={perfil.email ?? ""} />
          </div>
          <div className="campo">
            <label>CNPJ ou CPF (opcional)</label>
            <input name="documento" defaultValue={perfil.documento ?? ""} />
          </div>
        </div>
        <div className="campo">
          <label>Endereço (opcional)</label>
          <input name="endereco" defaultValue={perfil.endereco ?? ""} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="campo">
            <label>Chave Pix (aparece no rodapé)</label>
            <input name="pix" defaultValue={perfil.pix ?? ""} />
          </div>
          <div className="campo">
            <label>Validade padrão (dias)</label>
            <input name="validade_padrao" type="number" defaultValue={perfil.validade_padrao ?? 7} />
          </div>
        </div>

        {/* Padrões dos orçamentos — entram automaticamente em toda proposta */}
        <div className="mb-2 mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-tinta">Padrões dos orçamentos</div>
          <p className="mb-3 text-xs text-tinta-suave">
            Entram automaticamente em toda proposta (você pode mudar em cada uma). Deixe em branco o que não usa.
          </p>
          <div className="campo">
            <label>Forma de pagamento padrão</label>
            <input name="pagamento_padrao" defaultValue={perfil.pagamento_padrao ?? ""} placeholder="Ex.: 50% de entrada e 50% na entrega" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="campo mb-0">
              <label>Garantia padrão</label>
              <input name="garantia_padrao" defaultValue={perfil.garantia_padrao ?? ""} placeholder="Ex.: 90 dias" />
            </div>
            <div className="campo mb-0">
              <label>Prazo de execução padrão</label>
              <input name="prazo_padrao" defaultValue={perfil.prazo_padrao ?? ""} placeholder="Ex.: 5 dias úteis" />
            </div>
          </div>
          <div className="campo mb-0 mt-3">
            <label>Observação padrão (o que está incluso)</label>
            <input name="obs_padrao" defaultValue={perfil.obs_padrao ?? ""} placeholder="Ex.: Inclui material e mão de obra" />
          </div>
        </div>

        {estado?.ok && (
          <div className="mb-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
            Perfil salvo! Suas próximas propostas já usam esses dados.
          </div>
        )}
        {estado?.erro && (
          <div className="mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{estado.erro}</div>
        )}
        <Botao />
      </div>

      {/* Pré-visualização ao vivo */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-suave">Pré-visualização</div>
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
          <div
            className="flex items-center gap-3 px-5 py-5"
            style={{ background: gradienteMarca(cor), color: textoSobre(cor) }}
          >
            <LogoMarca logo={logo} emoji={temLogo ? null : emoji} nome={nomePrev} cor={cor} fundo={fundo} formato={formato} size={48} />
            <div>
              <div className="font-display text-base font-semibold leading-tight">{nomePrev}</div>
              <div className="text-[11px] opacity-90">PROPOSTA · ORC-1001</div>
            </div>
          </div>
          <div className="bg-white px-5 py-4 text-sm text-slate-600">
            <div className="mb-2">Pintura de apartamento — 80 m²</div>
            <div className="flex items-center justify-between border-t-2 pt-2 font-display font-bold" style={{ borderColor: cor }}>
              <span className="text-tinta">Total</span>
              <span style={{ color: cor }}>R$ 2.240,00</span>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-tinta-suave">É assim que o cliente verá o topo e o total da proposta.</p>
      </div>
    </form>
  );
}
