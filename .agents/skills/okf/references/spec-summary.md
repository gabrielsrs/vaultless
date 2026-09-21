# Especificação Técnica OKF (v0.1 e v0.2)

Documento de referência normativa e técnica para o Open Knowledge Format (OKF).
Fonte oficial: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md

## Conceitos fundamentais

| Termo | Definição técnica |
|---|---|
| Knowledge Bundle | Diretório autocontido e hierárquico contendo arquivos markdown. Unidade de distribuição (repositório Git, tarball ou subpasta). |
| Concept | Documento markdown individual (`.md`) com metadados estruturados. Representa ativos físicos (tabelas, endpoints) ou lógicos (métricas, playbooks). |
| Concept ID | Caminho relativo do concept dentro do bundle, sem a extensão `.md` (exemplo: `finance/revenue-metric`). |
| Frontmatter | Bloco delimitado por `---` no topo do arquivo contendo YAML válido. |
| Body | Conteúdo em markdown padrão abaixo do segundo delimitador `---`. |
| Reserved Files | Arquivos com propósito especial no padrão: `index.md` (listagem) e `log.md` (histórico cronológico). |
| Provenance | Rastreabilidade da origem do concept via lista `sources`. |
| Credibility Signal | Métricas objetivas por fonte (`author`, `usage_count`, `last_modified`) para inferir confiabilidade sem depender de score arbitrário. |
| Actor | Identificador padronizado: `human:<id>` (pessoas), `process:<id>` (automações) ou `<producer>/<version>` (agentes/modelos). |
| Trust Tier | Classificação inferida com base no campo `verified`: *unverified*, *machine-confirmed* ou *human-reviewed*. |
| Attested Computation | Concept especializado (`type: Attested Computation`) com instruções determinísticas para computar e atestar valores. |

## Estrutura do diretório

```
bundle-root/
├── index.md                      # Opcional. Sumário do diretório para progressive disclosure.
├── log.md                        # Opcional. Registro cronológico de mudanças.
├── top-level-concept.md          # Concept na raiz.
├── references/                   # Opcional. Scripts, attesters, schemas ou referências brutas.
└── domain-area/                  # Subdiretórios para agrupamento temático.
    ├── index.md
    └── sub-concept.md
```

## Nomes reservados

- `index.md`: Documento de índice de diretório. Não deve ser usado como nome de concept.
- `log.md`: Histórico cronológico do bundle. Não deve ser usado como nome de concept.

## Especificação de Frontmatter

### Campos obrigatórios

- `type` (string): Identificador do tipo do concept. O vocabulário é aberto (não requer registro central). Exemplos: `BigQuery Table`, `Metric`, `Playbook`, `API Endpoint`, `Attested Computation`, `Concept`.

### Campos recomendados

- `title` (string): Título legível. Quando omitido, o consumidor deriva do nome do arquivo.
- `description` (string): Resumo conciso em uma frase. Utilizado em `index.md`, snippets de busca e previews de agentes.
- `resource` (URI): URI canônica do recurso subjacente (ex: link do console BigQuery, URL da API ou schema path). Omitido em conceitos abstratos.
- `tags` (array de strings): Tags transversais para indexação e agrupamento.

### Proveniência e Sinais de Credibilidade (v0.2)

```yaml
sources:
  - id: ga4-raw-data
    resource: https://analytics.google.com/export/orders
    title: Tabela de Exportação GA4
    author: team:data-eng
    usage_count: 14200
    last_modified: 2026-06-15T10:00:00Z

usage_window:
  from: 2026-05-01T00:00:00Z
  to: 2026-06-01T00:00:00Z
```

- `sources[].resource`: Obrigatório dentro de cada entrada de fonte. Pode ser URL absoluta, caminho relativo ao bundle ou descrição de escopo (`"BigQuery project core-analytics"`).
- `sources[].id`: Identificador estável usado para vincular claims específicos no corpo do texto via notas de rodapé (`[^id]`).
- `sources[].author`: Ator responsável pela fonte.
- `sources[].usage_count`: Volume de acessos, execuções de queries ou visualizações no período declarado em `usage_window`.
- `sources[].last_modified`: Data ISO 8601 da última alteração no recurso de origem.

### Confiança e Ciclo de Vida (v0.2)

```yaml
generated:
  by: agent:data-catalog-sync/v1.2
  at: 2026-07-10T14:30:00Z

verified:
  - by: process:schema-linter
    at: 2026-07-10T14:35:00Z
  - by: human:marcos-analista
    at: 2026-07-11T09:00:00Z

status: stable             # Vocabulário aberto: draft, stable, deprecated, review-needed
stale_after: 2026-12-31T23:59:59Z
```

### Regras de inferência de Trust Tiers

1. **Unverified**: Campo `verified` ausente ou vazio.
2. **Machine-confirmed**: `verified` contém apenas atores `process:*` ou identificadores de agentes.
3. **Human-reviewed**: `verified` contém pelo menos uma entrada `human:*`.

## Headings convencionais no Body

O corpo do markdown aceita qualquer formatação válida, mas a especificação prescreve headings padronizados para garantir previsibilidade na extração por LLMs:

- `# Schema`: Descrição tabular ou em lista de colunas, tipos e restrições.
- `# Joins` ou `# Relationships`: Como o ativo se conecta a outros concepts do bundle.
- `# Examples`: Consultas SQL, chamadas cURL ou trechos de código representativos.
- `# Computation`: Declaração de cálculos em `Attested Computation`.
- `# Trigger` / `# Steps`: Seções padrão para documentos do tipo `Playbook`.

## Attested Computation (v0.2)

Estrutura formal para conceitos cuja veracidade depende de computação verificável:

```yaml
---
type: Attested Computation
title: Cálculo de MRR Consolidado
description: Script de conferência determinística de receita recorrente mensal.
runtime: bun
parameters:
  - name: start_date
    type: string
    required: true
  - name: end_date
    type: string
    required: true
executor:
  resource: references/scripts/calculate_mrr.ts
  receipt: [exit_code, stdout, duration_ms]
attester:
  resource: references/attesters/verify_mrr.ts
generated:
  by: human:lucas-financeiro
  at: 2026-07-01T12:00:00Z
---

# Computation

Este concept roda uma validação contábil entre a base de pagamentos e os logs de cancelamento.
```

## Regras de conformidade da especificação

1. **Frontmatter parseável**: Todo `.md` (exceto `index.md` e `log.md`) deve iniciar e fechar com `---` contendo YAML sem erros sintáticos.
2. **Campo `type` presente**: Todo frontmatter precisa conter a chave `type` com valor em texto não-vazio.
3. **Arquivos reservados respeitados**: `index.md` e `log.md` devem seguir as estruturas prescritas e não podem ser usados como concepts de negócio.

Tolerâncias explícitas:
- Ausência de campos opcionais nunca invalida um bundle.
- Chaves customizadas desconhecidas devem ser aceitas e preservadas.
- Links relativos quebrados não invalidam a conformidade do bundle.
