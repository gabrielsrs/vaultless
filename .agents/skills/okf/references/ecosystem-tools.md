# Ecossistema e Ferramentas OKF

Guia de integração do Open Knowledge Format com ferramentas de mercado e fluxos de trabalho com IA.

## 1. OpenKB (VectifyAI)

OpenKB é um sistema open-source que compila documentos soltos (PDF, DOCX, PPTX, HTML, CSV) em uma base de conhecimento estruturada e interligada no padrão OKF.

### Funcionamento
- **Compilação de Wiki**: Ao receber novos arquivos, o sistema gera páginas de resumo, extrai conceitos e entidades (pessoas, organizações, produtos) e cria links cruzados automaticamente.
- **Indexação Hierárquica com PageIndex**: Documentos longos (PDFs com mais de 20 páginas) são convertidos em árvores hierárquicas de seções em vez de depender de chunks vetoriais tradicionais.
- **Skill Factory**: Gera skills reutilizáveis para agentes a partir dos concepts compilados na base.
- **Knowledge Workbench**: Interface web local para navegação e consultas.

```bash
# Inicializar base OpenKB
openkb init

# Adicionar documentos ou diretórios
openkb add manual_operacional.pdf
openkb add ./politicas/

# Consultar a base compilada
openkb query "Qual é o SLA para incidentes críticos?"
```

---

## 2. OpenKnowledge (openknowledge.ai)

Conjunto de utilitários e starter packs voltados para padronização e scaffolding de repositórios OKF.

### Recursos principais
- **Scaffolding inicial**: Cria a árvore de diretórios com `index.md`, `log.md` e schemas base.
- **Validador no navegador**: Permite inspecionar bundles diretamente via web sem necessidade de instalar dependências locais.
- **Editor visual**: Interface para edição de frontmatter e renderização de tabelas de schema.

---

## 3. Google Cloud Dataplex & Knowledge Catalog

A Google Cloud utiliza o OKF como especificação aberta para exportação e compartilhamento de metadados em ambientes corporativos.

### Principais casos de uso
- **Exportação de Metadados**: BigQuery e Dataplex exportam esquemas, linhagem e descrições de tabelas para repositórios Git no formato OKF.
- **Sinais de Confiança Automatizados**: Automações de CI/CD e pipelines de dados injetam dados de recência (`last_modified`), volume de uso (`usage_count`) e atestações de linter no bloco `sources` e `verified`.
- **Intercâmbio entre Organizações**: Facilita a entrega de dados documentados entre empresas sem exigir que a parte consumidora utilize a mesma ferramenta de catálogo.

---

## 4. GitBook & Plataformas de Documentação

Plataformas modernas de documentação suportam a ingestão de bundles OKF diretamente de repositórios Git.

### Vantagens práticas
- **Compatibilidade nativa com Markdown**: A documentação do time de engenharia e os metadados consumidos por agentes residem no mesmo repositório.
- **Navegação Determinística**: Os arquivos `index.md` funcionam como sumário natural da navegação web.
- **Busca por Agentes**: Agentes de suporte e documentação interna navegam pela hierarquia sem necessidade de reprocessamento vetorial.

---

## 5. Obsidian & Visualização em Grafo

Como todo concept OKF utiliza links markdown convencionais (`[alvo](/caminho/arquivo.md)`), qualquer diretório de bundle pode ser aberto diretamente no Obsidian.

### Recursos imediatos
- **Graph View**: Mapeia todas as interconexões entre tabelas, playbooks e métricas.
- **Backlinks**: Identifica quais conceitos referenciam uma tabela específica antes de aplicar alterações ou deprecations.
- **Busca local rápida**: Permite filtragem por frontmatter e tags nativamente.
