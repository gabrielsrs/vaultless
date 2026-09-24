# Proposta upstream — Módulo `tracks` (v3, agregador)

Pacote de documentos para propor o módulo de trilhas ao `he4rt/heartdevs.com`, alinhado às regras arquiteturais consolidadas pelo módulo `contents` no branch 4.x. **Escopo v3 (agregador):** após review upstream, o tracks deixa de ser LMS — sem estado pessoal do aluno (E-D6/E-D8 no ADR 0005). Substitui a spec v1, que não é versionada neste repositório — o histórico do reescopo está registrado no [ADR 0005](adr/0005-reescopo-para-agregador.md).

## Conteúdo

| Documento | O que é |
|---|---|
| [spec.md](spec.md) | Spec v3 (agregador): problema, solução, 22 user stories, decisões de implementação/teste |
| [schema.md](schema.md) | Referência técnica: tabelas, enums, contratos PHP, DTOs e eventos — dev consulta ao implementar issues |
| [parent-issue.md](parent-issue.md) | Issue-mãe para abrir no GitHub (`type:prd`): problem statement, 16 user stories, modelo de dados completo, subtarefas com placeholder para links dos 11 tickets |
| [adr/0004-decisoes-do-modulo-e-alinhamento-com-contents.md](adr/0004-decisoes-do-modulo-e-alinhamento-com-contents.md) | ADR consolidado: D1–D9 com alternativas recusadas de cada decisão + alinhamento ao contents |
| [adr/0005-reescopo-para-agregador.md](adr/0005-reescopo-para-agregador.md) | **ADR do reescopo (emendas E-D1–E-D11 + E-E)**: o que sai do LMS, curation por allowlist (`purpose=Tracks`), endpoint de contribuidores primário, flatten do JSONB (E-D11), Model 2 transporte × domínio |
| [índice das issues](issues/index.md) | 11 tickets tracer-bullet com dependências, no formato das issues `type:feat` da casa (o estado pessoal — 09 da v2 — foi removido no reescopo) |
| [artefatos/tracks-docs.html](artefatos/tracks-docs.html) | PRD + system design navegável com os mockups aprovados — anexar às issues de UI (#07, #08, #10); as issues referenciam este arquivo e não dependem de nada fora da pasta |

## Sobre as issues desta pasta

Cada issue é **autocontida**: traz o contexto que precisa para ser entendida isoladamente (o que é o módulo tracks, qual decisão a precede, o que construir), seguindo o formato denso das issues `type:feat` do repositório — `O que construir` → `Critérios de aceite` → `Teste/BDD` (gherkin em pt-BR) → `Bloqueada por`. Nenhuma issue exige ler a spec v1, os tickets antecessores ou o código dos protótipos; quando o visual importa, ela aponta para `../artefatos/tracks-docs.html`.

## Como usar estes documentos

A cascata de referência para implementar qualquer issue:

```
parent-issue.md   → visão executiva (o quê e por quê)
        ↓
spec.md           → user stories e decisões de produto
        ↓
adr/0004 → 0005   → por quê cada alternativa foi recusada + o reescopo agregador
        ↓
schema.md         → estruturas exatas (tabelas, contratos, DTOs, eventos)
        ↓
issues/NN         → o que construir nesta sprint específica
```

O dev começa pela issue, segue as referências para trás quando precisa de contexto. Cada issue aponta explicitamente para os documentos relevantes.

## Decisões em uma linha cada

1. **Contextos irmãos**: `contents` = peças planas publicadas; `tracks` = agregador de estruturas hierárquicas de aprendizado. Nenhum depende do outro.
2. **Inversão de contrato**: tracks possui os contratos; `integration-github` implementa (`GithubTrackProvider`) e se registra — **transporte devolve DTOs, domínio persiste** (Model 2, E-E).
3. **Órfãos com adoção**: `github_username` sempre gravado; listener de `ExternalIdentityConnected` adota retroativamente.
4. **XP fora do domínio**: sem coluna de recompensa; tracks emite `TrackMaintainersLinked`, gamification decide.
5. **Autoria**: **endpoint de contribuidores** primeiro (`GET /repos/{owner}/{repo}/contributors`, all-time); `.all-contributorsrc` → `config.json` → README → avatares como fallback (E-D5).
6. **Curation por allowlist**: `github_repositories.purpose = Tracks` (ingestão) + `tracks.status` (exibição) — descoberta **propõe**, admin **publica** (E-D4).
7. **Sem estado pessoal**: `user_track_state`, `lesson_feedback`, `user_completed_lessons`, `estimated_minutes` e filtros de nível/duração/progresso **removidos** (E-D3, E-D6, E-D8); interações são só GitHub, stateless.

## Grafo de dependências dos tickets

```
01 scaffold ──▶ 03 contratos ──▶ 04 provider github ──▶ 05 ETL ──┬─▶ 06 adoção ────┐
   02 identity event ─────────────────────────────────────────────┘                ├─▶ 11 agendamento
                                          05 ──▶ 07 listagem ──▶ 08 detalhe/leitor ─┘
09 endpoints interação (paralelo, sem bloqueio) ────────────────────────────────────▶ 10 ações na UI
```

Fronteiras iniciais (sem bloqueadores): **01**, **02**, **09**.

## Checklist para abrir no GitHub

- [ ] Rebasear esta proposta sobre o 4.x mais recente (o contents pode ter avançado)
- [ ] Criar label `mod:tracks` (espelhando `mod:contents`) e mapear na tabela de triage
- [ ] Abrir issue-mãe da spec com `type:feat` + `mod:tracks`, linkando spec + ADR 0004 no corpo
- [ ] Anexar `artefatos/tracks-docs.html` às issues de UI (ou prints das seções "UX/UI escolhida")
- [ ] Abrir um issue por ticket (títulos prontos nos arquivos), com `Blocked by` referenciando os issues reais
- [ ] Coordenar o ticket **02** (`ExternalIdentityConnected`) com quem mantém o plano do `contents` — é trabalho compartilhado; abrir como PR conjunto ou issue referenciada
- [ ] Discutir antes: capability `ProvidesWorkingCopy` (clone git atrás do contrato) — ponto aberto sinalizado na conversa
- [ ] Constraint de composer em `^1.0.0` desde o primeiro commit (lição do commit do contents)
