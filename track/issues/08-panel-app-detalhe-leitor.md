---
type: Issue
title: "08 — Detalhe da trilha (TrackAside) + leitor de aulas focado"
description: "Constrói a página de detalhe com aside da trilha e o leitor focado de aulas em markdown."
tags: [panel-app, issue, ui, leitor]
status: proposed
generated:
  by: human:GabrielFVDev
  at: 2026-09-16T00:00:00Z
---
# 08 — feat(panel-app): detalhe da trilha (`TrackAside`) + leitor de aulas focado

**Labels (GitHub):** `type:feat` · `mod:panel-app` · `mod:tracks` · `difficulty:hard`
**Status:** ready-for-agent

## Contexto

O detalhe da trilha foi desenhado como um **aside sobreposto** (não página própria): o usuário navega a listagem e abre a trilha sem perder o contexto do grid. A leitura acontece numa segunda superfície: o **"Focus Reader"**, variante aprovada entre quatro protótipos, que serve o HTML já processado pelo ETL com foco total no texto. Ambos foram prototipados no fork com dados em memória; este ticket torna-os reais.

Visual de referência completo em [`../artefatos/tracks-docs.html?poc=1`](../artefatos/tracks-docs.html?poc=1) (POC em tela cheia), seções "Detalhe · TrackAside" e "Leitor · variante Focus Reader". Resumo (emendado pelo reescopo agregador — ADR 0005, E-D8):

- **Aside**: header com stats do repo (stars/forks/watchers), criador, descrição, badges de metadados (linguagem/categoria), árvore módulos → aulas (**sem check de conclusão**), lista de contribuidores com Follow/Sponsor
- **Reader**: breadcrumb `Trilha > Módulo > Aula`, sidebar fina colapsável com índice dos h2 da aula atual, blocos tipados (código com botão copiar, callout, tabela), navegação anterior/próxima respeitando a ordenação persistida pelo ETL. **Sem marcar concluída e sem feedback por aula.**

> Removidos no agregador: progresso geral, níveis/duração nos badges, check de conclusão nas aulas, ação "concluir aula" (`user_completed_lessons` saiu do modelo), auto-marcação por scroll.

## O que construir

- Componente Livewire `tracks-aside` registrado globalmente via render hook `LAYOUT_END` do painel, escopado às páginas que o usam (listagem + reader)
- Comunicação por eventos Livewire já definidos no protótipo:
  - listagem dispara `selectTrack(id)` → aside sincroniza (`tracks-aside.sync`)
  - reader pode abrir outro aside direto (`tracks-aside.open`)
  - fechar o aside devolve estado à listagem (`tracks-page.clear`)
- Leitor servindo `lessons.processed_content` com os blocos tipados estilizados
- Navegação prev/next pela coluna de posição persistida; os botões só aparecem quando há aula anterior ou próxima.
- Estados vazios: trilha sem conteúdo sincronizado ainda, aula removida entre syncs (ponteiro `replaced_by_uuid` redireciona)

## Critérios de aceite

- [ ] Aside abre da listagem e do reader pelos eventos definidos, fecha limpando estado
- [ ] Árvore de módulos/aulas espelha exatamente o ETL (ordem e agrupamento) — sem check de conclusão
- [ ] Prev/next atravessam limites de módulo corretamente
- [ ] Rename de path entre syncs não quebra a árvore nem os vínculos (UUID estável provado em teste)
- [ ] Code blocks têm botão copiar funcional; callouts e tabelas estilizados
- [ ] Testes Livewire cobrindo eventos e navegação

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Ler uma trilha no leitor focado

  Cenário: Abrir o detalhe da trilha
    Dado que estou na listagem de trilhas
    Quando seleciono uma trilha
    Então o aside abre com stats do repo, criador e árvore de conteúdo

  Cenário: Ler uma aula sem rastro
    Dado que estou lendo uma aula de um módulo
    Quando o leitor renderiza
    Então o conteúdo é servido tipado, sem marcar nada como concluído

  Cenário: Navegar linearmente
    Dado que estou na última aula de um módulo
    Quando avanço para a próxima
    Então caio na primeira aula do módulo seguinte, na ordem do ETL

  Cenário: Última aula da trilha
    Dado que estou na última aula de toda a trilha
    Quando o leitor renderiza
    Então o botão "Próxima" não aparece

  Cenário: Aula renomeada entre syncs
    Dado que uma aula foi renomeada no repo
    Quando o próximo sync roda e eu reabro a trilha
    Então a árvore continua íntegra via ponteiro de substituição
```

## Bloqueada por

- #07 — listagem navegável existe

---

[← Anterior: 07](07-panel-app-listagem-trilhas.md) · [Índice das issues](index.md) · [Próxima: 09 →](09-github-interaction-endpoints.md)
