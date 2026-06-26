import { lerSessao } from "@/lib/auth";
import { uma } from "@/lib/db";
import PerfilForm, { type PerfilDados } from "@/components/perfil-form";

export default async function PerfilPage() {
  const sessao = await lerSessao();
  const perfil =
    (await uma<PerfilDados>(
      "SELECT nome_comercial, responsavel, telefone, email, documento, endereco, pix, validade_padrao, logo_data_url, cor, whatsapp FROM orcafacil.profile WHERE org_id = $1",
      [sessao!.orgId]
    )) ?? {};

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--bg)] px-7 py-4">
        <h2 className="text-xl font-semibold text-tinta">Meu perfil</h2>
        <p className="text-sm text-tinta-suave">Aparece no topo de todas as suas propostas</p>
      </header>
      <div className="px-7 py-6">
        <PerfilForm perfil={perfil} />
      </div>
    </>
  );
}
