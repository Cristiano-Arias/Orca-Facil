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

## Passo 2 — Publicar no Render (cria o app + o banco juntos)

O arquivo `render.yaml` já automatiza tudo:

1. Entre no **Render** (dashboard.render.com) e clique em **New +** → **Blueprint**.
2. Conecte/escolha o repositório `Orca-Facil`.
3. O Render vai ler o `render.yaml` e propor criar **dois recursos**:
   - **orca-facil** (o site/app)
   - **orca-facil-db** (o banco PostgreSQL)
4. Clique em **Apply**. O Render cria o banco, liga ele ao app (sozinho), gera o
   segredo de login e publica. A primeira publicação leva alguns minutos.
5. Quando terminar, clique no serviço **orca-facil** → no topo aparece a **URL**
   (algo como `https://orca-facil.onrender.com`). Esse é o link do seu app.

> Observação: no plano gratuito do Render, o app "dorme" quando fica sem uso e
> demora ~30 segundos para acordar no primeiro acesso. Normal.

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
| `DATABASE_URL` | conexão com o banco | criado pelo Render (orca-facil-db) |
| `AUTH_SECRET` | proteger o login | gerado pelo Render |

Se algum dia precisar rodar no seu PC: copie `.env.example` para `.env`, preencha
os dois valores, rode `npm install` e `npm run dev`.
