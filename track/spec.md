---
type: spec
title: 'Módulo tracks — trilhas de aprendizado da comunidade, alinhado às regras de conteúdo'
module: tracks
status: draft
date: 2026-08-24
author: GabrielFVDev
supersedes: ../spec.md
labels: ready-for-agent, type:feat, mod:tracks (a criar)
---

# Spec: Módulo `tracks` — v2 (Opção B: contexto irmão alinhado ao `contents`)

[← README do módulo](README.md)

## Problem Statement

A comunidade He4rt produz conteúdo educacional open-source em repositórios `4noobs` hospedados no GitHub (`{topic}4noobs`, mantidos por membros individuais). Hoje esse conteúdo é fragmentado: cada repositório tem sua própria estrutura, metadados e convenções, e não há uma experiência unificada de navegação, leitura ou valorização dos criadores na plataforma.

Quem consome não consegue descobrir nem acompanhar trilhas; quem cria não recebe reconhecimento além do próprio GitHub. E quando o mantenedor finalmente conecta a conta dele na plataforma, nada do histórico é creditado a ele.

Além disso, o acervo canônico de conteúdo externo da casa agora é o módulo `contents` — e qualquer novo domínio de conteúdo que ignore suas regras (direção de dependência, ciclo de órfãos, separação de recompensa) nasce divergente do padrão estabelecido.

## Solution

Criar o módulo `tracks` como **bounded context irmão do `contents`**, com fronteira explícita no CONTEXT-MAP:

- `contents` = catálogo canônico de **peças publicadas planas** (artigo, vídeo) — 1 linha autocontida por peça.
- `tracks` = dono das **estruturas hierárquicas de aprendizado** (trilha → módulo → aula), qualquer que seja a fonte (`github` hoje, `native` no futuro), com estado pessoal do aluno.

O tracks adota as quatro regras arquiteturais consolidadas pelo `contents`:

1. **Inversão de contrato**: tracks define os contratos de fonte; `integration-github` implementa e se registra. O domínio nunca fala HTTP nem chama git direto.
2. **Ciclo de órfãos**: contribuidores nascem sempre com `github_username`; `user_id` fica nulo até a conta ser vinculada, quando um evento de conexão dispara a adoção retroativa.
3. **Recompensa via evento**: tracks emite fatos (`TrackMaintainersLinked`, `LessonCompleted`); gamificação/activity decidem XP. Nenhuma coluna de recompensa no domínio de conteúdo.
4. **Capacidades por interface**: o que uma fonte sabe fazer se expressa pelas interfaces que implementa, checadas com `instanceof` — nunca por flags de config ou métodos vazios.

O produto entrega: listagem navegável de trilhas com progresso, leitor de aulas focado, interações GitHub reais (star/watch/follow/sponsor/share) com estados desabilitados orientando login, e sincronização incremental via comando Artisan.

## User Stories

### Descoberta e leitura

1. As a platform user, I want to browse all 4noobs tracks on a single page, so that I can discover community content without visiting GitHub.
2. As a platform user, I want to see track cards with title, creator, language, level, duration and module count, so that I can quickly scan and choose what to study.
3. As a platform user, I want to search tracks by name, technology or author, so that I can find specific content.
4. As a platform user, I want to filter tracks by category, level, duration and status, so that I can narrow down to what fits my goal.
5. As a platform user, I want to see my progress on each track (não iniciada / em andamento / concluída), so that I can track my learning.
6. As a platform user, I want to open a track detail with repo metadata (stars, forks, watchers), creator, description and module tree, so that I can decide whether to start it.
7. As a platform user, I want per-module and per-lesson progress indicators, so that I know exactly where I stopped.
8. As a platform user, I want to read a lesson in a focused reader (breadcrumb, índice de seções, code blocks com copy, callouts, tables), so that consuming content is pleasant.
9. As a platform user, I want prev/next navigation between lessons, so that I follow the trilha linearly.
10. As a platform user, I want to mark lessons as completed, so that progress persists across sessions and devices.
11. As a content consumer, I want repos with atypical structures handled via configurable overrides, so that every track is readable regardless of repo organization.

### Valorização dos criadores

12. As a platform user, I want to star a track's repository from the platform, so that I support the creator directly.
13. As a platform user, I want to watch a track's repository from the platform, so that I get updated on new content and support the creator.
14. As a platform user, I want to follow a track contributor on GitHub from the platform, so that I can follow the people behind the content.
15. As a platform user without a linked GitHub account, I want star/watch/follow buttons disabled with a tooltip guiding me to connect, so that I understand why I cannot interact.
16. As a platform user, I want to share a track's external link, so that I promote the creator's work.
17. As a platform user, I want a Sponsor link per creator, so that I can financially support them if I choose.
18. As a maintainer who created a track before joining the platform, I want my authorship attributed retroactively when I connect my GitHub account, so that all my past work becomes mine on the platform.
19. As a platform user, I want to see which tracks I starred or saved, so that I can return to them later.

### Estado pessoal

20. As a platform user, I want to bookmark a track locally, so that I can come back to it without acting on GitHub.
21. As a platform user, I want to give quick feedback on a lesson (útil/desatualizada), so that content quality improves while GitHub issues stay clean.
22. As a platform user, I want interaction state verified against GitHub before showing active state, so that the UI reflects reality even after token expiry or repo deletion.

### Operação

23. As an operator, I want a sync command that pulls metadata and normalizes content in one pass, so that tracks reflect community repos without manual work.
24. As an operator, I want incremental sync (pull no clone existente), so that re-syncs are fast.
25. As an operator, I want automatic discovery of new `{topic}4noobs` repos by observing commits no README do `he4rt/4noobs`, so that new content appears without registration.
26. As a future admin, I want the model to support native tracks (sem fonte externa), so that the platform can grow its own content later.

## Implementation Decisions

### Módulos construídos/modificados e direção das dependências

- **`app-modules/tracks`** (novo): domínio — contratos de fonte, modelos, ETL, contribuidores/adoção, estado do usuário, comandos.
- **`integration-github`** (modificado): implementa os contratos de fonte do tracks (`GithubTrackProvider`) e ganha endpoints de interação (star/watch/follow).
- **`identity`** (modificado): passa a emitir `ExternalIdentityConnected` nos dois caminhos que criam conexão (OAuth e API key). Evento genérico de propósito — `contents` e outros vão consumir o mesmo gatilho.
- **`panel-app`** (modificado): páginas de listagem, detalhe (TrackAside) e leitor substituindo os protótipos mockados.
- Direção obrigatória (regra do CONTEXT-MAP): `integration-github → tracks → identity`. Tracks nunca importa integration; presentation depende de tracks, nunca o reverso. `activity`/`gamification` podem escutar eventos do tracks; tracks nunca os importa.

### Contratos de fonte (propriedade do tracks)

```php
interface TrackSourceProvider {
    public function source(): TrackSourceType;   // github hoje; native não tem provider
}
interface DiscoversTrackSources extends TrackSourceProvider {
    /** @return iterable<TrackSourceDTO> */      // ex.: he4rt/php4noobs + owner + url
    public function discoverSources(): iterable;
}
interface FetchesRepositoryMetadata extends TrackSourceProvider {
    public function fetchMetadata(TrackSourceDTO $s): RepoMetadataDTO;
}
interface ProvidesWorkingCopy extends TrackSourceProvider {
    public function workingCopy(TrackSourceDTO $s): string;  // shallow clone/pull → path local
}
```

Registry singleton resolvido pelo ServiceProvider do tracks; `GithubTrackProvider` registra-se no `boot()` da integration. O comando itera o registry e nunca cita "github". Se acomodar um provider exigir tocar o comando, o contrato está errado.

### Modelo de dados

- **`tracks`**: `source_type` enum (`github` | `native`) + `source_data` JSONB (repo_owner, repo_name, default_branch, language). Mantém-se enum+JSONB — e não delegated types como o contents — porque o agregado é uniforme por nível da hierarquia; a divergência de forma que motiva morphs lá não existe aqui. Registrado como decisão consciente no ADR 0004.
- **`modules`** e **`lessons`**: identidade determinística **UUIDv5** (namespace da trilha + source path). Rename → soft-delete + `replaced_by_uuid`; interações e progresso vinculam ao UUID imutável, nunca ao path.
- **`lessons.processed_content`** (HTML pós-ETL), `word_count`, `estimated_minutes` ≈ `ceil(word_count/200)`. **Sem coluna de XP** — recompensa é vocabulário do gamification.
- **`track_contributors`**: autoria como entidade própria — `github_username` SEMPRE gravado (memória e chave de adoção), `user_id` nullable (órfão é estado normal), `is_owner` (exatamente um por trilha), `contribution_role` enum. Resolução de autoria: `.all-contributorsrc` → `.github/config.json` → seção de autores do README → avatares inline.
- **`UserTrackState`**: estado pessoal local (bookmarked, feedback, rating, progresso por lesson UUID). Nunca escreve no GitHub.
- **`TrackCapabilities`**: ações disponíveis por tipo de fonte (github → star/watch/follow/share/sponsors). Extensível para nativas sem tocar consumidores.
- Ordenação de módulos/aulas: heurística README (seções numeradas primeiro) → alfabética → git tree order; override configurável por repo para estruturas atípicas.

### ETL e sincronização

- Comando **`tracks:sync`**: sync + normalize num passe. Metadados via API (capability `FetchesRepositoryMetadata`), conteúdo via working copy (shallow clone; incremental com pull existente; flag `--force`).
- Branch resolvida dinamicamente (`default_branch`); extensões normalizadas (`.MD` → `.md`); links relativos de imagem reescritos para `raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`.
- Idempotência: upsert por UUID determinístico; segunda passada sem mudanças = zero alterações estruturais.
- Descoberta de novas fontes: observação de commits no README de `he4rt/4noobs` (polling na fase 1, webhook futuro).

### Ciclo de órfãos e adoção

- Listener do tracks em `ExternalIdentityConnected`: adota todos os `track_contributors` com aquele `github_username` e `user_id` nulo → emite `TrackMaintainersLinked` (fato para downstream creditar retroativamente).
- Simetria com o padrão vivo `AccountsMerged` → reatribuição no activity.

### Interações GitHub

- Endpoints novos na integration: PUT/DELETE/GET `/user/starred/{owner}/{repo}`, `/repos/{owner}/{repo}/subscription`, `/user/following/{username}` — padrão de token per-request já usado pela house.
- Scopes OAuth a acrescentar: `public_repo` (star) e `user:follow` (follow); atuais são insuficientes.
- Estados desabilitados: conta não vinculada → botão desabilitado + tooltip "Conecte sua conta GitHub para interagir"; repo deletado/owner trocado → desabilitado + tooltip informativo; token expirado → pré-validação via GET check.
- Posicionamento (do protótipo escolhido): Star+contagem, Watch+contagem, Sponsor e Share compactos no header do detalhe; Follow por contribuidor após o conteúdo, com verificação prévia do estado real.

### UX/UI (protótipos já aprovados)

- Listagem = variante C: tema dark GitHub (`#0D1117`/`#161B22`), hero + busca, stats bar, order dropdown, filtros (categoria/nível/duração/status), banner destaque, grid de cards com barra de progresso e badges starred/saved.
- Detalhe = `TrackAside` (Livewire via render hook `LAYOUT_END`), aberto pelos eventos `tracks-aside.sync`/`tracks-aside.open`.
- Leitor = variante A "Focus Reader": sidebar fina colapsável com índice h2, breadcrumb, blocos tipados (code com copy, callout, table), prev/next.
- Fonte Inter. Protótipos: `TracksPrototypePage`, `LessonReaderPrototypePage`, `TrackAside` (dados mockados em memória a substituir).

## Testing Decisions

- Bom teste testa comportamento externo, não detalhes: GitHub mockado → linhas corretas no banco; ação do usuário → estado persistido/chamada correta.
- **Seam 1 — domínio (`tracks/tests`)**: ETL e ações de adoção com Saloon `MockClient` + fixtures de working copy (dir temporário com árvore de arquivos simulada). Prior art: `BackfillRepositoryTest` na integration-github.
- **Seam 2 — apresentação (`panel-app/tests`)**: Livewire/Filament para renderização e wiring dos eventos `tracks-page.*`/`tracks-aside.*`. Prior art: `ProfilePageTest`.
- **Seam 3 — transporte (`integration-github/tests`)**: novos endpoints de interação com o mesmo padrão MockClient existente.
- Contratos de fonte têm teste de conformidade: qualquer provider registrado satisfaz as capabilities que declara.

## Out of Scope

- Engine de gamificação (XP/badges/streaks) — events emitidos preparam, implementação é esforço próprio.
- CRUD de trilhas nativas — modelo prepara (`source_type=native`), fluxo vem depois.
- Painel admin de trilhas.
- Fork via plataforma (descartado) e área de comentários/issues via plataforma (descartada — polui repos).
- Integração com timeline/perfil — esforço posterior; sem requisito hoje.
- **Ser subtipo dentro do `contents`** — avaliado e recusado; rationale completo no ADR 0004.

## Further Notes

- Relação com `contents` é de **contextos irmãos**: nenhum depende do outro; ambos dependem de identity; compartilham o gatilho `ExternalIdentityConnected`.
- Ao propor upstream: criar label `mod:tracks`, constraint de composer no estilo `^1.0.0` (lição do commit do contents), e coordenar o ticket de `ExternalIdentityConnected` com o plano equivalente da spec do contents — é trabalho compartilhado.
- ADRs vigentes do módulo: 0001 (identidade estável), 0002 (estratégia de ETL), 0003 (modelo de dados) + novo 0004 (registro consolidado D1–D9, com emendas aos anteriores e o alinhamento ao contents).
