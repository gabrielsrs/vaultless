# 03 — feat(tracks): contratos de fonte (`TrackSourceProvider`) + registry

**Labels (GitHub):** `type:feat` · `mod:tracks` · `difficulty:medium`
**Status:** ready-for-agent

## Contexto

As trilhas vêm de fontes externas (hoje GitHub), mas o domínio `tracks` **não pode conhecer transporte** — regra consolidada pela casa no módulo `contents` e registrada no CONTEXT-MAP: *Integration pode depender de Domain; Domain nunca de Integration*. Se o ETL importasse connector do `integration-github` direto, o tracks quebraria a cada mudança de token/API e não seria testável sem rede.

A solução da casa: **o domínio define os contratos, quem implementa se registra**. O que uma fonte sabe fazer vira interface opcional ("capability"), checada com `instanceof` — nunca flag de config nem método devolvendo array vazio. Este ticket materializa essa inversão para trilhas.

**Referência para implementação**: o dev segue a cascata [`../spec.md`](../spec.md) (seção "Decisões de implementação" → contratos) → [`../adr/0004-decisoes-do-modulo-e-alinhamento-com-contents.md`](../adr/0004-decisoes-do-modulo-e-alinhamento-com-contents.md) (D1–D4) → [`../schema.md`](../schema.md) (seção "Contratos PHP" e "DTOs") → este ticket.

## O que construir

- Enum `TrackSourceType` com o único caso real: `github`. O caso `native` **não entra no enum** — fica reservado apenas em docs (emenda E-D10 no ADR 0005); trilha nativa da plataforma **não tem provider** (não é conta de ninguém, análogo ao RSS no contents).
- Contratos no namespace do tracks:

```php
interface TrackSourceProvider
{
    public function source(): TrackSourceType;
}

interface DiscoversTrackSources extends TrackSourceProvider
{
    /** @return iterable<TrackSourceDTO> */
    public function discoverSources(): iterable;
}

interface FetchesRepositoryMetadata extends TrackSourceProvider
{
    public function fetchMetadata(TrackSourceDTO $source): RepoMetadataDTO;
}

interface ProvidesWorkingCopy extends TrackSourceProvider
{
    /** shallow clone na 1ª vez / pull incremental nas seguintes; retorna path local */
    public function workingCopy(TrackSourceDTO $source): string;
}

interface FetchesContributors extends TrackSourceProvider    // NOVO (ADR 0005, E-D5)
{
    /** @return iterable<TrackContributorDTO>   # GET /repos/{owner}/{repo}/contributors, all-time */
    public function fetchContributors(TrackSourceDTO $source): iterable;
}
```

- DTOs de fronteira (tradução anti-corrupção: vocabulário da fonte não entra no domínio):
  - `TrackSourceDTO`: `externalId` (ex.: `owner/repo`), `owner`, `name`, `url`
  - `RepoMetadataDTO`: `defaultBranch`, `language`, `stars`, `forks`, `watchers`, `description`
  - `TrackContributorDTO`: `githubUsername`, `contributions`, `avatarUrl` (NOVO, E-D5)
- `TrackSourceRegistry` singleton registrado no `TracksServiceProvider::register()`; providers entram via `boot()` de quem implementa.
- Comando `tracks:sync` esqueleto: itera o registry, pergunta capacidades com `instanceof`, loga o que encontrou. **Nunca cita um provider pelo nome.**
- Teste de conformidade: provider fake satisfaz as capabilities que declara; provider sem determinada capability é simplesmente pulado.

## Critérios de aceite

- [ ] Zero menção a HTTP/Saloon/git nos contratos e no comando
- [ ] Registry singleton resolvível pelo container; registro acontece fora do módulo tracks
- [ ] Comando enxerga provider registrado e lista fontes descobertas (log)
- [ ] Provider sem `ProvidesWorkingCopy`, por exemplo, é pulado sem erro
- [ ] `make check` + `make test` verdes

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Descoberta de fontes via contratos

  Cenário: Provider registrado aparece para o comando
    Dado que um provider de teste foi registrado no registry
    Quando executo o comando de sincronização
    Então as fontes que ele descobre são listadas sem citar seu nome

  Cenário: Capacidade ausente não quebra
    Dado um provider que só implementa descoberta
    Quando o comando pede metadados ou working copy
    Então a etapa correspondente é pulada silenciosamente
```

## Bloqueada por

- #01 — scaffold do módulo de trilhas

---

[← Anterior: 02](02-identity-evento-conexao.md) · [issues/README](README.md) · [Próxima: 04 →](04-github-provider-descoberta-metadados.md)
