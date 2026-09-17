**Título sugerido para o GitHub:** `prd(tracks): agregador de trilhas 4noobs, leitura focado e interações GitHub`

[← README do módulo](README.md)

**Labels:** `type:prd` · `mod:tracks` · `difficulty:hard` · `ready-for-agent`

---

> Proposta consolidada do design do módulo `tracks`. Design registrado em `app-modules/tracks/docs/CONTEXT.md`, ADRs `0001-content-identity-via-stable-uuid`, `0002-etl-normalization-strategy`, `0003-modelo-de-dados`, `0004-decisoes-do-modulo-e-alinhamento-com-contents` e novo `0005-reescopo-para-agregador`. Protótipos aprovados em commits `9cc1e5fb` / `8e20a598` neste fork. Proposta consolidada nesta pasta: [`spec.md`](spec.md), ADR 0005, [`artefatos/tracks-docs.html`](artefatos/tracks-docs.html).

**Escopo v3 (agregador):** após review upstream, o `tracks` deixa de ser LMS. Sem progresso pessoal, bookmark, avaliação ou feedback por aula. É um **agregador**: indexa e apresenta o acervo 4noobs, oferece leitura focado e ações de apoio ao criador no GitHub.

---

## Problema

A comunidade He4rt mantém o programa **4noobs**: repositórios `{topic}4noobs` espalhados por owners individuais (`he4rt/css4noobs`, `danielhe4rt/php4noobs`, …), cada um com conteúdo educacional 100% markdown em português. Hoje esse acervo não existe para a plataforma: não há catálogo, navegação, nem valorização de criadores. Quem quer aprender precisa navegar repos soltos no GitHub, sem descoberta guiada e sem reconhecimento de quem escreveu. A comunidade precisa de um **agregador vivo** que una valor ao criador e experiência de leitura ao estudante — e que se mantenha atualizado sem intervenção manual a cada trilha nova.

## Solução

Um novo bounded context `tracks` que:

1. **Catálogo automático**: sincroniza os repos 4noobs como trilhas hierárquicas (trilha → módulo → aula), identificadas por UUIDs determinísticos estáveis, atualizado por agendamento com descoberta automática de novas trilhas — **com curadoria**: add à allowlist e publish/unpublish pelo admin.
2. **Leitura focado**: listagem com busca/filtros/ordenação, detalhe em aside sobreposto e leitor "Focus Reader" servindo conteúdo processado. Sem marcação de conclusão.
3. **Valorizar criadores**: contribuidores vindos do **endpoint de contribuidores GitHub** (fonte primária) com fallback para `.all-contributorsrc` → `config.json` → README → avatares; ciclo de órfãos — handle sempre gravado, adoção retroativa automática quando o autor conecta a conta GitHub.
4. **Interações GitHub**: estrelar/watch/follow a trilhas e mantenedores a partir da plataforma, escrevendo no GitHub em nome do usuário conectado; **stateless** (estado verificado contra a API); controles com matriz de estados (conta ausente, repo morto, token expirado).

O módulo é **contexto irmão** do `contents` (decisão Opção B) e adota suas regras (contratos invertidos, ciclo de órfãos, sem recompensa no domínio, capacidades por interface).

**Fronteira de módulo (Model 2):** `integration-github` é **transporte** — devolve DTOs (working copy, metadata, contribuidores), reusa o padrão de backfill (idempotente, resumível, rate-limit-aware) e a allowlist (`purpose = Tracks`). `tracks` é o **domínio** que decide o que é verdade e **persiste** nos seus models. Não colapsar a agregação na integration.

## Histórias de usuário

1. Como super-admin/community manager, quero que novas trilhas sejam propostas automaticamente quando anunciadas no README dos 4noobs, para que a descoberta seja sem fricção — e eu as publique após a curadoria.
2. Como pessoa explorando trilhas, quero navegar por um catálogo pesquisável com filtros (categoria, status), para que eu encontre conteúdo relevante rápido.
3. Como pessoa navegando, quero ver cards de trilha com título, criador, linguagem, quantidade de módulos e estado de interação, para que eu escaneie rápido.
4. Como pessoa lendo, quero navegação prev/next que siga a ordem determinada pelo ETL, para que eu consuma o conteúdo de forma linear.
5. Como pessoa, quero ver os detalhes de uma trilha num overlay (aside) sem perder o contexto do catálogo, para que a navegação continue fluida.
6. Como pessoa com conta GitHub conectada, quero dar star no repositório de uma trilha a partir da plataforma, para que eu apoie o autor na fonte.
7. Como pessoa, quero dar watch no repositório de uma trilha, para que eu receba atualizações direto no GitHub.
8. Como pessoa, quero seguir o mantenedor de uma trilha no GitHub, para que eu descubra outros trabalhos dele.
9. Como mantenedor creditado numa trilha, quero ser vinculado à minha conta da plataforma retroativamente quando eu conectar o GitHub, para que minha contribuição seja reconhecida sem re-exportar.
10. Como mantenedor sem conta na plataforma, quero meu handle e avatar exibidos como órfão, para que o crédito nunca seja perdido nem assumido por outro.
11. Como plataforma, quero identidade de trilha e aula via UUID estável (v5), para que renomes de arquivo entre syncs nunca quebrem a árvore.
12. Como plataforma, quero que o módulo tracks não conceda XP, para que as decisões de gamificação permaneçam centralizadas no contexto de gamificação.
13. Como operador, quero logs estruturados por execução de sync (descobertas, atualizações, falhas), para que eu audite a saúde do catálogo.
14. Como operador, quero adicionar um repo 4noobs à allowlist de agregação pelo painel de admin, para que ele se torne uma trilha.
15. Como operador, quero publicar/despublicar uma trilha, para que eu controle o que está visível sem parar a ingestão.
16. Como pessoa sem conta na plataforma, quero navegar pelo catálogo completo, para que as trilhas funcionem para visitantes sem bloquear o conteúdo.

## Decisões de implementação

**Módulo**: new domain module `tracks` em `app-modules/tracks/`. ServiceProvider bootável, composer constraint `^1.0.0` desde o primeiro commit (lição do contents). Label `mod:tracks` a criar no GitHub espelhando `mod:contents`.

**Contratos invertidos** (regra consolidada pelo contents): tracks define as interfaces; `integration-github` implementa e se registra no boot. Tracks nunca importa HTTP/Saloon/git — zero dependência de transporte. Providers são checados via `instanceof` para capacidades opcionais.

**Capacidades por provider** (interfaces optativas):
- `DiscoversTrackSources` — descobre quais repos/fontes existem (propõe, não publica)
- `FetchesRepositoryMetadata` — busca metadados (branch default, stars, linguagem)
- `ProvidesWorkingCopy` — clone shallow/pull incremental em storage dedicado
- `FetchesContributors` — **novo**: `GET /repos/{owner}/{repo}/contributors` all-time (fonte primária de autoria; `selectedMetric=additions` a validar)

**Allowlist + curadoria + publicação** (padrão ADR-0002 do onboarding):
- `GithubRepository.purpose` ganha o caso **`Tracks`** (categoria de projeção; nunca o vocabulário do consumidor)
- `github_repositories.enabled` = ingestão; `tracks.status` (`syncing`|`active`|`hidden`|`archived`) = exibição, armazenado no track
- **Publish/unpublish** = setar `tracks.status` no `GithubRepositoryResource` (painel reusado)
- **Auto-discovery** mantida, mas apenas **propõe** (pendente no painel)

**Identity** (ADR 0001):
- Namespace UUIDv5 por trilha; módulo e aula recebem v5 sobre `namespace_track + source_path`
- Rename → soft-delete (`replaced_by_uuid`)
- Fonte da verdade: path no momento da criação; renames seguintes criam novo registro ponteiro

**Modelo de dados** (ADR 0003 + emendas D7/0004 + 0005), todos UUID + `timestampsTz`:

    tracks: id uuid pk · source_type enum('github') · external_id varchar unique
            · title · slug · description nullable · cover_image_url nullable
            · status enum('syncing','active','hidden','archived') default 'syncing'
            · repo_owner · repo_name · repo_url nullable · default_branch nullable
            · language nullable · category nullable · stars int default 0 · forks int default 0
            · watchers int default 0 · replaced_by_uuid nullable fk self · timestampsTz

    modules: id uuid pk · track_id fk · title · slug · source_path varchar · position int
             · replaced_by_uuid nullable · timestampsTz

    lessons: id uuid pk · module_id fk · title · slug · position int
             · source_path varchar · content_type enum('markdown','link') default 'markdown'
             · processed_content text nullable
             · extra_content text nullable · replaced_by_uuid nullable · timestampsTz

    track_contributors: id uuid pk · track_id fk · github_username varchar
                        · display_name nullable · avatar_url nullable
                        · is_owner bool default false
                        · contribution_role enum('author','co-author','contributor')
                        · user_id nullable fk users · timestampsTz

> **Removidos no agregador:** `user_track_state`, `lesson_feedback`, `user_completed_lessons`, `lessons.estimated_minutes`. Sem coluna de XP (D7).

**ETL** (`tracks:sync`, agendado por padrão a cada 1 semana, configurável):
- Intake via allowlist: lê `GithubRepository::where('purpose', Tracks)` (tenant-scoped), padrão backfill (job por repo, idempotente, resumível, rate-limit-aware)
- Reads `ProvidesWorkingCopy` do provider → path local
- Normalização: módulos = diretórios topo ignorando `.github/` e configs; aulas = arquivos `.md`/`.MD` (normalizado)
- Override map por repo para desvios estruturais (ex.: `Content/`)
- Branch via `RepoMetadataDTO.default_branch` (nunca hardcoded `main`)
- Imagens relativas reescritas para `raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`
- Ordenação heurística: seções numeradas do README ROADMAP → alfabética → git tree order
- Idempotência: upsert por `(source_type, external_id)` em trilhas; `source_path` em aulas
- Tolerância a falha: erro numa fonte → log + segue; nenhuma trilha existente apagada por falha parcial
- Lock de cache anti-sobreposição; `--force` para refresh completo
- **Caveats de backfill para muitos repos** (auto-discovery): rate limit, escopo do webhook, gate de curation, renames — documentados no ADR 0005 (E-D4)

**Ciclo de órfãos** (idêntico ao contents):
- `track_contributors.github_username` sempre preenchido (memória e chave de adoção); `user_id` nullable
- Listener de `ExternalIdentityConnected` dispara `AdoptTrackContributors`: handle match → preenche `user_id` nos órfãos → emite `TrackMaintainersLinked` por trilha afetada, idempotente
- Prioridade de autoria: **endpoint de contribuidores** (1º) → `.all-contributorsrc` → `.github/config.json` → seção Autores do README → avatares inline

**Interações — Grupo A (mantido); Grupo B removido:**
- star/watch/follow escrevem no GitHub; exigem conta vinculada + escopo (`public_repo`, `user:follow`); token por requisição via `ExternalIdentity` decrypt (padrão `GetCurrentUser`); endpoints em `Transport/Requests/Interactions/` na integration; `Actions` wrappers finas
- **Sem estado local**: bookmark/avaliação/feedback removidos (Grupo B do ADR 0004)

**UI** (aprovada em protótipo — variante C + aside + Focus Reader, emendada):
- **Listagem** (panel-app): página Livewire/Filament real, busca server-side, filtros na URL, grid de cards com badges de interação. **Sem `.poc-stats`, sem progresso pessoal**
- **Detalhe**: aside sobreposto via render hook `LAYOUT_END`; header com stats repo, criador, badges, árvore módulos/aulas (**sem check de conclusão**), contribuidores
- **Reader**: Focus Reader servindo `processed_content`; sidebar colapsável com h2; code blocks com copy; breadcrumb; prev/next. **Sem marcar concluída; sem feedback**
- **Ações GitHub**: header do aside — Star(icon+count)/Watch/Sponsor(external)/Share(web share fallback); follow por contribuidor; **Sponsor só exibido se `GET /users/{login}/sponsorship` confirmar sponsor ativo (stateless, verificado por request)**; matriz de estados aplicada; contagem verificada contra API

**Agendamento** (fase 1):
- Intervalo configurável via `config('tracks.sync.interval_minutes')`, default **1 semana**
- Cache lock anti-sobreposição; `php artisan tracks:sync` sempre tem precedência
- **Sync manual no painel**: ação "Sincronizar agora" no `GithubRepositoryResource` dispara `tracks:sync` para o track — execução manual sempre tem precedência sobre a agendada
- Webhook de push do GitHub fora do escopo — registrado como próximo passo natural

## Decisões de teste

Três costuras de teste confirmadas em escopo:

1. **Idempotência do ETL**: rodar sync duas vezes sem mudança na fonte resulta em zero alterações; rename preserva a árvore via `replaced_by_uuid`; determinismo de UUIDs provado contra fixtures
2. **Matrix de interações (Grupo A)**: checks booleanos 204/404 traduzidos corretamente; token expirado sinaliza erro tratável; contagem verificada contra API
3. **Lifecycle de órfãos + autoria**: endpoint de contribuidores mockado → linhas corretas em `track_contributors`; adoção retroativa idempotente; contribuidor sem conta é estado válido; reconexão não duplica vínculo nem re-emite fato

Prior art: action/feature tests em `identity` e `moderation`; `BackfillRepositoryTest` (integration-github); Filament resource tests com `livewire()`.

## Fora do escopo

- Módulo `gamification` e a mecânica de XP — tracks emite fatos, gamificação decide (D7)
- **Estado pessoal do aluno** — progresso, bookmark, avaliação, feedback por aula (escopo LMS removido no 0005)
- Provider `native` — trilhas da plataforma (não são de ninguém, análogo ao RSS no contents)
- Provider RSS/Dev.to — pertence ao módulo `contents`; tracks só lida com repos 4noobs
- Comentários/forks/Discussions nas trilhas — discussão via GitHub Issues/PRs, não na plataforma
- App mobile — `panel-app` web only neste delivery
- Webhook de push do GitHub para sync reativo — fase 2
- Videos em trilhas — possível extensão futura via capability nova no provider
- Capability `ProvidesWorkingCopy` como interface no repositório principal — ponto aberto, mas não bloqueia implementation

## Notas adicionais

- **Alinhamento ao contents**: quatro regras adotadas do contents (contratos invertidos, orfãos, XP fora, sem flag vazio); quatro mantidas diferentes por natureza do tracks (arvore hierárquica, ETL git incremental, source_type + colunas planas ao invés de delegated types — flatten do JSONB, E-D11 —, publish/unpublish no track)
- **Fronteira de módulo explícita (Model 2)**: transporte devolve DTOs; domínio persiste. Documentada no ADR 0005 (E-E)
- **`purpose=Tracks`**: novo caso do `PurposeType` no allowlist, padrão ADR-0002 do onboarding; `enabled` ≠ `published`
- **Autoria a validar**: `selectedMetric=additions` pode sub-ponderar quem contribui sem código; validar contra repos reais
- **Caveats de backfill para muitos repos**: documentados no ADR 0005 (E-D4)
- **Nota de revisão**: ponto aberto equivalente ao `ProvidesWorkingCopy` é o `FetchesContributors` + `selectedMetric` — discutir antes de abrir o PR
- **Commit do contents como lição**: constraint `^1.0.0` e label `mod:tracks` no primeiro commit

## Subtarefas (tracer bullets — ordem de dependência)

- [ ] # — scaffold do módulo tracks (`01-scaffold-modulo-tracks`)
- [ ] # — evento `ExternalIdentityConnected` no identity (`02-identity-evento-conexao`)
- [ ] # — contratos de fonte `TrackSourceProvider` + registry (`03-provider-contract-e-registry`)
- [ ] # — `GithubTrackProvider` descoberta + metadados + contribuidores (`04-github-provider-descoberta-metadados`)
- [ ] # — `SyncTracks` ETL completo + intake via allowlist (purpose=Tracks) (`05-sync-tracks-etl`)
- [ ] # — contribuidores + ciclo de órfãos com adoção retroativa (`06-contribuidores-adocao-orfaos`)
- [ ] # — publish/unpublish + curation no painel (`07-panel-app-listagem-trilhas` + `07b-admin-allowlist-curation`)
- [ ] # — listagem real substituindo protótipo mockado (`07-panel-app-listagem-trilhas`)
- [ ] # — `TrackAside` + leitor (`08-panel-app-detalhe-leitor`)
- [ ] # — endpoints de interação GitHub (`09-github-interaction-endpoints`)
- [ ] # — ações GitHub na UI do aside (`10-panel-app-acoes-github-ui`)
- [ ] # — agendamento + descoberta automática (propõe) (`11-agendamento-descoberta-automatica`)