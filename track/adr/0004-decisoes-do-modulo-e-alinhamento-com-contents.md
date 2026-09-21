---
type: ADR
title: "ADR 0004 — Decisões do módulo tracks e alinhamento com o contents"
description: "Registro consolidado das decisões D1–D9 do desenho do tracks, com alternativas recusadas e alinhamento às regras do módulo contents."
tags: [tracks, adr, arquitetura, contents]
status: proposed
generated:
  by: human:GabrielFVDev
  at: 2026-08-24T00:00:00Z
---
# ADR 0004 — Registro consolidado das decisões do módulo `tracks` e alinhamento com o `contents`

[← README do módulo](../index.md)

- **Status:** Proposto
- **Data:** 2026-08-24
- **Relaciona:** [0001](0001-content-identity-via-stable-uuid.md), [0002](0002-etl-normalization-strategy.md), [0003](0003-modelo-de-dados.md); spec do módulo `contents` (`contents/docs/specs/2026-08-19-modulo-contents-artigos.md`, branch 4.x)
- **Procedência:** decisões produzidas pelo processo da skill /wayfinder — tickets 01–06 (2 pesquisas, 3 rodadas de decisão, 1 protótipo), todos resolvidos — revisadas contra as regras da casa consolidadas pelo `contents`

## Contexto

O desenho do `tracks` nasceu de um ciclo estruturado de decisão: pesquisa empírica sobre 9 repositórios `{topic}4noobs` (css, php, cpp, rust, python, typescript, swift, git, qa — owners individuais), auditoria do que a `integration-github` já oferece (10 requests, todos GET; nenhuma interação de escrita), três rodadas de decisão (modelo de dados, ETL, interações) e um protótipo aprovado entre seis variantes.

Esse desenho antecedeu a consolidação do módulo `contents` no upstream, que fixou as regras da casa para conteúdo de fontes externas. Este documento consolida **todas** as decisões num lugar só — para proposta upstream e para onboard de contribuidores — marcando onde o alinhamento ao `contents` alterou o desenho original e onde o tracks deliberadamente difere. Os ADRs 0001–0003 permanecem válidos como registros focados; este os referencia e registra suas emendas.

---

## D1 — Identidade do conteúdo: UUIDv5 determinístico *(ADR 0001)*

**Decisão:** trilha, módulo e aula recebem UUID imutável na primeira sincronização, gerado deterministicamente (RFC 4122 v5) a partir do namespace UUID da trilha + source path. Progresso, feedback e interações vinculam ao UUID — nunca ao caminho nem ao hash. Rename de path → registro antigo soft-deleted com ponteiro `replaced_by_uuid` (refinamento da ADR 0003).

**Recusado:** identidade por path (rename apaga histórico do usuário — renomear é evento normal na vida de um repo 4noobs); por hash de conteúdo (qualquer edição de texto quebraria referências).

## D2 — Fonte única com discriminador: `source_type` + `source_data` JSONB *(ADR 0003, nuance pós-contents)*

**Decisão:** tabela `tracks` com enum `source_type` (`github` | `native`) e JSONB nullable `source_data` (repo_owner, repo_name, default_branch, language, stars). Metadados consultáveis cruzando a hierarquia ficam colunas; o que é específico de fonte fica no JSONB.

> **Emendado pelo ADR 0005, E-D11:** no reescopo do agregador o `source_data` JSONB foi **removido** — todos os metadados de fonte foram promovidos a colunas planas consultáveis (repo_owner, repo_name, repo_url, default_branch, language, category, stars, forks, watchers), como registrado no `schema.md`. O racional de "específico de fonte vs colunas" permanece histórico; hoje não há payload de fonte que não seja coluna.

**Recusado:**
- *Tabelas polimórficas por fonte* (`track_github_sources`, `track_native_sources`) — JOIN opcional em toda query, migration nova a cada fonte.
- *Delegated types como o `contents`* — o que motiva morphs lá é divergência de colunas **entre tipos planos** (artigo vs vídeo). Aqui todos os agregados têm forma uniforme **por nível da hierarquia**; a variação é por fonte, não por tipo — cabe em JSONB. Divergência de forma ≠ divergência de tipo.
- *Criador desnormalizado em `tracks`* (`creator_name`, `creator_avatar_url`) — drift entre cópia e verdade; autoria tem entidade própria (D5).

## D3 — Hierarquia, ordenação e conteúdo processado *(tickets 01–02)*

**Decisão:** módulos = diretórios de primeiro nível; aulas = arquivos markdown. Ordenação heurística em cascata: seções numeradas extraídas do ROADMAP do README → ordem alfabética de diretórios → ordem da git tree. Corpo pós-ETL em `lessons.processed_content` (HTML), com `word_count` e `estimated_minutes ≈ ceil(word_count/200)` calculados na sincronização.

**Recusado:** ordenação puramente alfabética (quebra trilhas numeradas — o padrão dominante nos 9 repos analisados); guardar só o markdown bruto (empurra parse pra leitura, impede busca server-side consistente).

## D4 — ETL misto em comando único *(ticket 04, ADR 0002)*

**Decisão:** `tracks:sync` faz sync + normalize num passe: metadados via API, conteúdo bulk via shallow clone (pull incremental nas passadas seguintes; flag de refresh completo). Regras de normalização: extensões normalizadas (`.MD` → `.md`), branch resolvida dinamicamente (`default_branch`), imagens relativas reescritas para `raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`, override map configurável por repo. Descoberta de novas fontes pela observação de commits no README central (`he4rt/4noobs`) — fase 1 manual + polling; fase 2 agendada + webhook.

**Recusado:** detecção de engine (VuePress, mdbook) — frágil e desnecessária; o par flat+override cobre as variações catalogadas na pesquisa (estruturas `docs/`, `src/`, `Content/`; branches `master`/`main`) sem parser por engine; refazer clone do zero a cada passada — custo injustificado quando `git pull` basta.

## D5 — Autoria multi-pessoas com ciclo de órfãos *(tickets 01+05; adoção nova pós-contents)*

**Decisão:** autoria é entidade (`track_contributors`): exatamente um `is_owner` por trilha, `contribution_role` enum, resolução por cadeia de prioridade `.all-contributorsrc` → `.github/config.json` → seção de autores do README → avatares inline (gold standard empiricamente confirmado na pesquisa). Pós-alinhamento: `github_username` gravado SEMPRE; `user_id` nasce nulo — órfão é estado normal, não erro. Listener de `ExternalIdentityConnected` (evento novo no identity, compartilhado com o plano do contents) adota retroativamente e emite o fato `TrackMaintainersLinked` para downstream creditar histórico.

**Recusado:** descartar contribuidor sem conta vinculada (perde a memória de quem criou — exatamente o buraco que o dev.to cavou no `contents`); resolver autoria só no momento do sync sem fluxo de adoção (conectar conta não valeria nada para quem criou há meses).

## D6 — Interações GitHub em dois grupos de modelagem *(ticket 05)*

**Decisão:** separação conceitual rígida:
- **Grupo A — `TrackCapabilities`:** ações ligadas À FONTE — star, watch, follow (escritas reais via API) + share e sponsor (links externos). Extensível por tipo de fonte; trilha que migre de `github` para nativa perde essas features de UI graciosamente.
- **Grupo B — `UserTrackState`:** estado pessoal LOCAL — bookmarked, feedback por aula, progresso, rating. Nunca escreve no GitHub; nunca exige conta vinculada.

Transporte: 9 endpoints REST novos (PUT/DELETE/GET de `/user/starred/{owner}/{repo}`, `/repos/{owner}/{repo}/subscription`, `/user/following/{username}`), token per-request recuperado de `ExternalIdentity` (padrão `GetCurrentUser`). Scopes OAuth atuais insuficientes — acrescentar `public_repo` e `user:follow`. Matriz de estados desabilitados: conta não vinculada → botão off + tooltip "Conecte sua conta GitHub para interagir"; repo deletado/transferido → off + tooltip informativa; token expirado → pré-validação via GET check. Posicionamento: Star/Watch/Sponsor/Share compactos no header do detalhe; Follow por contribuidor após o conteúdo, verificando estado real antes de marcar ativo.

**Recusado:** Fork via plataforma (sem benefício direto ao criador); área de comentários/issues via plataforma (polui repos de terceiros — feedback fica no UserTrackState).

## D7 — Emenda: recompensa fora do domínio de conteúdo *(altera ADR 0003; supera aceite do protótipo)*

**Decisão:** `lessons.xp_reward` — presente como campo nullable na ADR 0003 e aceito como mock visual na variante C do protótipo — **é removido**. Conteúdo não carrega vocabulário de recompensa: tracks emite fatos (`LessonCompleted`, `TrackCompleted`, `TrackMaintainersLinked`) e gamification/activity decidem prêmios — mesmo arranjo vivo entre activity → gamification via `IncrementExperience`. Quando trilhas gamificadas virarem feature real, gamification cria seu próprio mapeamento (tabela/config por lesson UUID) — a identidade estável de D1 torna esse join trivial depois.

**Motivação:** campo de XP numa lesson acopla catálogo ao futuro do gamification; algum código eventualmente leria aquilo para conceder coisa. A exibição de XP/streak no protótipo passa a ser apresentação pura até a gamificação existir.

## D8 — Interface: protótipos escolhidos *(ticket 06)*

**Decisão:** listagem = variante C — tema dark GitHub (`#0D1117`/`#161B22`), fonte Inter, hero com busca, barra de estatísticas pessoais, dropdown de ordenação, filtros (categoria/nível/duração/status), banner de destaque, grid de cards com barra de progresso e badges starred/saved. Detalhe = aside `TrackAside` (Livewire registrado como `tracks-aside`, render hook `LAYOUT_END` escopado às páginas de lista e leitor), aberto pelos eventos `tracks-aside.sync`/`tracks-aside.open`. Leitor = variante A "Focus Reader": sidebar fina colapsável com índice de h2, breadcrumb, blocos tipados (code com copy, callout, table), navegação prev/next.

**Notas:** protótipos são throwaway com dados em memória — substituídos pelas páginas reais; componentes (TrackCard, CreatorBadge etc.) existem inline nos blades, formalização vem com a implementação.

## D9 — Posicionamento frente ao `contents`: contexto irmão que adota suas regras

**Decisão:** `tracks` é bounded context irmão — nenhum depende do outro; ambos dependem de identity; compartilham o gatilho `ExternalIdentityConnected`. Fronteira no CONTEXT-MAP: `contents` = peças publicadas planas; `tracks` = estruturas hierárquicas de aprendizado + estado pessoal. Adota as quatro regras da casa:

1. **Inversão de contrato** — contratos pertencem ao tracks (`TrackSourceProvider` + capabilities `DiscoversTrackSources`, `FetchesRepositoryMetadata`, `ProvidesWorkingCopy`); `integration-github` implementa e registra-se. Domínio nunca fala HTTP nem chama git direto. Se acomodar um provider exigir tocar o comando, o contrato está errado.
2. **Ciclo de órfãos** — ver D5.
3. **Recompensa via evento** — ver D7.
4. **Capacidades por interface** — disponibilidade expressa em interfaces checadas com `instanceof`, nunca flags de config nem métodos vazios.

**Mantido diferente de propósito:** UUIDv5/replaced_by_uuid (artigo tem chave natural estável; path de git muta — D1), ETL git incremental (corpo é árvore de markdown, não payload JSON — D4), `source_type`+JSONB sem morphs (forma uniforme por nível — D2).

**Recusado:**
- *Track como subtipo dentro do `contents`* (`contentable = content_tracks`) — o pattern de subtipos lá exige forma idêntica entre tipos (linha plana, um autor, mesmas colunas de raiz); trilha é árvore com estado pessoal e quase nada sobe pra raiz do morph; charter "catálogo, não scoreboard" não acomodaria `UserTrackState`; trilha nativa contradiz "publicado externamente"; resultaria em módulo-dentro-do-módulo com dois ciclos de vida e dois seams de teste num pacote.
- *`contents` como registro de fontes consumido pelo tracks* — dobraria o papel dele (catálogo de peças ≠ registro de fontes) e acoplaria ritmos de módulos independentes.
- *Manter a spec v1 intacta* — nasceria violando direção de dependência, carregando vocabulário de recompensa e sem fluxo para criador não vinculado: o segundo catálogo paralelo que o CONTEXT-MAP não justificaria.

---

## Escopo explicitamente excluído (com motivo)

| Exclusão | Motivo |
|---|---|
| Engine de gamificação (XP/badges/streaks/ranking) | Esforço próprio e futuro; eventos de D7 preparam sem implementar |
| CRUD de trilhas nativas | Modelo prepara (`native`), fluxo de criação/curadoria/aprovação é posterior |
| Painel admin de trilhas | Sem operador definido para a fase 1 |
| Fork via plataforma | Recusado em D6 |
| Comentários/issues via plataforma | Recusado em D6 |
| Integração timeline/perfil | Sem requisito hoje; esforço posterior |

## Consequências

- **Positivas:** setinha de dependência correta no CONTEXT-MAP; domínio testável sem Saloon (mock dos contratos); crédito retroativo a criadores; fonte nova entra sem tocar o domínio; SOLID completo (ISP e DIP passam a valer); uma única página de onboarding arquitetural (esta).
- **Custos:** mais arquivos de contrato/registry; disciplina de contrato contínua; coordenação upstream para `ExternalIdentityConnected`; protótipo prometia XP visível que agora depende de módulo externo.
- **Emendas registradas:** ADR 0003 perde `xp_reward` (D7) e ganha a nuance JSONB-vs-morphs (D2); ADRs 0001–0002 permanecem inteiros.
