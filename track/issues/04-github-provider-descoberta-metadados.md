# 04 — feat(integration-github): `GithubTrackProvider` — descoberta de repos 4noobs e metadados

**Labels (GitHub):** `type:feat` · `mod:integration-github` · `mod:tracks` · `difficulty:medium`
**Status:** ready-for-agent

## Contexto

Os repositórios do programa 4noobs estão espalhados por owners individuais (`he4rt/css4noobs`, `danielhe4rt/php4noobs`, …) e novos surgem com frequência. A lista canônica da comunidade vive no **README do repo central `he4rt/4noobs`**, que é atualizado a cada trilha nova. Pesquisa empírica em 9 repos (css, php, cpp, rust, python, typescript, swift, git, qa) confirmou o padrão `{topic}4noobs` e catalogou as variações que o ETL depois vai tratar (ticket 05).

A `integration-github` hoje só tem requests GET de leitura (users, PRs, issues, commits). Nada de descoberta de fontes. Este ticket implementa o lado GitHub dos contratos definidos pelo tracks (ticket 03): **descobrir** quais repos são trilhas, **buscar metadados** de cada um e **buscar contribuidores** (fonte primária de autoria — ADR 0005, E-D5). O domínio continua sem saber que GitHub existe.

> **Escopo v3 (agregador):** a descoberta propõe, nunca publica por conta própria — trilhas descobertas entram como pendentes no painel; a publicação é via allowlist `purpose=Tracks` + `tracks.status` (E-D4).

## O que construir

- Classe `GithubTrackProvider` na integration implementando:
  - `DiscoversTrackSources`: lê o README central do `he4rt/4noobs` e extrai os links `{topic}4noobs` → `TrackSourceDTO` (externalId = `owner/repo`). **Só propõe** — não altera `tracks.status` sozinho.
  - `FetchesRepositoryMetadata`: GET do repo via transporte Saloon existente → `RepoMetadataDTO` (`default_branch`, `language`, `stargazers_count`, `forks_count`, `subscribers_count`, `description`)
  - `FetchesContributors` (nova capability, ADR 0005 E-D5): GET `/repos/{owner}/{repo}/contributors` (all-time, `selectedMetric=additions`) → `TrackContributorDTO` (`github_username`, `contributions`, `avatar_url`)
- Registro do provider no registry do tracks dentro do `boot()` do ServiceProvider da integration
- Persistência inicial: upsert idempotente de trilhas no catálogo — chave natural `(source_type = github, external_id)`; segunda passada sem mudanças não altera nada
- Tolerância a falha: erro numa fonte (repo apagado, API instável) registra log e segue para as demais; nenhuma trilha existente é apagada ou esvaziada por falha parcial

## Critérios de aceite

- [ ] Sync popula o catálogo com as trilhas descobertas no README central + metadados corretos
- [ ] Branch default resolvida dinamicamente pela API (`default_branch`), nunca hardcoded `main`
- [ ] Contribuidores do endpoint mapeados em `TrackContributorDTO` (primário; cadeia de fallback no ticket 06)
- [ ] Trilha descoberta entra como **pendente** — descoberta nunca seta `tracks.status = active` sozinha
- [ ] Idempotência provada: rodar duas vezes seguidas mantém contagem de trilhas inalterada
- [ ] Falha em uma fonte não derruba o sync nem corrompe as demais
- [ ] Testes com MockClient mockando cada request (padrão já usado nos testes de backfill desta integration)
- [ ] Nenhuma linha alterada no módulo tracks para acomodar este provider

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Catálogo de trilhas alimentado pelo GitHub

  Cenário: Primeira sincronização
    Dado que o README central lista "php4noobs" e "css4noobs"
    Quando executo o sync
    Então ambas as trilhas existem no catálogo com owner, branch default e linguagem preenchidos

  Cenário: Nova trilha anunciada pela comunidade
    Dado que uma nova linha "{topic}4noobs" entrou no README central
    Quando o próximo sync roda
    Então a trilha entra no catálogo sem registro manual

  Cenário: Repo indisponível durante o sync
    Dado que a API falha para "rust4noobs" mas responde para as demais
    Quando o sync roda
    Então a falha é registrada, as outras trilhas são sincronizadas
    E nenhuma trilha existente é removida
```

## Bloqueada por

- #03 — contratos de fonte + registry

---

[← Anterior: 03](03-provider-contract-e-registry.md) · [issues/README](README.md) · [Próxima: 05 →](05-sync-tracks-etl.md)
