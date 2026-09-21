# Vaultless — catálogo de conhecimento

Repositório de documentação viva e protótipos das propostas upstream para a comunidade He4rt Devs. Organizado no formato [OKF](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md): cada documento `.md` traz frontmatter com `type` e `status`, cada diretório tem um `index.md` para navegação progressiva, e o [log.md](log.md) guarda o histórico cronológico.

## Contextos

* [Módulo tracks](track/index.md) — pacote de proposta upstream do agregador de trilhas 4noobs: spec v3, ADRs, schema, PRD e 11 issues tracer-bullet.
* [Protótipos](prototipos/index.md) — HTMLs exploratórios de UI (timeline de eventos; versão 2 do artefato tracks-docs, deprecada).

## Por onde começar

Precisa do contexto do módulo tracks? A cascata de referência é:
`parent-issue` → `spec` → `adr/0004` → `adr/0005` → `schema` → `issues/NN`.
Detalhes em [track/index.md](track/index.md).

## Conformidade do bundle

```bash
bun run scripts/validar-okf.ts
```

Valida os diretórios de conteúdo contra a especificação OKF (frontmatter, campo `type`, arquivos reservados e links internos). A tooling de agentes em `.agents/` é tratada como dependência vendada e fica fora do bundle.
