---
type: spec
title: 'Módulo tracks — agregador de trilhas de aprendizado da comunidade, alinhado às regras de conteúdo'
module: tracks
status: draft
date: 2026-09-09
author: GabrielFVDev
supersedes: ../spec.md
labels: ready-for-agent, type:feat, mod:tracks (a criar)
description: "Spec v3 do agregador do acervo 4noobs: problema, solução, 22 user stories e decisões de implementação/teste."
tags: [tracks, spec, agregador, upstream]
---

# Spec: Módulo `tracks` — v3 (agregador)

[← Índice do módulo](index.md)

> **Escopo reduzido pós-review.** A v2 (LMS) foi enviada para review upstream; o retorno reduziu o escopo para um **agregador**: catálogo + leitura + valorização de criadores, sem rastreamento pessoal. Esta spec registra o escopo v3. Ver ADR [0005](adr/0005-reescopo-para-agregador.md) para as emendas a 0004.

## Problema

A comunidade He4rt produz conteúdo educacional open-source em repositórios `4noobs` hospedados no GitHub (`{topic}4noobs`, mantidos por membros individuais). Hoje esse conteúdo é fragmentado: cada repositório tem estrutura, metadados e convenções próprias. A plataforma não oferece uma experiência unificada de navegação, leitura ou valorização dos criadores.

Quem consome não consegue descobrir nem acompanhar trilhas; quem cria não recebe reconhecimento além do próprio GitHub. E quando o mantenedor finalmente conecta a conta dele na plataforma, nada do histórico é creditado a ele.

O acervo canônico de conteúdo externo da casa agora é o módulo `contents`. Qualquer novo domínio de conteúdo que ignore suas regras (direção de dependência, ciclo de órfãos, separação de recompensa) nasce divergente do padrão estabelecido.

## Solução

Criar o módulo `tracks` como **bounded context irmão do `contents`**, com fronteira explícita no CONTEXT-MAP:

- `contents` = catálogo canônico de **peças publicadas planas** (artigo, vídeo) — 1 linha autocontida por peça.
- `tracks` = **agregador das estruturas hierárquicas de aprendizado** (trilha → módulo → aula), qualquer que seja a fonte (`github` hoje, `native` no futuro), com leitura focado num leitor e apoio direto ao criador via GitHub.

**O agregador não é um LMS:** não rastreia progresso pessoal, nem bookmark, nem avaliação, nem feedback por aula. A plataforma indexa, apresenta e valoriza — quem estuda volta ao repo e à trilha no GitHub para agir.

O tracks adota as quatro regras arquiteturais consolidadas pelo `contents`:

1. **Inversão de contrato**: tracks define os contratos de fonte; `integration-github` implementa e se registra. O domínio nunca fala HTTP nem chama git direto.
2. **Ciclo de órfãos**: contribuidores nascem sempre com `github_username`; `user_id` fica nulo até a conta ser vinculada, quando um evento de conexão dispara a adoção retroativa.
3. **Recompensa via evento**: tracks emite fatos (`TrackMaintainersLinked`); gamificação/activity decidem XP. Nenhuma coluna de recompensa no domínio de conteúdo.
4. **Capacidades por interface**: o que uma fonte sabe fazer se expressa pelas interfaces que implementa, checadas com `instanceof` — nunca por flags de config ou métodos vazios.

**Fronteira de módulo (Model 2):** `integration-github` é transporte e devolve DTOs (working copy, metadados, contribuidores) reusando `GitHubApiConnector` e o padrão de backfill (idempotente, resumível, rate-limit-aware); `tracks` é o domínio que decide o que é verdade e **persiste** nos seus models.

O produto entrega: agregador navegável de trilhas, leitor de aulas focado, interações GitHub reais (star/watch/follow) com estados desabilitados orientando login, e sincronização via allowlist com curadoria e descoberta automática.

## Histórias de usuário

### Descoberta e leitura

1. Como usuário da plataforma, quero navegar por todas as trilhas 4noobs numa única página, para que eu descubra conteúdo da comunidade sem visitar o GitHub.
2. Como usuário da plataforma, quero ver cards de trilha com título, criador, linguagem, quantidade de módulos e estado de interação, para que eu escaneie rápido e escolha o que estudar.
3. Como usuário da plataforma, quero buscar trilhas por nome, tecnologia ou autor, para que eu encontre conteúdo específico.
4. Como usuário da plataforma, quero filtrar trilhas por categoria e status, para que eu reduza o leque ao que serve ao meu objetivo.
5. Como usuário da plataforma, quero abrir o detalhe de uma trilha com metadados do repo (stars, forks, watchers), criador, descrição e árvore de módulos, para que eu decida se devo começar.
6. Como usuário da plataforma, quero ver a árvore módulo/aula com listagem por módulo e por aula, para que eu saiba o que uma trilha contém.
7. Como usuário da plataforma, quero ler uma aula num leitor focado (breadcrumb, índice de seções, blocos de código com copy, callouts, tabelas), para que consumir o conteúdo seja agradável.
8. Como usuário da plataforma, quero navegação prev/next entre as aulas, para que eu percorra a trilha de forma linear.
9. Como consumidor de conteúdo, quero que repos com estruturas atípicas sejam tratados via overrides configuráveis, para que toda trilha seja legível independentemente da organização do repo.

### Valorização dos criadores

10. Como usuário da plataforma, quero dar star no repositório de uma trilha a partir da plataforma, para que eu apoie o criador diretamente.
11. Como usuário da plataforma, quero dar watch no repositório de uma trilha a partir da plataforma, para que eu seja atualizado sobre conteúdo novo e apoie o criador.
12. Como usuário da plataforma, quero seguir um contribuidor de trilha no GitHub a partir da plataforma, para que eu acompanhe as pessoas por trás do conteúdo.
13. Como usuário da plataforma sem conta GitHub vinculada, quero os botões de star/watch/follow desabilitados com tooltip que me oriente a conectar, para que eu entenda por que não posso interagir.
14. Como usuário da plataforma, quero compartilhar o link externo de uma trilha, para que eu promova o trabalho do criador.
15. Como usuário da plataforma, quero um link Sponsor por criador, para que eu possa apoiá-lo financeiramente se quiser.
16. Como mantenedor que criou uma trilha antes de entrar na plataforma, quero ter minha autoria atribuída retroativamente quando eu conectar minha conta GitHub, para que todo o meu trabalho passado seja meu na plataforma.

### Operação

17. Como operador, quero adicionar um repo 4noobs à allowlist de agregação pelo painel de admin, para que ele se torne uma trilha.
18. Como operador, quero publicar/despublicar uma trilha, para que eu controle o que está visível sem parar a ingestão.
19. Como operador, quero um comando de sync que busque metadados e normalize o conteúdo num único passe, para que as trilhas reflitam os repos da comunidade sem trabalho manual.
20. Como operador, quero sync incremental (pull no clone existente), para que re-syncs sejam rápidos.
21. Como operador, quero descoberta automática de novos repos `{topic}4noobs` observando os commits no README do `he4rt/4noobs` (propondo, não publicando), para que conteúdo novo apareça sem cadastro.
22. Como operador, quero logs estruturados por execução de sync (descobertas, atualizações, falhas), para que eu audite a saúde do catálogo.

## Decisões de implementação

### Módulos construídos/modificados e direção das dependências

- **`app-modules/tracks`** (novo): domínio — contratos de fonte, models (`tracks`, `modules`, `lessons`, `track_contributors`), normalização ETL, contribuidores/adoção, servindo a agregação. Persiste tudo.
- **`integration-github`** (modificado): implementa os contratos de fonte do tracks — `GithubTrackProvider` com working copy (clone/pull), metadata fetch e **contribution fetch** — e ganha endpoints de interação (star/watch/follow). Devidamente **transport only**: devolve DTOs.
- **`identity`** (modificado): passa a emitir `ExternalIdentityConnected` nos dois caminhos que criam conexão (OAuth e API key). Evento genérico de propósito — `contents` e outros vão consumir o mesmo gatilho.
- **`panel-admin`** (modificado): expanded `GithubRepositoryResource` (allowlist `purpose=Tracks` + publish/unpublish) + leitura de tracks para publicação.
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
interface FetchesContributors extends TrackSourceProvider {          // NOVO (D5)
    /** @return iterable<TrackContributorDTO> */   // endpoint /contributors all-time (chave de autoria)
    public function fetchContributors(TrackSourceDTO $s): iterable;
}
```

Registry singleton resolvido pelo ServiceProvider do tracks; `GithubTrackProvider` registra-se no `boot()` da integration. O comando itera o registry e nunca cita "github".

### Allowlist, curation e publicação (Model 2 + padrão ADR-0002 `purpose`)

- `GithubRepository.purpose` ganha o caso **`Tracks`** (categoria de projeção no allowlist, como o `challenge` do onboarding).
- `github_repositories.enabled` = ingestão. `tracks.status` (`syncing` | `active` | `archived` | **`hidden`**) = exibição, armazenado na linha do track.
- **Publish/unpublish** = setar `tracks.status` no painel de admin, reusando `GithubRepositoryResource` (form ganha o campo de status/publish). Ocultar trilha não para ingestão.
- **Auto-discovery** mantida mas **apenas propõe**: novos repos entram como pendentes para aprovação no painel. Caveats documentados no ADR 0005, E-D4 (rate limit, escopo do webhook, gate de curation, renames).

### Modelo de dados

- **`tracks`**: `source_type` enum (`github`) + colunas de fonte planas — `repo_owner`, `repo_name` (NOT NULL), `repo_url` nullable, `default_branch` nullable (api-resolved), `language` nullable, `category` nullable (categoria no README central, resolvida no ETL e atualizada a cada sync), stars/forks/watchers (default 0). Sem `source_data` JSONB: o payload de fonte foi promovido a colunas consultáveis (emenda E-D11). Não há delegated types como no contents, porque o agregado é uniforme por nível da hierarquia (ADR 0004 D2, emendado por E-D11; `native` reservado em docs — emenda E-D10).
- **`modules`** e **`lessons`**: identidade determinística **UUIDv5** (namespace da trilha + source path). Rename → soft-delete + `replaced_by_uuid`; interações e progresso vinculam ao UUID imutável, nunca ao path. (D1)
- **`lessons.processed_content`** (HTML pós-ETL). **Sem `estimated_minutes` nem `word_count`** (emenda E-D3 — duração removida do agregador). **Sem coluna de XP.**
- **`track_contributors`**: autoria como entidade própria — `github_username` SEMPRE gravado (memória e chave de adoção), `user_id` nullable (órfão é estado normal), `is_owner` (exatamente um por trilha), `contribution_role` enum. **Fonte primária de autoria: endpoint de contribuidores (`GET /repos/{owner}/{repo}/contributors`, all-time, `selectedMetric=additions`) — a validar contra repos reais; as fontes de autoria (.all-contributorsrc → config.json → autores do README → avatares) permanecem como fallback por trás.** (E-D5)
- Ordenação de módulos/aulas: heurística README (seções numeradas primeiro) → alfabética → git tree order; override configurável por repo para estruturas atípicas.

### ETL e sincronização

- Comando **`tracks:sync`**: sync + normalize num passe. Metadados via API (capability `FetchesRepositoryMetadata`), conteúdo via working copy (shallow clone; incremental com pull existente; flag `--force`).
- **Intake via allowlist**: `tracks:sync` lê `GithubRepository::where('purpose', Tracks)` (tenant-scoped), no padrão do backfill (job por repo, idempotente, resumível, rate-limit-aware).
- Branch resolvida dinamicamente (`default_branch`); extensões normalizadas (`.MD` → `.md`); links relativos de imagem reescritos para `raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`.
- Idempotência: upsert por UUID determinístico; segunda passada sem mudanças = zero alterações estruturais.
- Descoberta de novas fontes: observação de commits no README de `he4rt/4noobs` (polling na fase 1, webhook futuro) — propõe no painel, nunca publica.

### Ciclo de órfãos e adoção

- Listener do tracks em `ExternalIdentityConnected`: adota todos os `track_contributors` com aquele `github_username` e `user_id` nulo → emite `TrackMaintainersLinked` (fato para downstream creditar retroativamente).
- Simetria com o padrão vivo `AccountsMerged` → reatribuição no activity.

### Interações GitHub (Grupo A — mantido; Grupo B removido)

- Endpoints novos na integration: PUT/DELETE/GET `/user/starred/{owner}/{repo}`, `/repos/{owner}/{repo}/subscription`, `/user/following/{username}` — padrão de token per-request já usado pela house.
- Scopes OAuth a acrescentar: `public_repo` (star) e `user:follow` (follow); atuais são insuficientes.
- **Stateless/transitórias**: sem estado local para verificar; o toggle reflete o estado real contra a API por requisição.
- Estados desabilitados: conta não vinculada → botão desabilitado + tooltip "Conecte sua conta GitHub para interagir"; repo deletado/owner trocado → desabilitado + tooltip informativo; token expirado → pré-validação via GET check.
- Posicionamento (do protótipo escolhido): Star+contagem, Watch+contagem, Sponsor e Share compactos no header do detalhe; Follow por contribuidor após o conteúdo, com verificação prévia do estado real.

### UX/UI (protótipos já aprovados, emendados)

- Listagem = variante C: tema dark GitHub (`#0D1117`/`#161B22`), hero + busca, order dropdown, filtros (categoria/status), grid de cards com badges de interação. **`.poc-stats` removido**; **sem progresso pessoal nos cards**.
- Detalhe = `TrackAside` (Livewire via render hook `LAYOUT_END`), aberto pelos eventos `tracks-aside.sync`/`tracks-aside.open`. Árvore módulos/aulas **sem check de conclusão**.
- Leitor = variante A "Focus Reader": sidebar fina colapsável com índice h2, breadcrumb, blocos tipados (code com copy, callout, table), prev/next. **Sem marcar concluída; sem feedback por aula.**
- Fonte Inter. Protótipos: `TracksPrototypePage`, `LessonReaderPrototypePage`, `TrackAside` (dados mockados em memória a substituir).

## Decisões de teste

- Bom teste testa comportamento externo, não detalhes: GitHub mockado → linhas corretas no banco; ação do usuário → chamada correta.
- **Seam 1 — domínio (`tracks/tests`)**: ETL e ações de adoção com Saloon `MockClient` + fixtures de working copy (dir temporário com árvore de arquivos simulada) + contributors endpoint mockado. Prior art: `BackfillRepositoryTest` na integration-github.
- **Seam 2 — apresentação (`panel-app/tests`)**: Livewire/Filament para renderização e wiring dos eventos `tracks-page.*`/`tracks-aside.*`. Prior art: `ProfilePageTest`.
- **Seam 3 — transporte (`integration-github/tests`)**: novos endpoints de interação com o mesmo padrão MockClient existente; `GithubTrackProvider` (working copy/metadata/contributors) com fixtures.
- Contratos de fonte têm teste de conformidade: qualquer provider registrado satisfaz as capabilities que declara.

## Fora do escopo

- Engine de gamificação (XP/badges/streaks) — events emitidos preparam, implementação é esforço próprio.
- **Estado pessoal do aluno** (progresso, bookmark, avaliação, feedback por aula) — escopo LMS removido.
- CRUD de trilhas nativas — `source_type` só tem `github` hoje (E-D10); fluxo futuro vem depois.
- Comentários/forks/Discussions nas trilhas.
- Integração com timeline/perfil — esforço posterior; sem requisito hoje.
- **Ser subtipo dentro do `contents`** — avaliado e recusado; rationale completo no ADR 0004 e 0005.

## Notas adicionais

- Relação com `contents` é de **contextos irmãos**: nenhum depende do outro; ambos dependem de identity; compartilham o gatilho `ExternalIdentityConnected`.
- **Fronteira de módulo explícita (Model 2)**: transporte devolve DTOs; domínio persiste. Documentada no ADR 0005 (E-E).
- **`purpose=Tracks` no allowlist**: novo caso do `PurposeType`, no padrão ADR-0002 do onboarding. `enabled` ≠ `published`.
- **Autoria a validar**: `selectedMetric=additions` no endpoint de contribuidores pode sub-ponderar quem contribui sem código; validar contra repos reais (E-D5).
- **Caveats de backfill para muitos repos**: documentados no ADR 0005 (E-D4) — rate limit, escopo do webhook, gate de curation, renames.
- Ao propor upstream: criar label `mod:tracks`, constraint de composer no estilo `^1.0.0` (lição do commit do contents), e coordenar o ticket de `ExternalIdentityConnected` com o plano equivalente da spec do contents — é trabalho compartilhado.