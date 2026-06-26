// Service worker mínimo — habilita a instalação do app (PWA).
// Estratégia "network-first": sempre tenta a rede; em caso de falha, não quebra.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  // Deixa o navegador cuidar normalmente das requisições.
  // (Presença de um handler de fetch é o que torna o app instalável.)
  return;
});
