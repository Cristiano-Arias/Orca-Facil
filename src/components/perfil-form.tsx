"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRef, useState } from "react";
import { salvarPerfil, type EstadoPerfil } from "@/app/actions/profile";

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
};

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primario" disabled={pending}>
      {pending ? "Salvando…" : "Salvar perfil"}
    </button>
  );
}

export default function PerfilForm({ perfil }: { perfil: PerfilDados }) {
  const [estado, formAction] = useFormState<EstadoPerfil, FormData>(salvarPerfil, {});
  const [logo, setLogo] = useState<string | null>(perfil.logo_data_url ?? null);
  const logoInput = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(f);
  }

  return (
    <form action={formAction} className="card max-w-2xl p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-marca-clara font-display text-2xl font-bold text-marca">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="logo" className="h-full w-full object-cover" />
          ) : (
            (perfil.nome_comercial || "O").trim().charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="btn btn-sec cursor-pointer">
            📤 Enviar logotipo
            <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
          {logo && (
            <button type="button" className="btn btn-sec" onClick={() => setLogo("__remover__")}>
              Remover
            </button>
          )}
        </div>
      </div>
      {/* leva o logo (data URL) junto com o formulário */}
      <input type="hidden" name="logo_data_url" value={logo ?? ""} />

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

      {estado?.ok && (
        <div className="mb-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
          Perfil salvo! Suas próximas propostas já usam esses dados.
        </div>
      )}
      {estado?.erro && (
        <div className="mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{estado.erro}</div>
      )}

      <Botao />
    </form>
  );
}
