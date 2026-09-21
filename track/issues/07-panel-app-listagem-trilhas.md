---
type: Issue
title: "07 — Listagem de trilhas real substituindo o protótipo mockado"
description: "Liga a listagem de trilhas do panel-app aos dados reais do agregador, substituindo o mock do protótipo."
tags: [panel-app, issue, ui, listagem]
status: proposed
generated:
  by: human:GabrielFVDev
  at: 2026-09-16T00:00:00Z
---
# 07 — feat(panel-app): listagem de trilhas real substituindo o protótipo mockado

**Labels (GitHub):** `type:feat` · `mod:panel-app` · `mod:tracks` · `difficulty:medium`
**Status:** ready-for-agent

## Contexto

A experiência de descoberta de trilhas foi prototipada e aprovada entre seis variantes: a escolhida ("variante C") segue a identidade visual dark do GitHub — linguagem que o público 4noobs já conhece. O protótipo funciona com **dados em memória**, apenas provando UX; este ticket o substitui por uma página real alimentada pelo catálogo sincronizado (tickets 04–05).

Visual de referência completo (com mockups navegáveis) está em [`../artefatos/tracks-docs.html?poc=1`](../artefatos/tracks-docs.html?poc=1) (POC em tela cheia), seção "UX/UI escolhida". Layout aprovado (emendado pelo reescopo agregador — ADR 0005, E-D8):

- Tema `#0D1117` / `#161B22`, fonte Inter
- Hero com título + campo de busca
- Grid de cards: ícone tecnologia, título, criador, módulos, badges de interação ("estrelado" via GitHub)
- **Ordenar por**: Mais recentes, Mais populares
- **Filtros**:
  - Categoria: Todas, Frontend, Backend, Mobile, DevOps, Design, Data, QA
  - Status: Novas, Populares, Recém atualizadas

> Removidos no agregador: estatísticas pessoais (`.poc-stats`: horas, concluídas, em andamento), progresso por card, filtros de Nível e Duração, ordenação "Menor duração", badge "salvo" (não existe bookmark local).

## O que construir

- Página Livewire/Filament no painel do usuário consultando os models do tracks (sem dados mockados)
- Busca server-side por nome da trilha, tecnologia e autor
- Filtros combináveis + ordenação persistidos na URL (compartilhável)
- Badges do card refletem interações já existentes (estrelado via GitHub quando houver estado verificado — pendências de check no ticket 11)
- Visitante deslogado vê o catálogo completo — sem obstáculo, sem estado pessoal qualquer
- Protótipos mockados aposentados/removidos neste ticket

## Critérios de aceite

- [ ] Listagem reflete exatamente o catálogo sincronizado — sem nenhum dado fixo
- [ ] Busca e cada filtro funcionam server-side e são combináveis
- [ ] Ordenação e filtros sobrevivem a refresh (estado na URL)
- [ ] Card exibe título, criador, linguagem, módulos e interações — **sem progresso, duração ou nível**
- [ ] Responsivo conforme protótipo; tema dark aplicado
- [ ] Testes Livewire cobrindo renderização, busca e filtros (padrão dos testes de página existentes)

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Descobrir trilhas na plataforma

  Cenário: Usuário explora o catálogo
    Dado que três trilhas foram sincronizadas
    Quando acesso a página de trilhas
    Então vejo as três trilhas com criador, linguagem, módulos e badges de interação

  Cenário: Filtrar por categoria
    Dado que três trilhas existem e uma é de front-end
    Quando filtro por "Frontend"
    Então somente a trilha de front-end aparece na grade

  Cenário: Visitante deslogado
    Dado que não estou autenticado
    Quando acesso a página de trilhas
    Então vejo o catálogo completo e navegável, sem nenhuma barreira
```

## Bloqueada por

- #05 — ETL populando módulos e aulas (progresso precisa de conteúdo)

---

[← Anterior: 06](06-contribuidores-adocao-orfaos.md) · [índice das issues](index.md) · [Próxima: 08 →](08-panel-app-detalhe-leitor.md)
