# Issues — Módulo `tracks`

Índice dos 11 tickets (tracer bullets) que implementam o módulo `tracks`, no formato das issues `type:feat` da casa (padrão stherzada). Dependências entre tickets: ver o [grafo no README do módulo](../README.md).

[← README do módulo](../README.md)

| # | Documento | Título |
|---|---|---|
| 01 | [01-scaffold-modulo-tracks.md](01-scaffold-modulo-tracks.md) | Scaffold do módulo de trilhas |
| 02 | [02-identity-evento-conexao.md](02-identity-evento-conexao.md) | Evento `ExternalIdentityConnected` nos caminhos de conexão |
| 03 | [03-provider-contract-e-registry.md](03-provider-contract-e-registry.md) | Contratos de fonte (`TrackSourceProvider`) + registry |
| 04 | [04-github-provider-descoberta-metadados.md](04-github-provider-descoberta-metadados.md) | `GithubTrackProvider` — descoberta de repos 4noobs e metadados |
| 05 | [05-sync-tracks-etl.md](05-sync-tracks-etl.md) | `SyncTracks` — ETL de conteúdo (working copy → módulos e aulas normalizadas) |
| 06 | [06-contribuidores-adocao-orfaos.md](06-contribuidores-adocao-orfaos.md) | Contribuidores da trilha + ciclo de órfãos com adoção retroativa |
| 07 | [07-panel-app-listagem-trilhas.md](07-panel-app-listagem-trilhas.md) | Listagem de trilhas real substituindo o protótipo mockado |
| 08 | [08-panel-app-detalhe-leitor.md](08-panel-app-detalhe-leitor.md) | Detalhe da trilha (`TrackAside`) + leitor de aulas focado |
| 09 | [09-github-interaction-endpoints.md](09-github-interaction-endpoints.md) | Requests de interação (star, watch, follow) com escopo elevado |
| 10 | [10-panel-app-acoes-github-ui.md](10-panel-app-acoes-github-ui.md) | Ações GitHub na UI do aside com matriz de estados |
| 11 | [11-agendamento-descoberta-automatica.md](11-agendamento-descoberta-automatica.md) | Agendamento do sync + descoberta automática de novas trilhas |

> O ticket 09 da v2 (`UserTrackState` — estado pessoal) foi **removido no reescopo para agregador** (ADR 0005); os tickets seguintes foram renumerados em sequência.
