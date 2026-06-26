# Orça Fácil — Orçamentos e propostas pelo WhatsApp

> Documento de produto + blueprint técnico do **Orça Fácil**: um SaaS que cria
> orçamentos e propostas comerciais profissionais a partir de mensagens de
> WhatsApp (texto, áudio, fotos e documentos).
>
> **Comece pelo protótipo:** abra o arquivo **`orca-facil.html`** no navegador
> (basta dar dois cliques). Ele já demonstra, funcionando, o fluxo principal:
> conversar pelo "WhatsApp", criar a proposta automaticamente, gerar o PDF,
> ver a página do cliente, registrar pagamentos e acompanhar o painel.

---

## 1. Para que serve (em uma frase)

O profissional **não preenche cadastro**. Ele manda uma mensagem no WhatsApp
("orçamento para o João, pintura, 80 m², R$ 28 o metro") e o Orça Fácil entende,
**pergunta só o que faltar**, monta a proposta com a marca dele, gera PDF e link,
e **cria sozinho** os cadastros de cliente, serviço e preço pelo caminho.

Público: autônomos, MEIs e pequenas empresas (pintores, eletricistas, técnicos
de ar-condicionado, marceneiros, diaristas, etc.).

---

## 2. Princípio central: cadastro progressivo e automático

Nada de formulário longo no início. A cada orçamento o sistema **detecta, salva e
organiza** automaticamente:

| O que é capturado | De onde vem | O que o sistema faz |
|---|---|---|
| Dados do cliente | "para o João Silva, (11) 9..." | cria/atualiza o cadastro e vincula ao histórico |
| Tipo de serviço | "pintura de apartamento" | cria/atualiza o serviço no catálogo |
| Preço praticado | "R$ 28 o metro" | guarda no histórico de preços e sugere depois |
| Condições (prazo, pagamento, garantia, validade) | a frase | preenche a proposta; vira padrão do profissional |
| Fotos / anexos | mídia enviada | anexa à proposta (com confirmação) |
| Dados do profissional | perguntados aos poucos | montam o perfil/topo da proposta |

**Exemplo real (já funciona no protótipo):**
"Cliente Maria, instalação de 2 ar-condicionados split, R$ 650 cada, garantia 90 dias"
→ cria a cliente Maria, o serviço "instalação de ar-condicionado split" com preço
histórico R$ 650/un e garantia padrão de 90 dias, e abre o orçamento em rascunho.

---

## 3. Fluxo principal pelo WhatsApp

```
1. Profissional envia mensagem (texto/áudio/foto)
2. IA interpreta e classifica a intenção
        (novo orçamento? pagamento? consulta? alteração?)
3. Sistema extrai os campos que conseguir
4. Pergunta SOMENTE o que faltar (uma coisa de cada vez)
5. Mostra um RESUMO para conferência
6. Profissional confirma (1 = gerar/salvar, 2 = enviar ao cliente, ...)
7. Gera a proposta (layout + logo) e o PDF
8. Envia link/PDF ao cliente (mensagem pronta)
9. Cliente aprova / recusa / pede ajuste na página pública
10. Status atualiza automaticamente; profissional é avisado
```

### Roteador de intenção (o "cérebro" da conversa)

A mensagem cai em uma destas rotas:

- **Novo orçamento / proposta** → coleta de campos → resumo → confirmação.
- **Registrar pagamento** ("recebi R$ 500 da Maria via Pix") → acha a proposta em
  aberto do cliente e lança o recebimento (pergunta qual, se houver mais de uma).
- **Consulta** ("quanto vendi esse mês?", "quais propostas estão pendentes?").
- **Ação rápida** ("duplicar proposta", "reenviar para a Maria", "transformar em
  ordem de serviço", "colocar desconto de 10%", "alterar prazo para 7 dias").
- **Mídia** → áudio (transcreve → mesmo roteador) / foto/PDF (OCR + visão).

> No protótipo isso é feito com regras (regex em português). **Em produção**, o
> roteador e a extração de campos usam a **API da Anthropic (Claude)**, que é mais
> robusta com linguagem natural, gírias e erros de digitação. As regras ficam como
> rede de segurança e para reduzir custo.

### Regra de ouro da confirmação

Para **áudio e imagens** (onde a interpretação é menos certa), **sempre confirmar
os campos antes de gravar/enviar**:
"Confirma: troca de 6 tomadas + 2 luminárias, total R$ 480, Pix, amanhã? (Sim/Não)".

---

## 4. Telas do painel (app web/mobile)

Apesar de a entrada principal ser o WhatsApp, existe um painel para consultar e
ajustar. Telas (todas presentes no protótipo):

1. **Assistente** — o WhatsApp dentro do app (para testar e usar pelo navegador).
2. **Painel** — KPIs e gráficos (ver seção 8).
3. **Propostas** — lista com filtros por status; abrir → ver documento → gerar PDF,
   mudar status, ver página do cliente, enviar.
4. **Clientes** — criados automaticamente; histórico de propostas e valores por cliente.
5. **Serviços** — catálogo com preço padrão, margem estimada e histórico de preços.
6. **Meu perfil** — logotipo, nome comercial, telefone, Pix, documento, modelo da
   proposta. Aparece no topo de toda proposta.

---

## 5. Estados (status) da proposta

`RASCUNHO → AGUARDANDO → ENVIADA → VISUALIZADA → EM NEGOCIAÇÃO → APROVADA`
e também: `RECUSADA`, `VENCIDA` (passou da validade), `CANCELADA`,
`CONVERTIDA` (virou ordem de serviço), `PAGA PARCIALMENTE`, `PAGA`.

O status muda pelo WhatsApp, pela página do cliente (aprovar/recusar) ou
automaticamente (ex.: vence sozinha ao passar a validade).

---

## 6. Modelo de proposta e PDF

Cabeçalho com **logotipo + dados do profissional**; número e datas; **dados do
cliente**; **tabela de itens** (descrição, quantidade, unitário, total); subtotal,
desconto e **total**; **condições** (prazo, pagamento, garantia, validade);
**fotos** de referência; observações; rodapé com Pix; e, na página pública, os
botões **Aprovar / Solicitar ajuste / Falar no WhatsApp**.

Modelos visuais previstos: *Simples, Profissional, Moderno, Técnico, Comercial*
(com/sem fotos, tabela detalhada ou resumo executivo).

**Geração de PDF:** no protótipo, `imprimir → salvar como PDF` (CSS de impressão
já incluso). Em produção, gerar no servidor com **Playwright/Puppeteer** (renderiza
o mesmo HTML em PDF de alta qualidade) e guardar o arquivo na nuvem.

---

## 7. Página pública do cliente

Link curto por proposta (ex.: `orcafacil.app/p/orc-2006`). O cliente vê a proposta,
clica em **Aprovar** (confirma nome/telefone + aceite com data/hora), **Solicitar
ajuste** ou **Falar no WhatsApp**. Ao aprovar, o profissional recebe um aviso e pode
**converter em ordem de serviço** com um toque.

---

## 8. Dashboard (KPIs e gráficos)

KPIs: propostas no mês, total orçado, aprovado, recebido, **a receber**, taxa de
conversão, ticket médio, pendentes, vencidas, top cliente.

Gráficos: **Orçado × Aprovado × Recebido**, **Propostas por status** (rosca),
**Top serviços** por valor aprovado, **Funil comercial** (criadas → enviadas →
aprovadas → pagas). Também: receita mensal, top clientes e margem por serviço.

---

## 9. Controle financeiro e precificação inteligente

- Lança recebimentos por mensagem ("recebi R$ 500 da Maria"); calcula **recebido**,
  **a receber**, **quitada/parcial**.
- Acompanha total orçado/aprovado/recebido, custos, **lucro e margem estimados**,
  pendências e descontos.
- **Alerta de margem**: ao montar a proposta, se a margem estimada ficar baixa
  (ex.: < 15%), o sistema avisa e sugere o preço mínimo para a margem desejada.

---

## 10. Alertas proativos (WhatsApp)

"A proposta da Maria vence amanhã", "o João ainda não respondeu", "você tem
R$ 1.200 em pagamentos pendentes", "a proposta de R$ 3.500 foi aprovada", "você
vendeu R$ 8.400 este mês". Fora da janela de 24h do WhatsApp, esses avisos usam
**templates aprovados pela Meta**.

---

## 11. Banco de dados (modelo lógico)

Multi-tenant: **todo registro pertence a um profissional/organização** e nunca
vaza entre contas. Esboço (PostgreSQL + Prisma):

```
Organization (org)         — a conta do profissional/empresa
  └─ User                  — login(s) da conta
  └─ Profile               — nome comercial, logo, telefone, Pix, doc, modelo padrão
  └─ Client                — nome, telefone, email, endereço, obs
  └─ Service               — nome, unidade, preço padrão, custo, garantia padrão
       └─ PriceHistory     — preços praticados ao longo do tempo
  └─ Proposal              — número, status, datas, validade, prazo, pagamento,
       │                      garantia, desconto, observações, modelo visual
       ├─ ProposalItem     — descrição, qtd, unidade, preço unitário, custo
       ├─ Attachment       — fotos/PDF (URL no storage), origem (foto/ocr)
       ├─ Payment          — data, valor, forma (Pix/cartão/dinheiro)
       ├─ Approval         — nome/telefone do cliente, aceite, data/hora
       └─ Event            — histórico (criada, enviada, vista, aprovada, ...)
  └─ ServiceOrder          — ordem de serviço gerada de uma proposta aprovada
  └─ Conversation          — estado do diálogo no WhatsApp (loop de confirmação)
       └─ Message          — entrada/saída, tipo (texto/áudio/imagem), transcrição
```

Regras: número da proposta sequencial por organização; idempotência em
importações; métricas calculadas sob demanda; segredos só em variáveis de ambiente.

---

## 12. Arquitetura técnica

```
WhatsApp (Meta Cloud API)
        │  webhook (texto/áudio/imagem)
        ▼
   API / Backend  ──►  Fila (BullMQ + Redis)  ──►  Workers
   (Node/NestJS)            │                         │
        │                   │                         ├─ Transcrição de áudio (Whisper)
        │                   │                         ├─ OCR + visão (Claude) p/ fotos/PDF
        │                   │                         ├─ Roteador de intenção (Claude)
        │                   │                         └─ Geração de PDF (Playwright)
        ▼                   ▼
   PostgreSQL          Storage de arquivos (S3/Supabase Storage)
        ▲
        │  API REST
   Frontend (Next.js + React) — painel web/mobile + página pública do cliente
```

Fluxo de uma mensagem: webhook recebe → enfileira → worker interpreta (Claude) →
atualiza a conversa/proposta no Postgres → responde no WhatsApp. Tarefas pesadas
(transcrição, OCR, PDF) rodam na fila para não travar o webhook.

---

## 13. Stack tecnológica sugerida

| Camada | Escolha | Por quê |
|---|---|---|
| Frontend | **Next.js + React + TypeScript + Tailwind + shadcn/ui** | rápido, bonito, web e mobile |
| Backend | **NestJS (TypeScript) + Prisma** | organizado, escalável, mesmo idioma do front |
| Banco | **PostgreSQL** (Supabase ou Neon, gerenciado) | confiável, multi-tenant, backups automáticos |
| Fila | **BullMQ + Redis** | processa áudio/OCR/PDF/IA em segundo plano |
| IA | **API da Anthropic (Claude)** | intenção + extração de campos + visão (fotos/PDF) |
| Transcrição | **Whisper** (PT-BR) | áudio → texto |
| WhatsApp | **Meta WhatsApp Cloud API** | canal oficial, templates de alerta |
| Arquivos | **Supabase Storage / S3** | logos, fotos, PDFs |
| PDF | **Playwright/Puppeteer** (servidor) | mesmo HTML da proposta vira PDF nítido |
| Auth | **Supabase Auth ou Auth.js** | login simples e estável |
| Hospedagem | **Vercel** (front) + **Render/Railway** (back) + **Supabase/Neon** (banco) | barato e simples de manter |
| Segurança | HTTPS, isolamento por organização, segredos em `.env`, LGPD | proteger dados dos clientes |
| Logs/Backup | logs estruturados + backups automáticos do Postgres | operação tranquila |

---

## 14. MVP (primeira versão) e o que o protótipo já cobre

| # | Item do MVP | No protótipo `orca-facil.html`? |
|---|---|---|
| 1 | Integração WhatsApp | Simulada (chat dentro do app) |
| 2 | Orçamento por texto | ✅ funcionando |
| 3 | Cadastro automático de cliente | ✅ |
| 4 | Cadastro automático de serviço | ✅ |
| 5 | Upload de logotipo | ✅ (no perfil) |
| 6 | Proposta com layout profissional | ✅ |
| 7 | Geração de PDF | ✅ (imprimir → PDF) |
| 8 | Link público da proposta | ✅ (página do cliente simulada) |
| 9 | Envio por WhatsApp | ✅ (mensagem pronta) |
| 10 | Status da proposta | ✅ |
| 11 | Aprovação pelo cliente | ✅ (botão aprovar/recusar/ajuste) |
| 12 | Dashboard básico | ✅ |
| 13 | Registro de pagamentos | ✅ (por mensagem e manual) |
| 14 | Histórico por cliente | ✅ |
| 15 | Histórico por serviço | ✅ |

O que falta para o MVP "de verdade" (sair do navegador): WhatsApp real, IA da
Anthropic no lugar das regras, banco na nuvem, login e PDF no servidor.

---

## 15. Roadmap

**Fase 0 — Protótipo (concluída):** `orca-facil.html`, validável hoje.

**Fase 1 — MVP na nuvem:** Next.js + NestJS + Postgres; login; perfil/logo;
orçamento por **texto** com Claude; PDF no servidor; página pública; pagamentos;
painel. Deploy (Vercel + Render + Supabase).

**Fase 2 — WhatsApp real:** webhook Meta Cloud API; roteador de intenção; loop de
confirmação; alertas com templates aprovados.

**Fase 3 — Áudio e imagens:** transcrição (Whisper) e OCR/visão (Claude) com
confirmação obrigatória antes de gravar.

**Fase 4 — Precificação e financeiro avançado:** sugestão de preço por margem,
relatórios, funil, margem por serviço.

**Fase 5 — Pós-venda:** ordem de serviço completa, assinatura digital, Pix
integrado, boleto, nota fiscal, CRM simples, agenda, multiusuário/equipe.

---

## 16. Regras de negócio (resumo)

1. Sem cadastro longo no início; cadastro **progressivo e automático**.
2. Entrada principal pelo **WhatsApp**; perguntar **só o que faltar**.
3. **Confirmar** antes de enviar qualquer proposta ao cliente (e sempre para
   áudio/imagem).
4. Salvar histórico de clientes, serviços e **preços**; sugerir preço conhecido.
5. Proposta sempre com **aparência profissional** e identidade visual do dono.
6. Exportação em **PDF** e **link público**.
7. **Multi-tenant**: dado de um profissional nunca aparece para outro (LGPD).
8. Simples para quem **não é técnico**.

---

## 17. Como testar o protótipo agora

1. Abra **`orca-facil.html`** no navegador (Chrome/Edge/Safari).
2. Na aba **Assistente**, toque em um dos exemplos ou digite:
   *"Fazer orçamento para João, pintura de apartamento, 80 m², R$ 28 por metro,
   prazo 5 dias, pagamento 50% entrada e 50% na entrega"*.
3. Responda **1** para gerar/salvar (ou **2** para "enviar ao cliente").
4. Vá em **Propostas**, abra a proposta, clique em **Gerar PDF** e em
   **Página do cliente** (teste o botão **Aprovar**).
5. Volte ao **Assistente** e experimente: *"Recebi R$ 500 da Maria via Pix"*,
   *"Quanto vendi esse mês?"*, *"Quais propostas estão pendentes?"*.
6. Veja o **Painel** e edite seu **logotipo/perfil**.
7. *"Recarregar exemplo"* (rodapé) volta tudo ao estado inicial.

> Os dados ficam salvos **só neste navegador** (é um protótipo). A versão SaaS
> guardará tudo na nuvem, acessível pelo celular e pelo PC com o mesmo login.
