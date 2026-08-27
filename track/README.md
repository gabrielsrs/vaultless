# Proposta upstream — Módulo `tracks` (v2, Opção B)

Pacote de documentos para propor o módulo de trilhas ao `he4rt/heartdevs.com`, alinhado às regras arquiteturais consolidadas pelo módulo `contents` no branch 4.x. Substitui a spec v1 (`../spec.md`), que permanece aqui como histórico do wayfinder.

## Conteúdo

| Documento | O que é |
|---|---|
| [spec.md](spec.md) | Spec v2 completa (template to-spec): problema, solução, 26 user stories, decisões de implementação/teste |
| [schema.md](schema.md) | Referência técnica: tabelas, enums, contratos PHP, DTOs e eventos — dev consulta ao implementar issues |
| [parent-issue.md](parent-issue.md) | Issue-mãe para abrir no GitHub (`type:prd`): problem statement, 17 user stories, modelo de dados completo, subtarefas com placeholder para links dos 12 tickets |
| [adr/0004-decisoes-do-modulo-e-alinhamento-com-contents.md](adr/0004-decisoes-do-modulo-e-alinhamento-com-contents.md) | ADR consolidado: D1–D9 com alternativas recusadas de cada decisão do wayfinder + alinhamento ao contents (inclui o porquê de NÃO ser subtipo, e a emenda que remove `xp_reward`) |
| [issues/README.md](issues/README.md) | Índice dos 12 tickets tracer-bullet com dependências, no formato das issues `type:feat` da casa (padrão stherzada) |
| [artefatos/tracks-docs.html](artefatos/tracks-docs.html) | PRD + system design navegável com os mockups aprovados — anexar às issues de UI (#07, #08, #11); as issues referenciam este arquivo e não dependem de nada fora da pasta |

## Sobre as issues desta pasta

Cada issue é **autocontida**: traz o contexto que precisa para ser entendida isoladamente (o que é o módulo tracks, qual decisão a precede, o que construir), seguindo o formato denso das issues `type:feat` do repositório — `O que construir` → `Critérios de aceite` → `Teste/BDD` (gherkin em pt-BR) → `Bloqueada por`. Nenhuma issue exige ler a spec v1, os tickets do wayfinder ou o código dos protótipos; quando o visual importa, ela aponta para `../artefatos/tracks-docs.html`.

## Como usar estes documentos

A cascata de referência para implementar qualquer issue:

```
parent-issue.md   → visão executiva (o quê e por quê)
       ↓
spec.md           → user stories e decisões de produto
       ↓
adr/0004          → por quê cada alternativa foi recusada
       ↓
schema.md         → estruturas exatas (tabelas, contratos, DTOs, eventos)
       ↓
issues/NN         → o que construir nesta sprint específica
```

O dev começa pela issue, segue as referências para trás quando precisa de contexto. Cada issue aponta explicitamente para os documentos relevantes.

## Decisões em uma linha cada

1. **Contextos irmãos**: `contents` = peças planas publicadas; `tracks` = estruturas hierárquicas de aprendizado + estado pessoal. Nenhum depende do outro.
2. **Inversão de contrato**: tracks possui os contratos; `integration-github` implementa (`GithubTrackProvider`) e se registra.
3. **Órfãos com adoção**: `github_username` sempre gravado; listener de `ExternalIdentityConnected` adota retroativamente.
4. **XP fora do domínio**: sem coluna de recompensa; tracks emite fatos, gamification decide.
5. **Mantidos do desenho original** (específicos de trilhas): UUIDv5 + `replaced_by_uuid`, ETL git incremental, `source_type`+JSONB, `UserTrackState`, `TrackCapabilities`.

## Grafo de dependências dos tickets

```
01 scaffold ──▶ 03 contratos ──▶ 04 provider github ──▶ 05 ETL ──┬─▶ 06 adoção ────┐
   02 identity event ─────────────────────────────────────────────┘                ├─▶ 12 agendamento
                                          05 ──▶ 07 listagem ──▶ 08 detalhe/leitor ─┴─▶ 09 estado pessoal
                                                                                     │
10 endpoints interação (paralelo, sem bloqueio) ─────────────────────────────────────┴─▶ 11 ações na UI
```

Fronteiras iniciais (sem bloqueadores): **01**, **02**, **10**.

## Checklist para abrir no GitHub

- [ ] Rebasear esta proposta sobre o 4.x mais recente (o contents pode ter avançado)
- [ ] Criar label `mod:tracks` (espelhando `mod:contents`) e mapear na tabela de triage
- [ ] Abrir issue-mãe da spec com `type:feat` + `mod:tracks`, linkando spec + ADR 0004 no corpo
- [ ] Anexar `artefatos/tracks-docs.html` às issues de UI (ou prints das seções "UX/UI escolhida")
- [ ] Abrir um issue por ticket (títulos prontos nos arquivos), com `Blocked by` referenciando os issues reais
- [ ] Coordenar o ticket **02** (`ExternalIdentityConnected`) com quem mantém o plano do `contents` — é trabalho compartilhado; abrir como PR conjunto ou issue referenciada
- [ ] Discutir antes: capability `ProvidesWorkingCopy` (clone git atrás do contrato) — ponto aberto sinalizado na conversa
- [ ] Constraint de composer em `^1.0.0` desde o primeiro commit (lição do commit do contents)

## Histórico

- Wayfinder original: `../map.md` + `../issues/01–06` (todos resolvidos)
- Spec v1: `../spec.md` (superseded por esta pasta)
- Protótipos aprovados: commits `9cc1e5fb` / `8e20a598` neste fork (`TracksPrototypePage`, `LessonReaderPrototypePage`, `TrackAside`)
