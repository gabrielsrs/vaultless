---
name: okf
description: >-
  Cria, audita, valida e organiza Knowledge Bundles no formato Open Knowledge Format (OKF v0.1 e v0.2).
  Ative quando o usuário pedir para documentar dados, tabelas, métricas, playbooks, processos de negócio,
  APIs ou ativos de conhecimento usando markdown com frontmatter YAML; quando mencionar "OKF",
  "knowledge bundle", "knowledge catalog", "open knowledge format", "OpenKB" ou "openknowledge.ai";
  ou quando precisar exportar ou estruturar documentação técnica consumível por LLMs e humanos.
---

# Open Knowledge Format (OKF)

OKF é uma especificação aberta mantida pela Google Cloud e comunidade open-source para organizar conhecimento corporativo em diretórios de arquivos Markdown com metadados YAML. 

O formato elimina a dependência de bancos vetoriais proprietários em tarefas onde a navegação determinística é mais eficiente que buscas probabilísticas via RAG. Agentes de IA percorrem os arquivos sem SDKs dedicados, enquanto desenvolvedores versionam e revisam alterações diretamente no Git.

Para a referência técnica normativa, consulte [references/spec-summary.md](references/spec-summary.md). Para exemplos práticos de tabelas, métricas e playbooks, consulte [references/templates.md](references/templates.md). Detalhes sobre ferramentas integradas (OpenKB, GitBook, Dataplex) estão em [references/ecosystem-tools.md](references/ecosystem-tools.md).

## Quando usar

- Documentar ativos de dados (tabelas BigQuery/PostgreSQL, views, pipelines dbt e Dataform).
- Definir métricas operacionais e regras de negócio (KPIs, fórmulas, SLAs).
- Estruturar playbooks e procedimentos de resposta a incidentes para times de engenharia.
- Gerar bases de conhecimento compiladas para agentes de IA a partir de PDFs ou manuais extensos via OpenKB.
- Exportar catálogos técnicos de forma interoperável entre ferramentas como Dataplex, GitBook e Obsidian.

## Regras normativas de conformidade

Um Knowledge Bundle é considerado conformante com a especificação OKF quando atende a três regras objetivas:

1. **Frontmatter obrigatório**: Todo arquivo `.md` (exceto os reservados `index.md` e `log.md`) inicia e encerra com delimitadores `---` contendo YAML válido.
2. **Campo `type` preenchido**: O frontmatter contém obrigatoriamente a chave `type` com um valor em texto não-vazio.
3. **Reserva de nomes estruturais**: `index.md` e `log.md` são reservados para índice e histórico, não podendo ser usados como nomes de conceitos de negócio.

Consumidores de bundles devem tolerar campos opcionais ausentes, tipos não mapeados previamente e links para arquivos ainda inexistentes.

---

## Fluxo de criação de um Knowledge Bundle

### 1. Organização do diretório

Estruture os arquivos em pastas temáticas conforme o domínio:

```
catalogo-vendas/
├── index.md                      # Sumário principal de navegação
├── log.md                        # Histórico de alterações do repositório
├── visao-geral.md                # Concept de alto nível
└── tabelas/
    ├── index.md                  # Sumário do subdiretório
    ├── pedidos.md                # Concept de tabela
    └── clientes.md               # Concept de tabela
```

### 2. Redação de Concepts

Cada arquivo de concept precisa do bloco YAML inicial e corpo em Markdown focado em estrutura (tabelas, listas e blocos de código):

```markdown
---
type: BigQuery Table
title: Pedidos Faturados
description: Uma linha por pedido finalizado com confirmação de pagamento.
resource: https://console.cloud.google.com/bigquery?project=core&dataset=sales&table=orders
tags: [vendas, faturamento, core]
sources:
  - id: orders-raw
    resource: https://api.loja.com/v1/orders
    title: API de Pedidos do Checkout
    author: team:checkout
    usage_count: 32000
    last_modified: 2026-06-01T00:00:00Z
generated:
  by: agent:catalog-sync/v1.0
  at: 2026-06-10T12:00:00Z
verified:
  - by: process:schema-linter
    at: 2026-06-10T12:05:00Z
  - by: human:lucas-dados
    at: 2026-06-11T09:00:00Z
status: stable
stale_after: 2026-12-31T23:59:59Z
---

# Schema

| Coluna | Tipo | Descrição |
|---|---|---|
| `order_id` | STRING | Identificador único do pedido. |
| `customer_id` | STRING | Referência ao concept [Clientes](/tabelas/clientes.md). |
| `total_cents` | INTEGER | Valor total em centavos. |
| `created_at` | TIMESTAMP | Data e hora de criação no checkout. |

# Joins

- Relaciona com [Clientes](/tabelas/clientes.md) através da coluna `customer_id`.

# Examples

```sql
SELECT 
  DATE(created_at) AS dia,
  COUNT(1) AS total_pedidos,
  SUM(total_cents) / 100.0 AS receita_bruta
FROM `core.sales.orders`
GROUP BY 1
ORDER BY 1 DESC;
```
```

### 3. Links entre conceitos

Utilize links Markdown padrão para interligar documentos:

- **Caminho absoluto dentro do bundle (recomendado)**: `[Clientes](/tabelas/clientes.md)`
- **Caminho relativo**: `[Clientes](./clientes.md)`

O texto que envolve o link qualifica a relação entre os dados. A especificação não exige tipos pré-fixados de aresta.

### 4. Geração do `index.md`

O arquivo `index.md` provê navegação progressiva para agentes, evitando a leitura desnecessária de todos os arquivos de uma vez. Não deve conter frontmatter de concept:

```markdown
# Catálogo de Vendas

Listagem de ativos de dados e tabelas do pipeline de faturamento.

* [Pedidos Faturados](tabelas/pedidos.md) - Uma linha por pedido finalizado com confirmação de pagamento.
* [Clientes](tabelas/clientes.md) - Cadastro central de compradores e informações de contato.
```

### 5. Geração do `log.md`

Registra atualizações em ordem cronológica decrescente:

```markdown
# Histórico de Atualizações

## 2026-06-11

* **Verification**: Verificação humana concluída por `human:lucas-dados` em [Pedidos](/tabelas/pedidos.md).
* **Create**: Criação do concept [Clientes](/tabelas/clientes.md).

## 2026-06-01

* **Init**: Criação da estrutura do bundle.
```

---

## Proveniência, Sinais de Confiança e Ciclo de Vida (v0.2)

Em bases mantidas por múltiplos agentes e pessoas, os metadados do frontmatter respondem a perguntas críticas:

### Sinais de Confiança em `sources`
Em vez de notas de autoridade subjetivas, o OKF registra fatos objetivos:
- `author`: Ator responsável pela origem (`human:nome`, `team:nome`, `process:id`).
- `usage_count`: Contagem de acessos ou execuções dentro da janela `usage_window`.
- `last_modified`: Data em que a fonte original foi alterada.

### Trust Tiers derivados de `verified`
O nível de confiança de um conceito é calculado com base em quem o validou:
1. **Unverified**: Nenhum validador registrado.
2. **Machine-confirmed**: Verificado apenas por processos de CI (`process:*`) ou agentes de IA.
3. **Human-reviewed**: Validado por ao menos um especialista humano (`human:*`).

### Ciclo de vida e depreciação
- `status`: Estado atual do documento (`draft`, `stable`, `deprecated`, `review-needed`).
- `stale_after`: Data a partir da qual o concept precisa ser revisado. Documentos com prazo vencido continuam legíveis, mas alertam os agentes sobre a necessidade de revalidação.

---

## Attested Computation (v0.2)

Conceito projetado para cálculos determinísticos e auditáveis onde o resultado não pode ser inferido por alucinação:

```yaml
type: Attested Computation
title: Cálculo de MRR Consolidado
runtime: bun
parameters:
  - { name: start_date, type: string, required: true }
  - { name: end_date, type: string, required: true }
executor:
  resource: references/scripts/calculate_mrr.ts
  receipt: [exit_code, stdout, duration_ms]
attester:
  resource: references/attesters/verify_mrr.ts
```

- **Executor**: Executa o código e gera evidências de execução (*receipt*).
- **Receipt**: Artefato em tempo de execução com logs, códigos de saída e valores computados.
- **Attester**: Script sem LLM que inspeciona o receipt e valida a precisão dos cálculos.

---

## Validação automatizada

Para auditar um Knowledge Bundle contra a especificação, utilize o script de validação incluso na skill via Bun:

```bash
bun run .agents/skills/okf/scripts/validate.ts ./meu-bundle
```

Caso prefira executar via PowerShell nativo:

```powershell
Get-ChildItem -Path ./meu-bundle -Filter *.md -Recurse | Where-Object { $_.Name -notin @('index.md', 'log.md') } | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -notmatch '(?s)^---\r?\n.*?\r?\n---') {
        Write-Host "ERRO: Frontmatter ausente em $($_.FullName)" -ForegroundColor Red
    } elseif ($content -notmatch '(?m)^type:\s*.+') {
        Write-Host "ERRO: Campo 'type' ausente em $($_.FullName)" -ForegroundColor Red
    }
}
```

---

## Erros comuns

- **Tratar `index.md` como concept**: Arquivos `index.md` organizam a hierarquia e não recebem o campo `type`.
- **Omitir o campo `type`**: É a única chave estritamente obrigatória pela especificação em arquivos regulares.
- **Inchar o markdown com prosa desestruturada**: Dê preferência a tabelas de colunas, listas de regras e exemplos em blocos de código com linguagem definida.
- **Interromper navegação por links quebrados**: A spec tolera referências a documentos ainda não criados para permitir documentação incremental.
