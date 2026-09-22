---
type: Technical Reference
title: "Schema de Referência — Módulo tracks"
description: "Referência de tabelas, enums, contratos PHP, DTOs e eventos do agregador. O dev consulta ao implementar as issues."
tags: [tracks, schema, dados, php]
status: proposed
generated:
  by: human:GabrielFVDev
  at: 2026-09-16T00:00:00Z
---
# Schema de Referência — Módulo `tracks`

[← Índice do módulo](index.md) (agregador)

Referência técnica consolidada: tabelas, enums, contratos, DTOs e eventos. As issues desta pasta apontam para este arquivo quando precisam detalhar estruturas de dados.

> **Escopo v3 (agregador):** removido o estado pessoal do LMS — `user_track_state`, `lesson_feedback`, `user_completed_lessons` e `lessons.estimated_minutes`. Ver ADR 0005.

---

## Enums

### `TrackSourceType`

| Caso | Descrição |
|---|---|
| `github` | Trilha sincronizada de um repo 4noobs |

### `TrackStatus`

| Caso | Descrição |
|---|---|
| `syncing` | Aguardando primeira sincronização completa |
| `active` | Trilha sincronizada e disponível (publicada) |
| `hidden` | Trilha sincronizada mas não listada (unpublished) |
| `archived` | Trilha removida da fonte ou descontinuada |

> **Publicação:** `hidden` oculta da listagem sem parar a ingestão. `active` ↔ `hidden` controlados pelo painel (`GithubRepositoryResource`); `enabled` no `github_repositories` controla só a ingestão.

### `ContentType`

| Caso | Descrição |
|---|---|
| `markdown` | Conteúdo processado pelo ETL (HTML sanitizado) |
| `link` | Link externo (referência direta ao repo) |

### `ContributionRole`

| Caso | Descrição |
|---|---|
| `author` | Owner do repo ou autor principal (endpoint de contribuidores + `.all-contributorsrc`) |
| `co-author` | Co-autor listado no commits/README |
| `contributor` | Contribuidor listado em arquivo de autoria |

> **Fonte de autoria (E-D5):** primária = endpoint `GET /repos/{owner}/{repo}/contributors` (all-time, `selectedMetric=additions` — a validar); fallback = `.all-contributorsrc` → `.github/config.json` → seção de autores do README → avatares inline.

---

## Tabelas

### `tracks`

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | uuid | PK | UUIDv5 determinístico |
| `source_type` | enum(TrackSourceType) | NOT NULL | Origem da trilha |
| `external_id` | varchar | UNIQUE, NOT NULL | ID na fonte (ex.: `owner/repo`) |
| `title` | varchar | NOT NULL | Nome da trilha |
| `slug` | varchar | NOT NULL | Slug URL-friendly |
| `description` | text | NULLABLE | Descrição curta |
| `cover_image_url` | varchar | NULLABLE | URL da imagem de capa |
| `status` | enum(TrackStatus) | DEFAULT `syncing` | Estado atual (incl. `hidden` para unpublish) |
| `repo_owner` | varchar | NOT NULL | Owner do repo GitHub |
| `repo_name` | varchar | NOT NULL | Nome do repo GitHub |
| `repo_url` | varchar | NULLABLE | URL completa do repo |
| `default_branch` | varchar | NULLABLE | Branch padrão (api-resolved) |
| `language` | varchar | NULLABLE | Linguagem principal (programação) — metadata do GitHub |
| `category` | varchar | NULLABLE | Categoria no README central (ex.: Front-end, Back-end) — resolvida no ETL, atualizada a cada sync |
| `stars` | int | DEFAULT 0 | Estrelas no GitHub |
| `forks` | int | DEFAULT 0 | Forks no GitHub |
| `watchers` | int | DEFAULT 0 | Watchers no GitHub |
| `replaced_by_uuid` | uuid | NULLABLE, FK self | UUID da trilha substituta (rename) |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

**Indexes:**
- `(source_type, external_id)` — lookup por fonte
- `(status)` — filtro na listagem (published/hidden)
- `(category)` — filtro por categoria na listagem

### `modules`

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | uuid | PK | UUIDv5 determinístico |
| `track_id` | uuid | FK tracks, NOT NULL | Trilha pai |
| `title` | varchar | NOT NULL | Nome do módulo |
| `slug` | varchar | NOT NULL | Slug URL-friendly |
| `source_path` | varchar | NOT NULL | Path no repo original (chave de ETL) |
| `position` | int | NOT NULL | Ordem dentro da trilha |
| `replaced_by_uuid` | uuid | NULLABLE, FK self | Módulo substituto (rename) |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

**Indexes:**
- `(track_id, position)` — ordenação na árvore
- `(source_path)` — lookup por path durante ETL

### `lessons`

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | uuid | PK | UUIDv5 determinístico |
| `module_id` | uuid | FK modules, NOT NULL | Módulo pai |
| `title` | varchar | NOT NULL | Nome da aula |
| `slug` | varchar | NOT NULL | Slug URL-friendly |
| `position` | int | NOT NULL | Ordem dentro do módulo |
| `source_path` | varchar | NOT NULL | Path no repo original (chave de ETL) |
| `content_type` | enum(ContentType) | DEFAULT `markdown` | Tipo de conteúdo |
| `processed_content` | text | NULLABLE | HTML sanitizado (output do ETL) |
| `extra_content` | text | NULLABLE | Seção extra de conteúdo complementar (casos de borda) |
| `replaced_by_uuid` | uuid | NULLABLE, FK self | Aula substituta (rename) |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

**Indexes:**
- `(module_id, position)` — ordenação na árvore
- `(source_path)` — lookup por path durante ETL

> **Emenda E-D3:** `estimated_minutes` **removido**; `word_count` também (só alimentava a projeção de duração — sem consumidor no agregador, emenda revisada). Nenhuma duração é derivada.

### `track_contributors`

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | uuid | PK | |
| `track_id` | uuid | FK tracks, NOT NULL | Trilha |
| `github_username` | varchar | NOT NULL | Handle GitHub (chave de adoção) |
| `display_name` | varchar | NULLABLE | Nome de exibição |
| `avatar_url` | varchar | NULLABLE | URL do avatar |
| `is_owner` | bool | DEFAULT false | É o mantenedor principal (owner do repo) |
| `contribution_role` | enum(ContributionRole) | NOT NULL | Papel na trilha |
| `user_id` | bigint | NULLABLE, FK users | Usuário da plataforma (adotado) |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

**Constraints:**
- `UNIQUE (track_id, github_username)` — upsert idempotente
- Exatamente um `is_owner = true` por trilha (garantido pelo ETL)

**Indexes:**
- `(github_username)` — lookup durante adoção
- `(user_id)` — lookup por usuário

---

## Contratos PHP

Contratos do domínio `tracks` — implementados por `integration-github` e registrados no boot.

### `TrackSourceProvider`

Interface base. Todo provider deve implementar.

```php
interface TrackSourceProvider
{
    public function source(): TrackSourceType;
}
```

### `DiscoversTrackSources` (capability)

```php
interface DiscoversTrackSources extends TrackSourceProvider
{
    /** @return iterable<TrackSourceDTO> */
    public function discoverSources(): iterable;
}
```

### `FetchesRepositoryMetadata` (capability)

```php
interface FetchesRepositoryMetadata extends TrackSourceProvider
{
    public function fetchMetadata(TrackSourceDTO $source): RepoMetadataDTO;
}
```

### `ProvidesWorkingCopy` (capability)

```php
interface ProvidesWorkingCopy extends TrackSourceProvider
{
    /** shallow clone na 1ª vez / pull incremental; retorna path local */
    public function workingCopy(TrackSourceDTO $source): string;
}
```

### `FetchesContributors` (capability — NOVO, E-D5)

```php
interface FetchesContributors extends TrackSourceProvider
{
    /** @return iterable<TrackContributorDTO>  # GET /repos/{owner}/{repo}/contributors, all-time */
    public function fetchContributors(TrackSourceDTO $source): iterable;
}
```

---

## DTOs

### `TrackSourceDTO`

Tradução anti-corrupção: vocabulário da fonte não entra no domínio.

| Campo | Tipo | Descrição |
|---|---|---|
| `externalId` | string | ID único na fonte (ex.: `owner/repo`) |
| `owner` | string | Owner/repo |
| `name` | string | Nome do repo |
| `url` | string | URL do repo |

### `RepoMetadataDTO`

Metadados enriquecidos após consulta à API.

| Campo | Tipo | Descrição |
|---|---|---|
| `defaultBranch` | string | Branch padrão (api-resolved, nunca hardcoded) |
| `language` | string | Linguagem principal |
| `stars` | int | Estrelas |
| `forks` | int | Forks |
| `watchers` | int | Watchers (inscritos) |
| `description` | string | Descrição curta |

### `TrackContributorDTO` (NOVO, E-D5)

Contribuidor vindo do endpoint de contribuidores (all-time).

| Campo | Tipo | Descrição |
|---|---|---|
| `githubUsername` | string | Handle GitHub |
| `contributions` | int | Total de contribuições (commits/additions conforme `selectedMetric`) |
| `avatarUrl` | string | URL do avatar |

---

## Eventos

### `ExternalIdentityConnected`

Emitido quando uma conexão de identidade externa nasce (OAuth ou credencial). Compartilhado com `contents`.

| Campo | Tipo | Descrição |
|---|---|---|
| `identity` | ExternalIdentity | Identidade conectada (provider, handle, owner) |

Dispatch: fim dos actions de conexão (OAuth e credencial/API key).

### `TrackMaintainersLinked`

Emitido quando um ou mais contribuidores órfãos são adotados retroativamente.

| Campo | Tipo | Descrição |
|---|---|---|
| `trackId` | uuid | Trilha afetada |
| `userId` | bigint | Usuário adotado |

Dispatch: listener de `ExternalIdentityConnected` → `AdoptTrackContributors`.

> **Removidos no agregador:** `LessonCompleted`, `TrackCompleted`, `LessonFlaggedOutdated` — não existem mais (não há progresso nem feedback).

---

## Integração GitHub (fronteira de módulo — Model 2)

`integration-github` **transporta** e devolve DTOs; `tracks` **persiste** e decide o que é verdade.

- **Allowlist:** `github_repositories` com `purpose = Tracks` (novo caso de `PurposeType`, padrão ADR-0002 do onboarding) + `enabled` (ingestão).
- **Publicação:** `tracks.status` (`hidden`/`active`) controlada pelo painel, armazenada no track.
- **Novos requests no transporte:** `Transport/Requests/Contributors/` para `GET /repos/{owner}/{repo}/contributors`; `Transport/Requests/Interactions/` para star/watch/follow (PUT/DELETE/GET).
- **Reuso:** `GitHubApiConnector` (HTTP) + `RateLimit` (backoff/resume). NADA de `BackfillRepository` de contribuições para trilhas — a ingestão de trilhas é um caminho separado que escreve nas tabelas do tracks.

## Notas

- **XP/remuneração**: não existe nestas tabelas. Tracks emite fatos (`TrackMaintainersLinked`), gamificação decide.
- **Sem estado pessoal**: nenhuma tabela de progresso, bookmark, avaliação ou feedback por aula. O agregador não rastreia.
- **Sem duração**: `estimated_minutes` e `word_count` removidos (E-D3); nada deriva tempo de leitura.
- **Sponsor stateless**: visibilidade do botão Sponsor vem de `GET /users/{login}/sponsorship` por request, nada gravado (Grupo A, ADR 0004).
- **Autoria**: primária = endpoint de contribuidores; `.all-contributorsrc` → config.json → README → avatares como fallback (E-D5).
- **Ordem de extração de contribuidores**: endpoint `/contributors` (1º) → `.all-contributorsrc` (owner repo) → `.github/config.json` (4noobs repo) → Seção contribuidores (owner repo) → Avatares inline (qualquer repo README, último recurso).