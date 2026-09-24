# Vaultless — catálogo de conhecimento

Este repositório guarda a documentação das propostas upstream da comunidade He4rt Devs e os protótipos de UI. Ele segue o formato [OKF](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md). Cada `.md` abre com frontmatter: `type` diz o que o documento é, `status` diz em que pé está. Os `index.md` dos pacotes fazem a navegação; o [log.md](log.md) registra o histórico.

## Contextos

* [Módulo tracks](track/index.md) — proposta upstream do agregador de trilhas 4noobs: spec v3, ADRs, schema, PRD e 11 issues tracer-bullet. A cascata de leitura começa lá.
* [Protótipos](prototipos/index.md) — HTMLs exploratórios de UI (timeline de eventos; versão 2 do artefato tracks-docs, deprecada).

## Web

O bundle abre como site: `index.html` na raiz é o viewer. Ele carrega todos os concepts via fetch, mostra o frontmatter como metadados (badges de `type`, `status`, trust tier, tags) e mantém a navegação progressiva dos `index.md`, com busca e deep-link (`#/track/spec.md`). Sem build.

Para publicar no GitHub Pages: Settings → Pages → *Deploy from a branch* → `master` + `/ (root)`. O `.nojekyll` garante que os `.md` sejam servidos crus — sem ele, o Jekyll converteria os documents e quebraria o fetch do viewer. Endereço: `https://joaovjo.github.io/vaultless/`.

## Conformidade do bundle

```bash
bun run scripts/validar-okf.ts
```

O script confere os pacotes de conteúdo contra a especificação OKF: frontmatter, campo `type`, arquivos reservados e links internos. Ele ignora `.agents/`, que é tooling vendada e não faz parte do bundle.
