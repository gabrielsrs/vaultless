# 01 — feat(tracks): scaffold do módulo de trilhas

**Labels (GitHub):** `type:feat` · `mod:tracks` (a criar) · `difficulty:medium`
**Status:** ready-for-agent

## Contexto

A comunidade He4rt mantém o programa **4noobs**: repositórios `{topic}4noobs` hospedados no GitHub, cada um em um owner individual (ex.: `he4rt/css4noobs`, `danielhe4rt/php4noobs`), com conteúdo educacional 100% markdown. Hoje esse acervo não existe para a plataforma: não há catálogo, navegação, progresso de leitura, valorização dos criadores nem modo dedicado a leitura dentro do site.

O módulo **`tracks`** resolve isso como um bounded context próprio: agrega as trilhas sincronizadas dos repos, estrutura o conteúdo em trilha → módulo → aula, guarda estado pessoal do aluno e expõe interações GitHub (star/watch/follow) que valorizam quem cria. O desenho consolidado está em [`../spec.md`](../spec.md), no ADR [`../adr/0004-decisoes-do-modulo-e-alinhamento-com-contents.md`](../adr/0004-decisoes-do-modulo-e-alinhamento-com-contents.md) e nas estruturas detalhadas em [`../schema.md`](../schema.md).

Este ticket é o nascimento do módulo — o mesmo tipo de commit que criou o módulo `contents`: estrutura canônica, registro nas regras da casa, zero funcionalidade.

## O que construir

- Estrutura canônica do pacote em `app-modules/tracks/`:
  - `composer.json` do pacote + `TracksServiceProvider` bootável
  - `src/` com subpastas previstas (`Enums/`, `Models/`, `Sources/`, `Console/`)
  - `database/{migrations,factories,seeders}/` e `tests/{Feature,Unit}/`
  - `phpstan.neon` + `phpstan.ignore.neon` no padrão dos outros módulos
- `CONTEXT.md` do módulo com glossário inicial:
  - **Trilha (Track)** — a unidade raiz; hoje sempre originada de um repo 4noobs (`source_type = github`), futuramente nativa da plataforma (`native`)
  - **Módulo / Aula** — os dois níveis abaixo da trilha (diretório / arquivo markdown na origem)
  - **Fonte de Conteúdo (Source)** — de onde a trilha veio; identificada por `(source_type, external_id)`
  - **Contribuidor** — pessoa autora de conteúdo, resolvida por handle GitHub
  - **Órfão / Adoção** — contribuidor sem conta He4rt vinculada / ato de vinculá-lo retroativamente
  - **TrackCapabilities** — ações disponíveis por tipo de fonte
  - **UserTrackState** — estado pessoal usuário↔trilha (progresso, salvo, avaliação, feedback)
- Registro no `CONTEXT-MAP.md`:
  - Linha na tabela de contextos
  - Regras de dependência: `integration-github` implementa os contratos definidos pelo tracks; tracks depende de identity; presentation lê de tracks, nunca o reverso; activity/gamification podem escutar eventos do tracks
- Triage: linha `mod:tracks` na tabela de labels + label criada no GitHub (espelhar `mod:contents`)
- Constraint do pacote no composer da raiz no estilo `^1.0.0` (convenção intra-repo), composer.lock reconciliado

## Critérios de aceite

- [ ] ServiceProvider carrega no boot da aplicação sem erros
- [ ] Módulo aparece no CONTEXT-MAP com descrição e regras de dependência explícitas
- [ ] CONTEXT.md com glossário completo listado acima
- [ ] Label `mod:tracks` existe e está mapeada na tabela de triage
- [ ] Constraint `^1.0.0` aplicada; `make check` e `make test` verdes

## Teste

Ticket estrutural — validação é `make check` + `make test` verdes e módulo bootável. Comportamento chega nos tickets seguintes.

## Bloqueada por

Nada — pode começar imediatamente.

---

[← issues/README](README.md) · [Próxima: 02 →](02-identity-evento-conexao.md)
