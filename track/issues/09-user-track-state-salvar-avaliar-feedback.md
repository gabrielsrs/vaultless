# 09 — feat(tracks): estado pessoal completo (`UserTrackState`) — salvar, avaliar e dar feedback

**Labels (GitHub):** `type:feat` · `mod:tracks` · `mod:panel-app` · `difficulty:medium`
**Status:** ready-for-agent

## Contexto

O módulo separa interações em dois grupos (decisão consolidada no ADR do módulo):

- **Grupo A — ações no GitHub**: estrelar/watch/follow escrevem lá fora, exigem conta vinculada e escopo elevado → tickets #10 e #11
- **Grupo B — estado pessoal local**: salvar, avaliar e dar feedback acontecem **só na plataforma**, funcionam para qualquer usuário autenticado e **nunca exigem conta GitHub**

O ticket #08 já introduziu o armazenamento mínimo de conclusão de aulas (progresso). Este ticket completa o modelo de estado pessoal: marcar trilha como salva, avaliá-la e sinalizar feedback por aula. É o que alimenta os filtros de status/salvos da listagem (#07) e dá aos mantenedores um sinal de qualidade independente de GitHub stars.

## O que construir

- Tabelas novas no tracks:

```
user_track_state: id · user_id fk · track_id fk · bookmarked bool default false
                  · rating int nullable (1–5) · unique(user_id, track_id) · timestampsTz
lesson_feedback: id · user_id fk · lesson_id uuid fk · feedback enum('util','desatualizada')
                 · unique(user_id, lesson_id) · timestampsTz
```

- Regras: uma linha por usuário↔trilha (upsert); feedback único por aula, alterável (trocar "útil" por "desatualizada" substitui); remover avaliação é permitido (rating volta a nulo)
- UI na listagem e no aside: botão salvar com toggle instantâneo + badge "salvo" no card (#07 já renderiza o badge)
- UI no fim de cada aula do reader: "Esta aula foi útil?" → útil / desatualizada, refletindo o estado atual e permitindo troca
- Avaliação por estrelas no aside (1–5), persistindo no mesmo upsert do bookmark
- Deslogado: controles escondidos ou redirecionam para login — catálogo continua navegável, só o estado pessoal exige sessão
- Fato emitido quando feedback "desatualizada" é registrado (`LessonFlaggedOutdated`, payload: aula + usuário) — downstream pode avisar o mantenedor; tracks não notifica ninguém diretamente

## Critérios de aceite

- [ ] Salvar/dessalvar trilha persiste e sobrevive a refresh
- [ ] Badge "salvo" aparece no card e no aside coerentes entre si
- [ ] Rating 1–5 persiste, é removível e exibido no aside
- [ ] Feedback de aula é único por usuário↔aula e substituível
- [ ] Deslogado consegue navegar mas não altera estado pessoal
- [ ] Fato `LessonFlaggedOutdated` emitido exatamente na transição para "desatualizada"
- [ ] Testes de feature cobrindo toggle, substituição de feedback e idempotência do upsert

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Estado pessoal sobre trilhas e aulas

  Cenário: Salvar uma trilha para depois
    Dado que estou autenticado na página de trilhas
    Quando salvo uma trilha pelo card
    Então o badge "salvo" aparece imediatamente e persiste após recarregar

  Cenário: Trocar o feedback de uma aula
    Dado que marquei uma aula como "útil"
    Quando marco a mesma aula como "desatualizada"
    Então existe apenas um registro de feedback, agora "desatualizada"
    E o fato de conteúdo desatualizado é emitido uma única vez

  Cenário: Remover avaliação
    Dado que avaliei uma trilha com 4 estrelas
    Quando removo minha avaliação
    Então a trilha volta a ficar sem rating e o bookmark permanece intacto
```

## Bloqueada por

- #08 — leitor e aside existem (superfícies onde os controles vivem)

---

[← Anterior: 08](08-panel-app-detalhe-leitor.md) · [issues/README](README.md) · [Próxima: 10 →](10-github-interaction-endpoints.md)
