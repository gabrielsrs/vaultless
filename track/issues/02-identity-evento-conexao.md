---
type: Issue
title: "02 — Evento ExternalIdentityConnected nos caminhos de conexão"
description: "Emite ExternalIdentityConnected no identity para viabilizar adoção retroativa de contribuidores órfãos."
tags: [identity, issue, evento, compartilhado]
status: proposed
generated:
  by: human:GabrielFVDev
  at: 2026-08-27T00:00:00Z
---
# 02 — feat(identity): evento `ExternalIdentityConnected` nos caminhos de conexão

**Labels (GitHub):** `type:feat` · `mod:identity` · `difficulty:small`
**Status:** ready-for-agent

## Contexto

O módulo `identity` hoje emite **apenas** `AccountsMerged`. Não existe sinal de que uma conexão de conta externa **nasceu** — e há dois caminhos distintos que criam uma:

| Caminho | Action responsável |
|---|---|
| OAuth (conectar GitHub/Discord/Twitch…) | fluxo de vinculação de provider |
| Credencial/API key | action de conexão por credencial |

Sem esse sinal, nenhum módulo consegue reagir ao momento "a pessoa acabou de vincular a conta". Dois consumidores já planejados precisam exatamente desse gatilho:

- **`contents`** — adota artigos órfãos (conteúdo catalogado com handle do autor, mas sem usuário resolvido) quando o autor conecta a conta.
- **`tracks`** — adota contribuidores de trilhas 4noobs órfãos com crédito retroativo (ticket 06 desta série).

O evento é genérico de propósito: GitHub, Twitch e futuros providers vão querer o mesmo gatilho de reconciliação. Ticket prefactor — aditivo puro, nenhum listener obrigatório.

## O que construir

- Evento novo `ExternalIdentityConnected` no namespace de eventos de identidade externa:
  - `final readonly`, com payload carregando a `ExternalIdentity` recém-conectada (provider, external account id/handle, model owner).
- Dispatch no **fim** dos dois actions que criam conexão (OAuth e credencial/API key) — depois da persistência, garantindo que quem escuta já consegue consultar o registro.
- Nenhum listener acoplado neste ticket — quem quiser reagir assina depois.
- Testes cobrindo cada caminho disparando exatamente um evento com payload correto.

## Critérios de aceite

- [ ] Evento existe, é serializável em queue e carrega a `ExternalIdentity`
- [ ] Conectar por OAuth dispara o evento uma única vez
- [ ] Conectar via credencial/API key dispara o evento uma única vez
- [ ] Reconectar/atualizar credencial existente não dispara evento duplicado (ou dispara variante explícita — decidir no triage)
- [ ] Nenhum módulo além do identity é tocado

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Sinalizar nova conexão de identidade externa

  Cenário: Usuário conecta conta via OAuth
    Dado que estou autenticado na plataforma
    Quando completo o fluxo OAuth vinculando minha conta GitHub
    Então o evento de conexão é emitido com provider "github" e o meu handle

  Cenário: Usuário conecta identidade via credencial
    Dado que estou autenticado na plataforma
    Quando registro uma credencial válida de provedor
    Então o evento de conexão é emitido carregando a identidade criada

  Cenário: Reconciliação posterior
    Dado que um listener qualquer foi registrado
    Quando qualquer um dos dois caminhos de conexão acontece
    Então o listener recebe a ExternalIdentity persistida e consultável
```

## Bloqueada por

Nada — pode começar imediatamente (paralela ao scaffold do tracks).

*Nota de coordenação: a spec do módulo `contents` planeja este mesmo evento. Combinar implementação única para os dois consumidores.*

---

[← Anterior: 01](01-scaffold-modulo-tracks.md) · [índice das issues](index.md) · [Próxima: 03 →](03-provider-contract-e-registry.md)
