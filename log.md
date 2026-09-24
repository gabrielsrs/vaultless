# Histórico de Atualizações

## 2026-09-21

* **Create**: `index.html` (viewer do bundle para GitHub Pages — carrega os concepts via fetch, renderiza frontmatter OKF, busca, deep-link por hash) e `.nojekyll` (Pages serve os `.md` crus; sem ele o Jekyll quebra o fetch do viewer).
* **Humanização**: textos do bundle revisados com a skill `humanizar` — períodos longos divididos, voz passiva e nominal reduzidas; correções pontuais (frase quebrada no reader da issue 08, resquício de "progresso" na issue 07, acentuação e concordância no PRD, `end-point`→`endpoint`, anchors "README"→"Índice", referência à spec v2 sem caminho fantasma). Fatos, números, tabelas, gherkin e código intocados.
* **Reestruturação**: o repositório virou Knowledge Bundle OKF — frontmatter em todos os concepts, `README.md` de `track/` e `track/issues/` renomeados para `index.md`, `index.md` da raiz e este `log.md` criados.
* **Move**: `timeline.html` → [prototipos/timeline-eventos.html](prototipos/timeline-eventos.html); `tracks-docs.html` da raiz (versão antiga, deprecada) → [prototipos/tracks-docs-v2.html](prototipos/tracks-docs-v2.html).
* **Fix**: referências de navegação atualizadas para os `index.md`; menção à spec v1 (`../spec.md`, arquivo nunca versionado aqui) corrigida em [track/index.md](track/index.md).
* **Create**: `scripts/validar-okf.ts` (valida o bundle sem tocar na tooling vendada) e `.gitignore`.

## 2026-09-16

* **Update** (`track v3`, d2e0801): reescopo do pacote tracks para agregador — spec v3, ADR 0005, schema e issues alinhados.

## 2026-08-27

* **Update** (`track`, 720ded4): pacote de proposta do módulo reunido em `track/` (spec, ADRs 0004–0005, issues, artefatos).

## 2026-08-21

* **Create** (`gallery timeline`, 4f30752): protótipo da timeline de eventos da comunidade.

## 2026-08-13

* **Create** (`tracks artifact`, cfebefe): PRD + system design das trilhas como página HTML.
* **Init**: Initial commit (3f3fffe) — criação do repositório.
