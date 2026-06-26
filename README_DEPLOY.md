# Orça Fácil — App na nuvem (Fase 1, parte 1)

Este é o **app de verdade** do Orça Fácil (Next.js + PostgreSQL). Esta primeira
parte traz: **criar conta, login** e o **painel** protegido. Os dados ficam na
nuvem — acessíveis pelo celular e pelo PC com o mesmo login.

> As próximas partes (criar orçamento por texto, proposta em PDF, página do
> cliente, assistente do WhatsApp) entram em cima desta base.

---

## Passo 1 — Colocar o código no GitHub (pelo GitHub Desktop)

1. Abra o **GitHub Desktop** no repositório `Orca-Facil` (Repository → Show in Explorer).
2. **Copie para dentro da pasta** todo o conteúdo desta pasta `orca-facil-app`
   (todos os arquivos e subpastas — **menos** `node_modules`, que nem deve existir aqui).
3. Volte ao GitHub Desktop: vão aparecer vários arquivos em **Changes**.
4. Em *Summary* escreva `App Orça Fácil — login e painel` → **Commit to main** → **Push origin**.

Pronto, o código está no GitHub.

---

## Passo 2 — Publicar no Render (reaproveitando seu banco atual)

> ⚠️ O plano gratuito do Render permite **apenas 1 banco de dados**. Como você já
> tem um, o Orça Fácil vai **usar o mesmo banco**, guardando seus dados numa área
> separada (um *schema* chamado `orcafacil`) — sem mexer no outro projeto.

**2.1 — Pegue o endereço do seu banco atual**
1. No Render, abra o seu banco PostgreSQL existente.
2. Em **Connections**, copie a **Internal Database URL** (começa com `postgresql://`).
   Guarde — você vai colar no passo 2.3.

**2.2 — Crie o app pelo blueprint**
1. No Render, clique em **New +** → **Blueprint**.
2. Escolha o repositório `Orca-Facil` e clique em **Apply**.
3. O Render vai ler o `render.yaml` e criar **só o app** (`orca-facil`). Ele vai
   **pedir o valor de `DATABASE_URL`** (porque marcamos para você informar).

**2.3 — Informe o banco**
1. No campo **DATABASE_URL**, cole a **Internal Database URL** que você copiou no 2.1.
2. O `AUTH_SECRET` o Render gera sozinho. Confirme/Apply.
3. A primeira publicação leva alguns minutos. Ao subir, o app cria sozinho as
   tabelas dele dentro do schema `orcafacil`.
4. Clique no serviço **orca-facil** → no topo aparece a **URL**
   (algo como `https://orca-facil.onrender.com`). Esse é o link do seu app.

> Observação: no plano gratuito o app "dorme" sem uso e demora ~30 s para acordar
> no primeiro acesso. Normal.

> Alternativa (se preferir um banco só pro Orça Fácil): apague o banco antigo que
> não usa mais e troque, no `render.yaml`, o bloco de `DATABASE_URL` por um banco
> novo. Mas o caminho acima (reaproveitar) é o mais seguro e não apaga nada.

---

## Passo 3 — Testar

1. Abra a URL no celular **e** no PC.
2. Clique em **Criar conta**, informe nome, e-mail e senha.
3. Você cai no **Painel**. Faça logout e entre de novo para confirmar o login.
4. Teste com o mesmo login nos dois aparelhos — os dados são os mesmos (estão na nuvem). ✅

---

## O que cada coisa faz (resumo simples)

- **Next.js**: o app em si (telas + parte do servidor).
- **PostgreSQL (no Render)**: onde ficam guardados contas e, em breve, orçamentos.
- **AUTH_SECRET**: uma senha interna que protege o login (o Render gera sozinho).
- **render.yaml**: a "receita" que diz ao Render o que criar.

---

## Variáveis de ambiente (o Render preenche sozinho pelo blueprint)

| Nome | Para que serve | De onde vem |
|---|---|---|
| `DATABASE_URL` | conexão com o banco | a Internal Database URL do seu banco existente (você cola) |
| `AUTH_SECRET` | proteger o login | gerado pelo Render |

Se algum dia precisar rodar no seu PC: copie `.env.example` para `.env`, preencha
os dois valores, rode `npm install` e `npm run dev`.

---

## Parte 2 — Criar orçamento por texto + proposta (já incluída)

O que entra nesta versão:

- **Novo orçamento por texto**: em **Propostas → + Novo orçamento**, escreva uma frase
  (ex.: *"Orçamento para João, pintura de apartamento, 80 m², R$ 28 por metro,
  prazo 5 dias, pagamento 50% entrada e 50% na entrega"*). O sistema entende,
  **cria cliente e serviço sozinho** e monta a proposta.
- **Proposta profissional** com seu logo/dados (configure em **Meu perfil**),
  itens, totais, condições, e botão **Baixar PDF** (impressão).
- **Link do cliente**: cada proposta tem uma página pública (`/p/...`) onde o
  cliente pode **Aprovar**, **Solicitar ajuste** ou **Recusar** — o status atualiza sozinho.
- **Clientes** e **Serviços** com histórico (o sistema aprende seus preços).

> Para publicar esta versão: substitua os arquivos no repositório (GitHub Desktop →
> Commit → Push). O Render **republica sozinho**. Não precisa de novas variáveis.

### (Opcional) Deixar a interpretação ainda mais esperta com IA

Por padrão, o Orça Fácil usa um **interpretador embutido** (funciona sem custo).
Se quiser usar a IA da Anthropic (entende frases mais soltas, gírias, erros de
digitação), adicione no Render (**Environment**) a variável:

| Nome | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | sua chave da Anthropic (console.anthropic.com) |

Sem essa chave, tudo continua funcionando com o interpretador embutido. Se a IA
falhar por qualquer motivo, o app cai automaticamente no interpretador — nunca quebra.
