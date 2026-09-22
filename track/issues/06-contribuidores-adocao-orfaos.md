---
type: Issue
title: "06 — Contribuidores da trilha + ciclo de órfãos com adoção retroativa"
description: "Modela autoria como entidade: github_username sempre gravado, adoção automática quando o autor conecta a conta."
tags: [tracks, issue, contribuidores, adoção]
status: proposed
generated:
  by: human:GabrielFVDev
  at: 2026-09-16T00:00:00Z
---
# 06 — feat(tracks): contribuidores da trilha + ciclo de órfãos com adoção retroativa

**Labels (GitHub):** `type:feat` · `mod:tracks` · `difficulty:medium`
**Status:** ready-for-agent

## Contexto

Trilhas 4noobs são mantidas por **várias pessoas** — o criador principal e contribuidores que mandam PRs de conteúdo. A pesquisa nos 9 repos catalogou onde a autoria mora; após o reescopo agregador (ADR 0005, E-D5), a ordem de confiabilidade é:

1. **Endpoint de contribuidores GitHub** — `GET /repos/{owner}/{repo}/contributors` (all-time; `selectedMetric=additions` como recomendação a validar) — **fonte primária**, via nova capability `FetchesContributors` do provider (issue 04)
2. `.all-contributorsrc` (JSON estruturado — gold standard para quem contribui sem código, owner repo)
3. `.github/config.json` (formato antigo do programa, 4noobs repo)
4. Seção Contribuidores no README (4noobs repo)
5. Contribuidores descritos no README (owner repo)
6. Avatares inline (qualquer repo README, último recurso)

> O endpoint primeiro captura quem tem commit; as fontes de autoria por trás garantem quem contribui fora de código (docs/review — o valor real num ecossistema de tutoriais markdown). Decisão a validar contra repos reais; se o viés de `additions` contra não-código dominar, o endpoint vira base de ranking de código e o `.all-contributorsrc` volta a ser a autoridade — sem mudança estrutural, é coluna/captura (ver ADR 0005, E-D5).

O problema central: **a maioria dos mantenedores ainda não tem conta He4rt vinculada**. Se a autoria só existir quando há match com usuário da plataforma, quem criou conteúdo há meses nunca é creditado — e quando finalmente conectar, nada retroage. Foi exatamente esse buraco que o módulo `contents` corrigiu para artigos dev.to com o ciclo de **órfãos + adoção**: o handle fica gravado sempre; o vínculo com usuário nasce nulo e é adotado depois, disparado pelo evento `ExternalIdentityConnected` (ticket #02 desta série). Estrutura de dados detalhada em [`../schema.md`](../schema.md) (tabelas `track_contributors` e eventos).

## O que construir

- Extração de autores durante o ETL (ticket 05), pela cadeia de prioridade acima (começando pelo **endpoint de contribuidores**, consumido via capability `FetchesContributors` — ticket 04), gravando:
  - `track_contributors`: `track_id` fk · `github_username` (**sempre preenchido** — memória e chave de adoção) · `display_name` · `avatar_url` · `is_owner` bool · `contribution_role` enum (`author`, `co-author`, `contributor`) · `user_id` fk nullable → usuários do identity
- Invariantes: exatamente **um** `is_owner` por trilha; re-sync não duplica contribuidor (upsert por `(track_id, github_username)`)
- Action de adoção `AdoptTrackContributors`, listener do `ExternalIdentityConnected`:
  - provider github + handle igual ao `github_username` → preenche `user_id` em todos os órfãos daquele handle
  - emite o fato `TrackMaintainersLinked` por trilha afetada (payload: trilha + usuário) — downstream (gamification/activity) decide se credita XP retroativo; tracks nunca premia
  - idempotente: reconectar não duplica vínculo nem re-emite
- Simetria documentada com o padrão já vivo na casa: `AccountsMerged` → reatribuição de timeline

## Critérios de aceite

- [ ] Contribuidor extraído de cada fonte da cadeia de prioridade (testado com fixture de cada formato; endpoint mockado na primeira posição)
- [ ] Órfão é estado válido: handle exibível na UI mesmo sem conta vinculada
- [ ] Conectar identidade GitHub adota retroativamente todos os vínculos órfãos do handle
- [ ] `TrackMaintainersLinked` emitido uma vez por trilha afetada, não por vínculo
- [ ] Re-sync e reconexão são idempotentes
- [ ] Exatamente um owner por trilha garantido (owner = dono do repo, vindo da metadata) mesmo com fontes de autoria conflitantes

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Adoção de contribuidores órfãos

  Cenário: Mantenedor conecta a conta depois do conteúdo existir
    Dado que três trilhas têm contribuidor órfão com handle "fulano"
    Quando alguém conecta uma identidade GitHub com aquele handle
    Então os três vínculos recebem o usuário da plataforma
    E três fatos de vinculação são emitidos, um por trilha

  Cenário: Contribuidor que nunca conectou
    Dado uma trilha sincronizada cujo autor não tem conta vinculada
    Então o contribuidor existe com handle e avatar preenchidos
    E nenhuma interação dependente de usuário falha por causa disso

  Cenário: Reconexão não duplica
    Dado um contribuidor já adotado
    Quando a mesma identidade é reconectada
    Então nenhum vínculo novo nasce e nenhum fato é re-emitido
```

## Bloqueada por

- #04 — capability `FetchesContributors` no provider (fonte primária de contribuidores)
- #05 — ETL populando as trilhas
- #02 — evento `ExternalIdentityConnected` no identity

---

[← Anterior: 05](05-sync-tracks-etl.md) · [Índice das issues](index.md) · [Próxima: 07 →](07-panel-app-listagem-trilhas.md)
