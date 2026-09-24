---
type: ADR
title: "ADR 0005 — Reescopo para agregador: o tracks deixa de ser LMS"
description: "Emendas E-D1–E-D11 e E-E que removem o estado pessoal do escopo, definem curation por allowlist e o modelo transporte × domínio."
tags: [tracks, adr, reescopo, agregador]
status: proposed
generated:
  by: human:GabrielFVDev
  at: 2026-09-09T00:00:00Z
---
# ADR 0005 — Reescopo para agregador: o `tracks` deixa de ser LMS

[← Índice do módulo](../index.md)

- **Status:** Proposto
- **Data:** 2026-09-09
- **Relaciona:** [0004](0004-decisoes-do-modulo-e-alinhamento-com-contents.md) (D1–D9); `integration-github` ADR-0001; `onboarding` ADR-0002 (`purpose`); spec v2 (não versionada neste repo)
- **Procedência:** revisão de 2026-09-09 da proposta pós-upstream, com escopo reduzido

## Contexto

A proposta v2 (ADR 0004, D1–D9) definia `tracks` como um contexto com comportamento de LMS: `user_track_state` (bookmark/rating), `lesson_feedback` (útil/desatualizada), `user_completed_lessons` (progresso) e uma hierarquia sincronizada para servir um leitor com marcação de conclusão. Após envio para review upstream, a decisão foi **reduzir o escopo para um agregador**. A plataforma indexa e apresenta o acervo 4noobs — leitura focado e apoio ao criador — sem rastrear progresso pessoal nem colher feedback.

Este documento consolida o reescopo como **emendas aos D1–D9**, mantendo o histórico de cada decisão e marcando onde o novo escopo os altera. Onde o agregador mantém, registra-se "mantido"; onde remove, registra-se a emenda.

## Emendas

### E-D1 — Identidade estável (UUIDv5): mantido

Trilha, módulo e aula continuam com UUIDv5 determinístico (namespace da trilha + source path) e `replaced_by_uuid` em rename. Não importa o escopo: a integridade da árvore entre syncs depende disso. Nenhuma mudança.

### E-D2 — `source_type` mantido, `source_data` JSONB removido (E-D11)

`tracks.source_type` (enum) continua como discriminador de fonte, **mas o `source_data` JSONB sai**: todos os metadados de fonte foram promovidos a colunas planas e consultáveis (`repo_owner`, `repo_name`, `repo_url`, `default_branch`, `language`, `category`, `stars`, `forks`, `watchers`) — ver E-D11. **Emendado por E-D10:** o caso `native` sai do schema/código — ver emenda abaixo.

### E-D3 — Hierarquia, ordenação e conteúdo: mantido, com **remoção de `estimated_minutes` e `word_count`**

`modules` = diretórios de 1º nível, `lessons` = arquivos markdown; heurística de ordenação e HTML pós-ETL mantidos. **Emenda (revisada):** `lessons.estimated_minutes` (≈ ceil(word_count/200)) é **removido** — é vocabulário de duração/leitura do LMS, fora do escopo agregador. O primeiro corte manteve `word_count` como "dado bruto barato de manter", mas a revisão da proposta **removeu `word_count` também**: ele só existia para alimentar a projeção de duração e não tem consumidor no agregador.

> Escopo ex-cópia-via-conversa: no agg, o artefato remove **toda** referência a duração — filtro, ordenação, valor de exibição. Nenhuma métrica de tamanho/duração de conteúdo é gravada.

### E-D4 — ETL misto em comando único: reescrivado sobre a allowlist + `purpose`

A descoberta de fontes deixa de ser a única via (README do `he4rt/4noobs`). O **cadastro da allowlist** da `integration-github` (`github_repositories`) passa a ser a **porta de entrada de curation** para trilhas:

- `GithubRepository.purpose` ganha o caso `Tracks` (padrão consumer-driven já fixado pelo `onboarding` ADR-0002: uma *categoria de projeção* no allowlist — nunca o vocabulário do consumidor).
- `github_repositories.enabled` = **ingestão** (o toggle existente). Se false, para de ingerir.
- `tracks.status` (`syncing` | `active` | `archived` + novo `hidden`/`published`) = **exibição**. Setado a partir do painel, mas **armazenado na linha do track**, não no allowlist. É o gate de publish/unpublish: oculta a trilha da listagem sem parar a ingestão.

A sincronização segue o **padrão do backfill** (job por repo, idempotente, resumível, rate-limit-aware) — mas é um **caminho de ingestão separado** do `BackfillRepository` de contribuições (ver E-E). **Model 2** (ver E-E): a persistência/normalização mora no tracks; a integration só transporta e devolve DTOs.

**Caveats de aplicar o padrão backfill a muitos repos (descoberta automática)** — documentados aqui:
1. **Rate limit**: o backfill de contribuições queima ~500 requests REST/repo. A descoberta automática de dezenas de repos `{topic}4noobs` multiplica isso. A ingestão de trilhas em si é clone + leitura de arquivos (não REST list), então o custo concentra-se no fetch de metadados (1 request/repo).
2. **Escopo do webhook**: a org webhook é allowlist-filtrada. Repos auto-descobertos não estão na allowlist de contribuições, então suas contribuições não entram a menos que adicionados. A ingestão de trilhas (clone/parse) é independente do webhook.
3. **Gate de curation**: descoberta propõe, admin aprova/publica. Descoberta nunca auto-publica.
4. **Colisões/renames**: a nomenclatura `{topic}4noobs` não é garantida; renames precisam do `replaced_by_uuid`.

### E-D5 — Autoria: reescrivada com **endpoint de contribuidores como fonte primária**

A cadeia de extração de contribuidores é **reordenada e simplificada**: o endpoint **`GET /repos/{owner}/{repo}/contributors`** (all-time; atualmente `selectedMetric=additions` como recomendação validada) vira a **fonte primária**. As fontes de autoria `.all-contributorsrc` → `.github/config.json` → autores do README → avatares inline **permanecem como fallback por trás**, para não perder quem contribui fora de código (docs/review — o valor real num ecossistema de tutoriais markdown).

- `is_owner` = owner do repo.
- A seta de contribuidores continua: `github_username` sempre gravado (memória + chave de adoção); `user_id` nullable; adoção retroativa via `ExternalIdentityConnected` → `TrackMaintainersLinked` mantida.

> Nota de revisão: a recomendação `selectedMetric=additions` sub-pondera contribuidores de não-código (exatamente quem o `.all-contributorsrc` credita). Decisão de produto a validar contra repos reais; se confirmado o viés, o endpoint passa a ser primário só para o ranking de código e o `.all-contributorsrc` volta a ser a autoridade de autoria. Sem mudança estrutural — é só coluna/captura.

### E-D6 — Interações GitHub: **removido o Grupo B**, mantido o Grupo A

- **Grupo A — ações no GitHub (star/watch/follow): mantido.** Escritas reais via API, token por requisição (`ExternalIdentity`), scopes a acrescentar (`public_repo`, `user:follow`), matriz de estados (conta ausente, repo morto, token expirado). Ficam **stateless/transitórias** (não há estado local para verificar).
- **Grupo B — estado local (bookmark/rating/feedback):** **removido inteiro.** `user_track_state`, `lesson_feedback`, `user_completed_lessons` e `LessonFlaggedOutdated` saem do modelo. O "salvar local"/"avaliar"/"feedback de aula" do LMS não existe mais.

### E-D7 — Recompensa fora do domínio: mantido

`xp_reward` continua fora; tracks não carrega vocabulário de recompensa. Com a queda do progresso, os fatos `LessonCompleted`/`TrackCompleted` também saem. Resta `TrackMaintainersLinked`.

### E-D8 — Interface: mantida, com remoção do `poc-stats` e do estado pessoal

- **Listagem** (variante C, tema dark GitHub): mantida, mas **sem `.poc-stats`** (horas estudadas, trilhas em andamento, XP) e **sem disponibilidade de progresso pessoal por card** (não existe mais).
- **Detalhe** (`TrackAside`): mantido; tree módulos/aulas sem "check de conclusão"; contribuidores + ações GitHub mantidos.
- **Leitor** (Focus Reader): mantido; **sem marcar aula concluída**, **sem feedback por aula**; só leitura + prev/next.

### E-E — Fronteira de módulo (novo, essencial): **Model 2 — transporte na integration, domínio no tracks**

O reuso do backfill levantou a questão de onde mora cada responsabilidade. Decidido:

- **`integration-github` = transporte.** Implementa os contratos do tracks e devolve **DTOs**: `ProvidesWorkingCopy` (clone/pull → path), `FetchesRepositoryMetadata` (→ `RepoMetadataDTO`), e agora **fetch de contribuidores** (→ DTO). Reusa `GitHubApiConnector` e `RateLimit`. **Não** possui as tabelas `tracks`/`modules`/`lessons`/`track_contributors`.
- **`tracks` = domínio que decide o que é verdade.** Possui os **models, migrações, normalização (parse, hierarquia, contribuidores → `track_contributors`) e persistência**. É o agregador.

Isso mantém a regra do ADR-0002 ("integration é transporte, consumidores são domínios") e o CONTEXT.md da integration ("module owns o modelo de contribuições... não é domínio de conteúdo"). **Não colapsar** aggregation dentro da integration.

### E-D9 — Posicionamento: mantido — contexto irmão do `contents`

`tracks` permanece contexto irmão do `contents` (assim como o agregador ainda é um catálogo hierárquico de aprendizado, não um catálogo plano de peças). As quatro regras da casa permanecem: inversão de contrato, ciclo de órfãos, recompensa via evento, capacidades por interface.

### E-D10 — `TrackSourceType` sem `native` no código: reservado em docs

O enum `TrackSourceType` nasce **com o único caso `github`** no schema/DDL/código. O caso `native` (trilha nativa da plataforma, sem provider — análogo ao RSS no contents) fica **reservado apenas em documentação** (out-of-scope, prosa de ADRs/issue). Como o schema é *proposta* (tabela ainda não existe), trims agora evitam migration cruel de enum em Postgres depois.

### E-D11 — `source_data` JSONB: removido (flatten em colunas planas)

O `source_data` JSONB do D2 (**ADR 0004**) é **removido**. Todos os metadados de fonte viram colunas planas na linha do track — exatamente a forma já consolidada no `schema.md` (referência que as issues apontam):

`repo_owner` · `repo_name` · `repo_url` (nullable) · `default_branch` (nullable, api-resolved) · `language` (nullable) · `category` (nullable, resolvida no ETL) · `stars`/`forks`/`watchers` (default 0).

Racional da remoção:

- **Sem payload de fonte hoje**: `native` já saiu (E-D10); com só o caso `github`, não existe "específico de fonte" que não seja coluna consultável (busca/filtro/ordenação usam `language`, `category`, `status`, ...).
- **Alinhado ao `.ai/06` (typed JSON casts)**: manter JSONB obrigaria um cast tipado (VO + cast) para evitar o cast solto `array` banido pela casa; colunas planas eliminam a necessidade.
- **Single source of truth**: o `schema.md` já consolidava o flatten; esta emenda alinha spec/PRD/ADRs a ele, removendo a divergência entre documentos.
- **Custo de nova fonte futura** é o mesmo de sempre (nova coluna ou capability, quando existir) — YAGNI agora.

## O que sai do escopo (resumo do reescopo)

| Antes (LMS) | Agora (agregador) |
|---|---|
| `user_track_state` (bookmark/rating) | ❌ removido |
| `user_completed_lessons` (progresso) | ❌ removido |
| `lesson_feedback` (útil/desatualizada) | ❌ removido |
| `LessonCompleted` / `TrackCompleted` | ❌ removido |
| `LessonFlaggedOutdated` | ❌ removido |
| `lessons.estimated_minutes` (duração) | ❌ removido |
| `lessons.word_count` | ❌ removido (só alimentava `estimated_minutes`) |
| Filtro nível / duração / progresso; sort "Menor duração" | ❌ removido |
| `.poc-stats` (horas, XP, em andamento) | ❌ removido |
| Autoria só por arquivos de autoria (.all-contributorsrc → …) | ➡ endpoint de contribuidores primeiro, arquivos por trás |
| Descoberta só automática | ➡ submission na allowlist (`purpose=Tracks`) + auto-discovery com caveats |
| `source_data` JSONB (payload de fonte) | ➡ colunas planas (`repo_owner` … `watchers`), remoção via E-D11 |
| Estado local como conceito | ❌ removido (interações são só GitHub, stateless) |

## Consequências

- **Positivas:** modelo de dados cortado pela metade (3 tabelas de estado saem); ETL simplificado (sem duração projetada, sem parse de 4 camadas de autoria); fronteira limpa transporte/domínio modelada explicitamente; curation por allowlist reusa infra e painel existentes; publicação/unpublicação desacopla exibição de ingestão.
- **Custos:** agregação perde o "rastreamento do aluno" de valor competitivo; contribuidores de não-código dependem da decisão endpoint-vs-all-contributors (a validar); artefato HTML e protótipos precisam ser atualizados (remover `.poc-stats`, progresso, feedback, duração).
- **Emendas aos ADRs:** 0003 perde `estimated_minutes`, `word_count` e as tabelas de estado pessoal; 0004 (D2 reescrita pelo flatten E-D11, D3, D5, D6, D8) emendadas acima; 0001–0002 mantidos.
