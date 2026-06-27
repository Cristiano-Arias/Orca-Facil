/* eslint-disable jsx-a11y/alt-text */
// Gera o PDF da proposta no servidor (biblioteca pura, sem navegador).
// Usado pela rota /p/[id]/pdf e pelo envio de documento no WhatsApp.
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { brl, brData, corValida, textoSobre } from "./proposal-format";
import type { DocPerfil, DocProposta, DocCliente, DocItem } from "@/components/proposal-doc";

const cinza = "#64748b";
const linha = "#e2e8f0";

function estilos(cor: string) {
  const txtHead = textoSobre(cor);
  return StyleSheet.create({
    page: { paddingBottom: 48, fontSize: 10, color: "#0f172a", fontFamily: "Helvetica" },
    header: {
      backgroundColor: cor,
      color: txtHead,
      paddingHorizontal: 28,
      paddingVertical: 22,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, maxWidth: 320 },
    logoBox: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      padding: 3,
    },
    logoImg: { width: 34, height: 34, objectFit: "contain" },
    logoLetra: { color: cor, fontSize: 20, fontFamily: "Helvetica-Bold" },
    nome: { fontSize: 15, fontFamily: "Helvetica-Bold", color: txtHead },
    headLinha: { fontSize: 9, color: txtHead, opacity: 0.9 },
    headRight: { textAlign: "right", color: txtHead },
    headNum: { fontSize: 13, fontFamily: "Helvetica-Bold", color: txtHead },
    corpo: { paddingHorizontal: 28, paddingTop: 18 },
    rotulo: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", marginBottom: 3, fontFamily: "Helvetica-Bold" },
    secao: { marginBottom: 16 },
    clienteNome: { fontSize: 12, fontFamily: "Helvetica-Bold" },
    tHead: { flexDirection: "row", borderBottomWidth: 1.5, borderColor: linha, paddingBottom: 5 },
    tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: linha, paddingVertical: 6 },
    cDesc: { width: "46%" },
    cQtd: { width: "18%", textAlign: "right" },
    cUnit: { width: "18%", textAlign: "right" },
    cTot: { width: "18%", textAlign: "right" },
    thTxt: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", fontFamily: "Helvetica-Bold" },
    totBox: { marginTop: 10, marginLeft: "auto", width: 200 },
    totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
    totFinal: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1.5,
      borderColor: "#0f172a",
      marginTop: 4,
      paddingTop: 5,
    },
    totFinalTxt: { fontSize: 13, fontFamily: "Helvetica-Bold" },
    grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
    campo: { width: "50%", marginBottom: 10 },
    campoVal: { fontSize: 10 },
    rodape: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      borderTopWidth: 1,
      borderColor: linha,
      backgroundColor: "#f8fafc",
      paddingHorizontal: 28,
      paddingVertical: 12,
      textAlign: "center",
      fontSize: 8,
      color: cinza,
    },
  });
}

type Dados = { perfil: DocPerfil; proposta: DocProposta; cliente: DocCliente; itens: DocItem[] };

function ehImagem(s?: string | null): s is string {
  return !!s && /^data:image\/(png|jpe?g)/i.test(s);
}

function PropostaPDF({ perfil, proposta, cliente, itens }: Dados) {
  const cor = corValida(perfil.cor);
  const s = estilos(cor);
  const nome = perfil.nome_comercial || "Profissional";
  const inicial = (nome || "O").trim().charAt(0).toUpperCase();
  const bruto = itens.reduce((acc, i) => acc + i.qtd * i.preco, 0);
  const total = bruto - (proposta.desconto || 0);
  const emitido = new Date(proposta.emitido_em);
  const venc = new Date(emitido);
  venc.setDate(venc.getDate() + (proposta.validade_dias || 7));

  return (
    <Document title={`Orçamento ${proposta.numero}`} author={nome}>
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View style={s.headerLeft}>
            <View style={s.logoBox}>
              {ehImagem(perfil.logo_data_url) ? (
                <Image style={s.logoImg} src={perfil.logo_data_url} />
              ) : (
                <Text style={s.logoLetra}>{inicial}</Text>
              )}
            </View>
            <View>
              <Text style={s.nome}>{nome}</Text>
              {perfil.responsavel ? <Text style={s.headLinha}>{perfil.responsavel}</Text> : null}
              <Text style={s.headLinha}>
                {perfil.telefone || ""}
                {perfil.email ? ` · ${perfil.email}` : ""}
              </Text>
              {perfil.documento ? <Text style={s.headLinha}>{perfil.documento}</Text> : null}
            </View>
          </View>
          <View style={s.headRight}>
            <Text style={s.headLinha}>PROPOSTA</Text>
            <Text style={s.headNum}>{proposta.numero}</Text>
            <Text style={s.headLinha}>Emissão: {brData(emitido)}</Text>
            <Text style={s.headLinha}>Validade: {brData(venc)}</Text>
          </View>
        </View>

        <View style={s.corpo}>
          <View style={s.secao}>
            <Text style={s.rotulo}>Cliente</Text>
            <Text style={s.clienteNome}>{cliente?.nome || "—"}</Text>
            {cliente?.telefone || cliente?.endereco ? (
              <Text style={{ color: cinza }}>
                {cliente?.telefone || ""}
                {cliente?.endereco ? ` · ${cliente.endereco}` : ""}
              </Text>
            ) : null}
          </View>

          <View style={s.secao}>
            <Text style={s.rotulo}>Escopo / itens</Text>
            <View style={s.tHead}>
              <Text style={[s.cDesc, s.thTxt]}>Descrição</Text>
              <Text style={[s.cQtd, s.thTxt]}>Qtd</Text>
              <Text style={[s.cUnit, s.thTxt]}>Unitário</Text>
              <Text style={[s.cTot, s.thTxt]}>Total</Text>
            </View>
            {itens.map((i, idx) => (
              <View style={s.tRow} key={idx} wrap={false}>
                <Text style={s.cDesc}>{i.descricao}</Text>
                <Text style={s.cQtd}>
                  {i.qtd} {i.unidade}
                </Text>
                <Text style={s.cUnit}>{brl(i.preco)}</Text>
                <Text style={s.cTot}>{brl(i.qtd * i.preco)}</Text>
              </View>
            ))}
            <View style={s.totBox}>
              <View style={s.totRow}>
                <Text>Subtotal</Text>
                <Text>{brl(bruto)}</Text>
              </View>
              {proposta.desconto > 0 ? (
                <View style={s.totRow}>
                  <Text>Desconto</Text>
                  <Text>− {brl(proposta.desconto)}</Text>
                </View>
              ) : null}
              <View style={s.totFinal}>
                <Text style={s.totFinalTxt}>Total</Text>
                <Text style={[s.totFinalTxt, { color: cor }]}>{brl(total)}</Text>
              </View>
            </View>
          </View>

          <View style={s.grid}>
            <Campo s={s} k="Prazo de execução" v={proposta.prazo || "a combinar"} />
            <Campo s={s} k="Pagamento" v={proposta.pagamento || "a combinar"} />
            <Campo s={s} k="Garantia" v={proposta.garantia || "—"} />
            <Campo s={s} k="Validade" v={`${proposta.validade_dias} dias (até ${brData(venc)})`} />
          </View>

          {proposta.obs ? (
            <View style={s.secao}>
              <Text style={s.rotulo}>Observações</Text>
              <Text>{proposta.obs}</Text>
            </View>
          ) : null}
        </View>

        <Text style={s.rodape} fixed>
          {nome}
          {perfil.telefone ? ` · ${perfil.telefone}` : ""}
          {perfil.pix ? ` · Pix: ${perfil.pix}` : ""} — Proposta gerada pelo OrçaChat
        </Text>
      </Page>
    </Document>
  );
}

function Campo({ s, k, v }: { s: ReturnType<typeof estilos>; k: string; v: string }) {
  return (
    <View style={s.campo}>
      <Text style={s.rotulo}>{k}</Text>
      <Text style={s.campoVal}>{v}</Text>
    </View>
  );
}

// Gera o PDF e devolve um Buffer (Node) pronto para servir/enviar.
export async function gerarPdfProposta(dados: Dados): Promise<Buffer> {
  return renderToBuffer(<PropostaPDF {...dados} />);
}
