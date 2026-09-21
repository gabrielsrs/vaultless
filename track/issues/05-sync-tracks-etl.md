---
type: Issue
title: "05 — SyncTracks: ETL de conteúdo"
description: "ETL que materializa working copy do repo em trilhas, módulos e aulas normalizadas no banco."
tags: [tracks, issue, etl, sync]
status: proposed
generated:
  by: human:GabrielFVDev
  at: 2026-09-16T00:00:00Z
---
# 05 — feat(tracks): `SyncTracks` — ETL de conteúdo (working copy → módulos e aulas normalizadas)

**Labels (GitHub):** `type:feat` · `mod:tracks` · `difficulty:hard`
**Status:** ready-for-agent

## Contexto

O conteúdo de uma trilha é uma **árvore de markdown**: o pipeline deve mapear a estrutura encontrada para a hierarquia track → module → lesson. A pesquisa dos 9 repos 4noobs catalogou as variações que o pipeline precisa absorver:

| Aspecto | Variações encontradas |
|---|---|
| Estrutura | flat, `docs/`, `src/`, `Content/`, VuePress, mdbook |
| Extensão | `.md` e `.MD` |
| Branch | `master` ou `main` |
| Imagens | links relativos quebrariam fora do GitHub |

Duas decisões estruturais já consolidadas nos ADRs do módulo guiam este ticket:

1. **Identidade estável (ADR 0001):** módulo e aula recebem UUID determinístico (v5) derivado do namespace UUID da trilha + source path. Rename de path → registro antigo soft-deleted com ponteiro `replaced_by_uuid`. A estabilidade do UUID existe para a leitura e para os vínculos de autoria/interação — nunca o caminho.
2. **Flat + override (ADR 0002):** detecção de engine foi recusada como frágil; variação estrutural se resolve com mapa de override configurável por repo.

> **Escopo v3 (agregador, ADR 0005):** duração estimada **removida** (E-D3). `word_count` também **removido** — só alimentava a projeção `estimated_minutes`, sem consumidor no agregador.

## O que construir

- Analisar a estrutura dos repos 4noobs reais (mínimo: 3–5 repos com variações diferentes) para validar o mapeamento estrutural antes de implementar o pipeline
- Capability `ProvidesWorkingCopy` no `GithubTrackProvider`: shallow clone na primeira sincronização em storage dedicado; `git pull` incremental nas seguintes; opção de refresh completo re-clonando.
- Pipeline de normalização no comando `tracks:sync`:
  - Módulos = diretórios de topo, ignorando `.github/`, pastas de imagens e configs
  - Override map por repo para desvios (ex.: trilha com conteúdo sob `Content/`)
  - Extensões normalizadas (`.MD` → `.md`)
  - Branch lida da metadata já sincronizada (`default_branch`)
  - Links relativos de imagem reescritos para `raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`
  - Em casos de borda (aulas com seção extra de conteúdo complementar), lesson pode ter um campo `extra_content` para esse conteúdo adicional sem quebrar o modelo — ver [`../schema.md`](../schema.md)
  - Markdown → HTML sanitizado em `lessons.processed_content`
  - Sem métricas de duração/tamanho: `estimated_minutes` e `word_count` fora (E-D3)
- Ordenação heurística em cascata: seções numeradas do ROADMAP do README → alfabética → ordem da git tree; resultado persistido em coluna de posição
- Identidade: UUIDv5 estável; rename entre syncs → soft-delete + `replaced_by_uuid` apontando ao sucessor

Schema resumido das duas tabelas novas (`tracks` já existe do ticket 04):

```
modules: id uuid pk · track_id fk · title · slug · position int · replaced_by_uuid null · timestampsTz
lessons: id uuid pk · module_id fk · title · position int · processed_content text
         · replaced_by_uuid null · timestampsTz
```

## Critérios de aceite

- [ ] Primeiro sync de uma trilha real popula módulos e aulas na ordem correta, com HTML processado legível
- [ ] UUIDs são determinísticos: mesmo input produz mesmos ids (testado contra fixtures)
- [ ] Rename de arquivo/diretório preserva a árvore via ponteiro de substituição
- [ ] Sync incremental não refaz clone; flag de refresh completo existe
- [ ] Override map aplicado quando configurado; sem config, regra flat padrão vale
- [ ] Idempotência: segunda passada sem mudanças na fonte = zero alterações estruturais
- [ ] Domínio chama a capability — nenhum uso direto de git/HTTP no módulo tracks

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Sincronização de conteúdo das trilhas

  Cenário: Primeiro sync de uma trilha
    Quando o sync roda para uma trilha recém-catalogada
    Então módulos e aulas nascem com UUIDs determinísticos e posições da heurística do README
    E cada aula guarda HTML processado (sem duração estimada)

  Cenário: Aula renomeada entre syncs
    Dado que "introducao.md" virou "fundamentos.md" no repo
    Quando o sync roda novamente
    Então a aula antiga fica inativa apontando para a nova
    E a árvore de leitura permanece estável pelo UUID imutável

  Cenário: Repo com estrutura atípica
    Dado que uma trilha guarda o conteúdo sob "Content/" em vez de diretórios de topo
    E existe override configurado para ela
    Quando o sync roda
    Então os módulos são extraídos da raiz do override, não da estrutura bruta

  Cenário: Sync incremental
    Dado um clone já existente da trilha
    Quando o sync roda novamente
    Então apenas um pull incremental acontece e só o que mudou é atualizado
```

## Bloqueada por

- #04 — GithubTrackProvider descobrindo fontes

---

[← Anterior: 04](04-github-provider-descoberta-metadados.md) · [índice das issues](index.md) · [Próxima: 06 →](06-contribuidores-adocao-orfaos.md)
