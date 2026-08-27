# Schema de Referência — Módulo `tracks`

[← README do módulo](README.md)

Referência técnica consolidada: tabelas, enums, contratos, DTOs e eventos. As issues desta pasta apontam para este arquivo quando precisam detalhar estruturas de dados.

---

## Enums

### `TrackSourceType`

| Caso | Descrição |
|---|---|
| `github` | Trilha sincronizada de um repo 4noobs |
| `native` | Trilha nativa da plataforma (reservado — sem provider, análogo ao RSS no contents) |

### `TrackStatus`

| Caso | Descrição |
|---|---|
| `syncing` | Aguardando primeira sincronização completa |
| `active` | Trilha sincronizada e disponível |
| `archived` | Trilha removida da fonte ou descontinuada |

### `ContentType`

| Caso | Descrição |
|---|---|
| `markdown` | Conteúdo processado pelo ETL (HTML sanitizado) |
| `link` | Link externo (referência direta ao repo) |

### `ContributionRole`

| Caso | Descrição |
|---|---|
| `author` | Autor principal (owner do repo ou .all-contributorsrc) |
| `co-author` | Co-autor listado no commits/README |
| `contributor` | Contribuidor listado em arquivo de autoria |

### `LessonFeedback`

| Caso | Descrição |
|---|---|
| `util` | Aula marcada como útil pelo usuário |
| `desatualizada` | Aula marcada como desatualizada (emite `LessonFlaggedOutdated`) |

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
| `status` | enum(TrackStatus) | DEFAULT `syncing` | Estado atual |
| `repo_owner` | varchar | NOT NULL | Owner do repo GitHub |
| `repo_name` | varchar | NOT NULL | Nome do repo GitHub |
| `repo_url` | varchar | NULLABLE | URL completa do repo |
| `default_branch` | varchar | NULLABLE | Branch padrão (api-resolved) |
| `language` | varchar | NULLABLE | Linguagem principal |
| `stars` | int | DEFAULT 0 | Estrelas no GitHub |
| `forks` | int | DEFAULT 0 | Forks no GitHub |
| `watchers` | int | DEFAULT 0 | Watchers no GitHub |
| `replaced_by_uuid` | uuid | NULLABLE, FK self | UUID da trilha substituta (rename) |
| `created_at` | timestamp | NOT NULL | |
| `updated_at` | timestamp | NOT NULL | |

**Indexes:**
- `(source_type, external_id)` — lookup por fonte
- `(status)` — filtro na listagem
- `(language)` — filtro por linguagem

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
| `created_at` | timestamp | NOT NULL | |
| `updated_at` | timestamp | NOT NULL | |

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
| `word_count` | int | NULLABLE | Contagem de palavras |
| `estimated_minutes` | int | NULLABLE | Duração estimada (ceil(word_count/200)) |
| `extra_content` | text | NULLABLE | Seção extra de conteúdo complementar (casos de borda) |
| `replaced_by_uuid` | uuid | NULLABLE, FK self | Aula substituta (rename) |
| `created_at` | timestamp | NOT NULL | |
| `updated_at` | timestamp | NOT NULL | |

**Indexes:**
- `(module_id, position)` — ordenação na árvore
- `(source_path)` — lookup por path durante ETL

### `track_contributors`

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | uuid | PK | |
| `track_id` | uuid | FK tracks, NOT NULL | Trilha |
| `github_username` | varchar | NOT NULL | Handle GitHub (chave de adoção) |
| `display_name` | varchar | NULLABLE | Nome de exibição |
| `avatar_url` | varchar | NULLABLE | URL do avatar |
| `is_owner` | bool | DEFAULT false | É o mantenedor principal |
| `contribution_role` | enum(ContributionRole) | NOT NULL | Papel na trilha |
| `user_id` | bigint | NULLABLE, FK users | Usuário da plataforma (adotado) |
| `created_at` | timestamp | NOT NULL | |
| `updated_at` | timestamp | NOT NULL | |

**Constraints:**
- `UNIQUE (track_id, github_username)` — upsert idempotente
- Exatamente um `is_owner = true` por trilha (garantido pelo ETL)

**Indexes:**
- `(github_username)` — lookup durante adoção
- `(user_id)` — lookup por usuário

### `user_track_state`

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | uuid | PK | |
| `user_id` | bigint | FK users, NOT NULL | Usuário |
| `track_id` | uuid | FK tracks, NOT NULL | Trilha |
| `bookmarked` | bool | DEFAULT false | Salva para depois |
| `rating` | int | NULLABLE | Avaliação 1–5 |
| `created_at` | timestamp | NOT NULL | |
| `updated_at` | timestamp | NOT NULL | |

**Constraints:**
- `UNIQUE (user_id, track_id)` — um registro por usuário↔trilha

### `lesson_feedback`

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | uuid | PK | |
| `user_id` | bigint | FK users, NOT NULL | Usuário |
| `lesson_id` | uuid | FK lessons, NOT NULL | Aula (UUID) |
| `feedback` | enum(LessonFeedback) | NOT NULL | Tipo de feedback |
| `created_at` | timestamp | NOT NULL | |
| `updated_at` | timestamp | NOT NULL | |

**Constraints:**
- `UNIQUE (user_id, lesson_id)` — um feedback por usuário↔aula (substituível)

### `user_completed_lessons`

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | uuid | PK | |
| `user_id` | bigint | FK users, NOT NULL | Usuário |
| `lesson_id` | uuid | FK lessons, NOT NULL | Aula (UUID) |
| `completed_at` | timestamp | NOT NULL | Quando marcou como concluída |
| `created_at` | timestamp | NOT NULL | |

**Constraints:**
- `UNIQUE (user_id, lesson_id)` — uma conclusão por usuário↔aula

**Indexes:**
- `(user_id, lesson_id)` — lookup para progresso
- `(lesson_id)` — contagem total de conclusões

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

### `LessonFlaggedOutdated`

Emitido quando um usuário marca aula como desatualizada.

| Campo | Tipo | Descrição |
|---|---|---|
| `lessonId` | uuid | Aula marcada |
| `userId` | bigint | Quem marcou |

Dispatch: ação de feedback no reader.

---

## Notas

- **XP/remuneração**: não existe nestas tabelas. Tracks emite fatos, gamificação decide (emenda D7 do ADR 0004).
- **Progresso por aula**: `user_completed_lessons` usa UUID da aula (imutável mesmo com rename). Renames criam novo registro ponteiro com `replaced_by_uuid`.
- **Ordem de extração de contribuidores**: `.all-contributorsrc` (owner repo) → `.github/config.json` (4noobs repo) → Seção contribuidores (owner repo) → Avatares inline (qualquer repo README, último recurso).
