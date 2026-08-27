**Título sugerido para o GitHub:** `prd(tracks): catálogo de trilhas 4noobs, progresso e interações GitHub`

[← README do módulo](README.md)

**Labels:** `type:prd` · `mod:tracks` · `difficulty:hard` · `ready-for-agent`

---

> Síntese de sessão `/grill-with-docs` e wayfinder completo. Design registrado em `app-modules/tracks/docs/CONTEXT.md`, ADRs `0001-content-identity-via-stable-uuid`, `0002-etl-normalization-strategy`, `0003-modelo-de-dados` e `0004-decisoes-do-modulo-e-alinhamento-com-contents`. Protótipos aprovados em commits `9cc1e5fb` / `8e20a598` neste fork. Proposta consolidada nesta pasta: [`spec.md`](spec.md), ADR 0004, [`artefatos/tracks-docs.html`](artefatos/tracks-docs.html).

---

## Problem Statement

A comunidade He4rt mantém o programa **4noobs**: repositórios `{topic}4noobs` espalhados por owners individuais (`he4rt/css4noobs`, `danielhe4rt/php4noobs`, …), cada um com conteúdo educacional 100% markdown em português. Hoje esse acervo **não existe para a plataforma**: não há catálogo, navegação, progresso de leitura, valorização de criadores, nem interação com o GitHub dentro do site. Quem quer aprender precisa navegar repos soltos no GitHub, sem descoberta guiada, sem registro de onde parou, sem reconhecimento de quem escreveu. A comunidade precisa de um **catálogo vivo** que una valor ao criador e experiência de leitura ao estudante — e que se mantenha atualizado sem intervenção manual a cada trilha nova.

## Solution

Um novo bounded context `tracks` que:

1. **Catálogo automático**: sincroniza os repos 4noobs como trilhas hierárquicas (trilha → módulo → aula), identificadas por UUIDs determinísticos estáveis, atualizado por agendamento com descoberta automática de novas trilhas.
2. **Leitura com progresso**: listagem com busca/filtros/ordenação, detalhe em aside sobreposto e leitor "Focus Reader" com marcação de aula concluída — estado pessoal vinculado ao UUID da aula, não ao path.
3. **Valorizar criadores**: contribuidores extraídos das fontes de autoria dos repos (`.all-contributorsrc`, `config.json`, `README`), com ciclo de órfãos — handle sempre gravado, adoção retroativa automática quando o autor conecta a conta GitHub.
4. **Interações GitHub**: estrelar/watch/follow a trilhas e mantenedores a partir da plataforma, escrevendo no GitHub em nome do usuário conectado; controles com matriz de estados (conta ausente, repo morto, token expirado).
5. **Estado pessoal local**: salvar trilha, avaliar (1–5), feedback por aula (útil/desatualizada) — sem exigir conta GitHub, sem escrever fora da plataforma.

O módulo é **contexto irmão** do `contents` (decisão Opção B): `contents` cataloga peças planas publicadas (artigos dev.to hoje); `tracks` modela estruturas hierárquicas de aprendizado com progresso e autor. Nenhum depende do outro. As regras arquiteturais adotadas do contents são: contratos invertidos (tracks define, integration implementa), ciclo de órfãos via `ExternalIdentityConnected`, sem recompensa no domínio (gamificação escuta fatos).

## User Stories

1. As a super-admin/community manager, I want new trilhas to appear automatically in the catalog when announced in the 4noobs README, so that discovery is frictionless.
2. As a person exploring trilhas, I want to browse a searchable catalog with filters (language, level, duration, status), so that I can find relevant content fast.
3. As a person browsing, I want to see my personal progress on each trilha card, so that I know where I left off at a glance.
4. As a person reading, I want to mark a lesson as completed, so that my progress persists across sessions.
5. As a person, I want to save a trilha for later (bookmark), so that I can build a personal reading list.
6. As a person reading, I want to flag a lesson as outdated, so that the platform signals quality issues to maintainers.
7. As a person reading, I want prev/next navigation that follows the order determined by the ETL, so that I consume content linearly without skipping.
8. As a person, I want to view trilha details in an overlay (aside) without losing catalog context, so that browsing remains fluid.
9. As a person with a connected GitHub account, I want to star a trilha's repository from the platform, so that I support the author at the source.
10. As a person, I want to watch a trilha's repository, so that I receive updates directly on GitHub.
11. As a person, I want to follow a trilha's maintainer on GitHub, so that I discover their other work.
12. As a maintainer credited on a trilha, I want to be linked to my platform account retroactively when I connect GitHub, so that my contribution is recognized without re-export.
13. As a maintainer without a platform account, I want my handle and avatar displayed as an orphan, so that credit is never lost or assumed.
14. As the platform, I want trilha and lesson identity via stable UUID (v5), so that file renames between syncs never break progress or interactions.
15. As the platform, I want no XP awarded by the tracks module, so that gamification decisions remain centralized in the gamification context.
16. As an operator, I want structured logs per sync run (discoveries, updates, failures), so that I can audit catalog health.
17. As a person without a platform account, I want to browse the full catalog with zeroed progress, so that tracks works for guests without gatekeeping content.

## Implementation Decisions

**Module**: new domain module `tracks` em `app-modules/tracks/`. No antagonist. ServiceProvider bootável, composer constraint `^1.0.0` desde o primeiro commit (lição do contents). Label `mod:tracks` a criar no GitHub espelhando `mod:contents`.

**Inverted contracts** (regra consolidada pelo contents): tracks define as interfaces; `integration-github` implementa e se registra no boot. Tracks nunca importa HTTP/Saloon/git — zero dependência de transporte. Providers são checados via `instanceof` para capacidades opcionais (padrão da casa — sem flags de config nem arrays vazios).

**Capacidades por provider** (interfaces optativas):
- `DiscoversTrackSources` — descobre quais repos/fontes existem
- `FetchesRepositoryMetadata` — busca metadados (branch default, stars, linguagem)
- `ProvidesWorkingCopy` — clone shallow/pull incremental em storage dedicado; detach do domínio (clone é operacional, não conceitual)

**Identity** (ADR 0001):
- Namespace UUIDv5 por trilha; módulo e aula recebem v5 sobre `namespace_track + source_path`
- Rename → soft-delete (`replaced_by_uuid`); progresso e interações vinculam ao UUID imutável
- Fonte da verdade: path no momento da criação; renames seguintes criam novo registro ponteiro

**Data model** (ADR 0003 + emenda D7 do ADR 0004), todos UUID + `timestampsTz`:

    tracks: id uuid pk · source_type enum('github','native') · external_id varchar unique
            · title · slug · description nullable · cover_image_url nullable
            · status enum('syncing','active','archived') default 'syncing'
            · repo_owner · repo_name · repo_url nullable · default_branch nullable
            · language nullable · stars int default 0 · forks int default 0
            · watchers int default 0 · replaced_by_uuid nullable fk self · timestampsTz

    modules: id uuid pk · track_id fk · title · slug · source_path varchar · position int
             · replaced_by_uuid nullable · timestampsTz

    lessons: id uuid pk · module_id fk · title · slug · position int
             · source_path varchar · content_type enum('markdown','link') default 'markdown'
             · processed_content text nullable · word_count int nullable
             · estimated_minutes int nullable · extra_content text nullable
             · replaced_by_uuid nullable · timestampsTz

    track_contributors: id uuid pk · track_id fk · github_username varchar
                        · display_name nullable · avatar_url nullable
                        · is_owner bool default false
                        · contribution_role enum('author','co-author','contributor')
                        · user_id nullable fk users · timestampsTz

    user_track_state: id uuid pk · user_id fk · track_id fk
                      · bookmarked bool default false · rating int nullable
                      · unique(user_id, track_id) · timestampsTz

    lesson_feedback: id uuid pk · user_id fk · lesson_id uuid fk
                     · feedback enum('util','desatualizada')
                     · unique(user_id, lesson_id) · timestampsTz

    user_completed_lessons: id uuid pk · user_id fk · lesson_id uuid fk
                            · completed_at timestamp · unique(user_id, lesson_id)

Sem coluna de XP/exp_reward — suprimida pela emenda D7 do ADR 0004. Tracks emite fatos (`TrackMaintainersLinked` novo); gamificação decide.
**ETL** (`tracks:sync`, agendado a cada 30min configurável):
- Reads `ProvidesWorkingCopy` do provider → path local
- Normalização: módulos = diretórios topo ignorando `.github/` e configs; aulas = arquivos `.md`/`.MD` (normalizado)
- Override map por repo para desvios estruturais (ex.: `Content/`)
- Branch via `RepoMetadataDTO.default_branch` (nunca hardcoded `main`)
- Imagens relativas reescritas para `raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`
- Ordenação heurística: seções numeradas do README ROADMAP → alfabética → git tree order
- Idempotência: upsert por `(source_type, external_id)` em trilhas; `source_path` em aulas
- Tolerância a falha: erro numa fonte → log + segue; nenhuma trilha existente apagada por falha parcial
- Lock de cache anti-sobreposição; `--force` para refresh completo

**Orphan lifecycle** (idêntico ao contents):
- `track_contributors.github_username` sempre preenchido (memória e chave de adoção); `user_id` nullable
- Listener de `ExternalIdentityConnected` dispara `AdoptTrackContributors`: handle match → preenche `user_id` nos órfãos → emite `TrackMaintainersLinked` por trilha afetada, idempotente
- Prioridade de extração: `.all-contributorsrc` > `.github/config.json` > seção Autores do README > avatares inline

**Interações — dois grupos** (ADR 0004, D6):
- **Grupo A — ações no GitHub**: star/watch/follow escrevem lá fora; exigem conta vinculada + escopo (`public_repo`, `user:follow`); token por requisição via `ExternalIdentity` decrypt (padrão existente em `GetCurrentUser`); endpoints em `Transport/Requests/Interactions/` na integration; `Actions` wrappers finas
- **Grupo B — estado local**: bookmark/avaliação/feedback — sem conta GitHub, sem escrever fora; upsert idempotente; `LessonFlaggedOutdated` emitido na transição para "desatualizada"

**UI** (aprovada em protótipo — variante C + aside + Focus Reader):
- **Listagem** (panel-app): página Livewire/Filament real, busca server-side, filtros na URL, stats pessoais autenticadas, progresso por card, badges
- **Detalhe**: aside sobreposto via render hook `LAYOUT_END`; header com stats repo, criador, badges, árvore módulos/aulas com check, contribuidores
- **Reader**: Focus Reader servindo `processed_content`; sidebar colapsável com h2; code blocks com copy; breadcrumb; prev/next; marcar concluída
- **Ações GitHub**: header do aside — Star(icon+count)/Watch/Sponsor(external)/Share(web share fallback); follow por contribuidor; matriz de estados aplicada integralmente; contagem verificada contra API, nunca assumida

**Scheduling** (fase 1):
- Intervalo configurável via `config('tracks.sync.interval_minutes')`, default 30min
- Cache lock anti-sobreposição; `php artisan tracks:sync` sempre tem precedência
- Webhook de push do GitHub fora do escopo — registrado como próximo passo natural

## Testing Decisions

Três costuras de teste confirmadas em escopo:

1. **Idempotência do ETL**: rodar sync duas vezes sem mudança na fonte resulta em zero alterações; rename preserva progresso via `replaced_by_uuid`; determinismo de UUIDs provado contra fixtures
2. **Matrix de interações (Grupo A)**: checks booleanos 204/404 traduzidos corretamente; token expirado sinaliza erro tratável (não exceção crua); contagem verificada contra API
3. **Lifecycle de órfãos**: adoção retroativa idempotente; contribuidor sem conta é estado válido (handle/avatar visíveis); reconexão não duplica vínculo nem re-emite fato
4. **Estado local (Grupo B)**: upsert idempotente para bookmark/rating; feedback único por aula substituível; deslogado não altera estado

Prior art: action/feature tests em `identity` e `moderation`; factories com `->recycle($tenant)`; Filament resource tests com `livewire()`.

## Out of Scope

- Módulo `gamification` e a mecânica de XP — tracks emite fatos, gamificação decide (emenda D7 do ADR)
- Provider `native` — trilhas da plataforma (não são de ninguém, análogo ao RSS no contents)
- Provider RSS/Dev.to — pertence ao módulo `contents`; tracks só lida com repos 4noobs
- Comentários/forks/Discussions nas trilhas — discussão via GitHub Issues/PRs, não na plataforma
- App mobile — `panel-app` web only neste delivery
- Webhook de push do GitHub para sync reativo — fase 2
- Videos em trilhas — possível extensão futura via capability nova no provider
- Capability `ProvidesWorkingCopy` como interface no repositório principal — ponto aberto, mas não bloqueia implementation

## Further Notes

- **Contents alignment**: quatro regras adotadas do contents (contratos invertidos, orfãos, XP fora, sem flag vazio); quatro mantidas diferentes por natureza do tracks (arvore hierárquica, ETL git incremental, source_type+JSONB ao invés de delegated types, estado local por aula)
- **Evolução**: provider `native` pode ser adicionado depois sem refatorar o domínio; o ETL pode ser estendido para vídeo com uma nova capability; webhook pode ser ativado sem mudar a estrutura de agendamento
- **Reviewer note**: stherzada pediu mais contexto no ADR de governância do squads e cenários BDD off-system escritos — follow-up de doc, não bloqueante. No tracks, o ponto aberto equivalente é `ProvidesWorkingCopy` (clone git atrás do contrato) — discutir antes de abrir o PR
- **Commit do contents como lição**: o contents nasceu com constraint ausente e o locator ficou verde apenas depois de criada a label `mod:contents`. Este PRD já prevê constraint `^1.0.0` e label no primeiro commit

## Subtarefas (tracer bullets — ordem de dependência)

- [ ] # — scaffold do módulo tracks (`01-scaffold-modulo-tracks`)
- [ ] # — evento `ExternalIdentityConnected` no identity (`02-identity-evento-conexao`)
- [ ] # — contratos de fonte `TrackSourceProvider` + registry (`03-provider-contract-e-registry`)
- [ ] # — `GithubTrackProvider` descoberta + metadados (`04-github-provider-descoberta-metadados`)
- [ ] # — `SyncTracks` ETL completo (`05-sync-tracks-etl`)
- [ ] # — contribuidores + ciclo de órfãos com adoção retroativa (`06-contribuidores-adocao-orfaos`)
- [ ] # — listagem real substituindo protótipo mockado (`07-panel-app-listagem-trilhas`)
- [ ] # — `TrackAside` + leitor com progresso (`08-panel-app-detalhe-leitor`)
- [ ] # — `UserTrackState` completo — salvar/avaliar/feedback (`09-user-track-state-salvar-avaliar-feedback`)
- [ ] # — endpoints de interação GitHub (`10-github-interaction-endpoints`)
- [ ] # — ações GitHub na UI do aside (`11-panel-app-acoes-github-ui`)
- [ ] # — agendamento + descoberta automática (`12-agendamento-descoberta-automatica`)
