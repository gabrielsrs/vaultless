# Templates de Concepts OKF

Modelos práticos prontos para uso em Knowledge Bundles. Copie o bloco correspondente e preencha os valores.

## 1. Tabela / Dataset (Catálogo de Dados)

```markdown
---
type: BigQuery Table
title: Faturas de Clientes (Invoices)
description: Uma linha por fatura emitida no gateway de pagamentos com status de liquidação.
resource: https://console.cloud.google.com/bigquery?project=corp-data&dataset=finance&table=invoices
tags: [financeiro, faturamento, pagamentos]
sources:
  - id: gateway-api
    resource: https://api.gateway.com/v1/invoices
    title: Gateway de Cobrança
    author: team:finance-ops
    usage_count: 8900
    last_modified: 2026-06-20T00:00:00Z
generated:
  by: agent:schema-extractor/v2.1
  at: 2026-07-15T10:00:00Z
verified:
  - by: process:schema-diff-checker
    at: 2026-07-15T10:05:00Z
  - by: human:ana-dados
    at: 2026-07-16T14:20:00Z
status: stable
stale_after: 2026-12-31T23:59:59Z
---

# Schema

| Coluna | Tipo | Descrição |
|---|---|---|
| `invoice_id` | STRING | Identificador único da fatura (chave primária). |
| `customer_id` | STRING | Chave estrangeira para [Clientes](/core/customers.md). |
| `amount_cents` | INTEGER | Valor cobrado em centavos de Real. |
| `status` | STRING | Estado atual: `pending`, `paid`, `failed` ou `canceled`. |
| `due_date` | DATE | Data de vencimento da cobrança. |
| `paid_at` | TIMESTAMP | Momento exato da liquidação bancária. |

# Joins

- `customer_id` conecta com `customer_id` em [Clientes](/core/customers.md).
- `invoice_id` conecta com [Transações](/finance/transactions.md).

# Examples

```sql
SELECT 
  DATE_TRUNC(paid_at, MONTH) AS mes,
  SUM(amount_cents) / 100.0 AS receita_total
FROM `corp-data.finance.invoices`
WHERE status = 'paid'
GROUP BY 1
ORDER BY 1 DESC;
```
```

---

## 2. Métrica de Negócio (Metric)

```markdown
---
type: Metric
title: Taxa de Cancelamento Mensal (Churn Rate)
description: Percentual de clientes ativos que cancelaram o serviço durante o mês de apuração.
tags: [metric, saas, customer-success]
sources:
  - id: bi-metric-handbook
    resource: https://wiki.empresa.com/metrics/churn-definition
    author: human:roberto-head-cs
    last_modified: 2026-05-10T12:00:00Z
generated:
  by: human:roberto-head-cs
  at: 2026-05-12T15:00:00Z
verified:
  - by: human:carla-cfo
    at: 2026-05-15T09:30:00Z
status: stable
---

# Definição

A Taxa de Cancelamento mede a evasão de contas ativas sobre a base elegível no início do período.

$$\text{Churn Rate} = \frac{\text{Clientes Cancelados no Mês}}{\text{Clientes Ativos no 1º Dia do Mês}} \times 100$$

# Regras de Negócio

1. Cancelamentos solicitados no último dia do mês contam para o mês corrente.
2. Contas em período de teste gratuito (trial) não entram no cálculo.
3. Upgrades e downgrades afetam o MRR Churn, não o Logo Churn.

# Recursos Relacionados

- Tabela base: [Assinaturas](/subscriptions/customer_plans.md)
- Playbook de retenção: [Tratativa de Cancelamento](/cs/playbooks/retention_flow.md)
```

---

## 3. Playbook / Runbook Operacional

```markdown
---
type: Playbook
title: Falha na Ingestão do Pipeline Financeiro
description: Procedimento de resposta a incidentes para reprocessamento de lotes pendentes de pagamento.
tags: [oncall, playbook, finance, incident]
generated:
  by: human:lucas-sre
  at: 2026-06-01T08:00:00Z
verified:
  - by: human:marcos-tech-lead
    at: 2026-06-02T11:00:00Z
status: stable
---

# Trigger

Este procedimento deve ser executado quando o alerta `FINANCE_INGESTION_LAG > 30m` disparar no canal de operações.

# Verificações preliminares

1. Acesse o painel de monitoramento do pipeline.
2. Verifique se o gateway de pagamentos reportou degradação no status oficial.
3. Inspecione os logs da última execução:
   ```bash
   bun run scripts/check-pipeline-status.ts --env=production
   ```

# Passos para resolução

1. Se houver falha de autenticação, rode a renovação de tokens:
   ```bash
   bun run scripts/rotate-gateway-token.ts
   ```
2. Para reprocessar o lote específico a partir da data de corte:
   ```bash
   bun run scripts/backfill-invoices.ts --from=2026-07-01 --to=2026-07-02
   ```
3. Valide a consistência comparando os totais com a tabela [Faturas de Clientes](/finance/invoices.md).
```

---

## 4. Endpoint de API

```markdown
---
type: API Endpoint
title: POST /v1/checkout/sessions
description: Cria uma sessão de pagamento autenticada para o checkout web.
resource: https://api.empresa.com/v1/checkout/sessions
tags: [api, checkout, payments]
generated:
  by: human:dev-team
  at: 2026-04-10T14:00:00Z
status: stable
---

# Headers obrigatórios

- `Authorization`: `Bearer <token_api>`
- `Content-Type`: `application/json`
- `Idempotency-Key`: UUID v4 para evitar cobranças duplicadas.

# Request Payload

```json
{
  "customer_id": "cus_98234",
  "items": [
    { "sku": "prod_premium_annual", "quantity": 1 }
  ],
  "return_url": "https://loja.com/sucesso"
}
```

# Response (201 Created)

```json
{
  "session_id": "cs_test_8392019",
  "checkout_url": "https://pay.loja.com/c/cs_test_8392019",
  "expires_at": "2026-04-10T15:00:00Z"
}
```
```

---

## 5. Attested Computation (v0.2)

```markdown
---
type: Attested Computation
title: Validação Determinística de Saldos Bancários
description: Executa reconciliação de extrato bancário contra a base de transações.
runtime: bun
parameters:
  - name: reconciliation_date
    type: string
    required: true
executor:
  resource: references/scripts/reconcile_balances.ts
  receipt: [exit_code, discrepancies_found, execution_time_ms]
attester:
  resource: references/attesters/assert_zero_discrepancies.ts
generated:
  by: human:carlos-auditoria
  at: 2026-07-01T09:00:00Z
status: stable
---

# Computation

Este concept executa uma reconciliação que compara o saldo reportado pelo extrato bancário com a soma de transações na tabela [Transações](/finance/transactions.md).

O script emite um receipt estruturado que é inspecionado pelo attester sem intervenção de modelos de linguagem.
```

---

## 6. Documento de Índice (`index.md`)

```markdown
# Catálogo Financeiro

Índice central de ativos de dados e processos do time financeiro.

* [Faturas de Clientes](invoices.md) - Uma linha por fatura emitida no gateway de pagamentos com status de liquidação.
* [Transações](transactions.md) - Registro individual de movimentações financeiras e estornos.
* [Taxa de Cancelamento Mensal](churn_rate.md) - Percentual de clientes ativos que cancelaram o serviço durante o mês de apuração.
* [Falha na Ingestão do Pipeline](playbooks/ingestion_failure.md) - Procedimento de resposta a incidentes para reprocessamento de lotes.
```

---

## 7. Registro de Histórico (`log.md`)

```markdown
# Histórico de Atualizações do Bundle

## 2026-07-16

* **Update**: Adicionado campo `paid_at` e novos joins no concept [Faturas de Clientes](/finance/invoices.md).
* **Create**: Criado playbook de resolução de falhas [Falha na Ingestão](/finance/playbooks/ingestion_failure.md).

## 2026-07-01

* **Init**: Criação inicial da estrutura de diretórios e catalogação de tabelas core.
```
