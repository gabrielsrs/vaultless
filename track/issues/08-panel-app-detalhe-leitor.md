# 08 — feat(panel-app): detalhe da trilha (`TrackAside`) + leitor de aulas com progresso

**Labels (GitHub):** `type:feat` · `mod:panel-app` · `mod:tracks` · `difficulty:hard`
**Status:** ready-for-agent

## Contexto

O detalhe da trilha foi desenhado como um **aside sobreposto** (não página própria): o usuário navega a listagem e abre a trilha sem perder o contexto do grid. A leitura acontece numa segunda superfície, o **"Focus Reader"** — variante aprovada entre quatro protótipos —, que serve o HTML já processado pelo ETL com foco total no texto. Ambos foram prototipados no fork com dados em memória; este ticket torna-os reais.

Visual de referência completo em [`../artefatos/tracks-docs.html?poc=1`](../artefatos/tracks-docs.html?poc=1) (POC em tela cheia), seções "Detalhe · TrackAside" e "Leitor · variante Focus Reader". Resumo:

- **Aside**: header com stats do repo (stars/forks/watchers), criador, descrição, badges de metadados (linguagem/nível/duração), progresso geral, árvore módulos → aulas com check de concluída, lista de contribuidores
- **Reader**: breadcrumb `Trilha > Módulo > Aula`, sidebar fina colapsável com índice dos h2 da aula atual, blocos tipados (código com botão copiar, callout, tabela), navegação anterior/próxima respeitando a ordenação persistida pelo ETL

## O que construir

- Componente Livewire `tracks-aside` registrado globalmente via render hook `LAYOUT_END` do painel, escopado às páginas que o usam (listagem + reader)
- Comunicação por eventos Livewire já definidos no protótipo:
  - listagem dispara `selectTrack(id)` → aside sincroniza (`tracks-aside.sync`)
  - reader pode abrir outro aside direto (`tracks-aside.open`)
  - fechar o aside devolve estado à listagem (`tracks-page.clear`)
- Leitor servindo `lessons.processed_content` com os blocos tipados estilizados
- Progresso: ação "concluir aula" grava estado pessoal vinculado ao **UUID da aula** na tabela `user_completed_lessons` (ver [`../schema.md`](../schema.md)); checks aparecem na árvore do aside e na barra da listagem. Opcionalmente, detecção automática por scroll (~90% da aula lida) pode marcar como concluída sem ação manual — implementação a critério do dev, não bloqueante
- Navegação prev/next pela coluna de posição persistida; Devendo apenas existir casos haja prev/next.
- Estados vazios: trilha sem conteúdo sincronizado ainda, aula removida entre syncs (ponteiro `replaced_by_uuid` redireciona)

## Critérios de aceite

- [ ] Aside abre da listagem e do reader pelos eventos definidos, fecha limpando estado
- [ ] Árvore de módulos/aulas espelha exatamente o ETL (ordem e agrupamento)
- [ ] Concluir aula persiste e reflete no aside e na listagem imediatamente
- [ ] Prev/next atravessam limites de módulo corretamente
- [ ] Rename de path entre syncs não perde progresso (UUID estável provado em teste)
- [ ] Code blocks têm botão copiar funcional; callouts e tabelas estilizados
- [ ] Testes Livewire cobrindo eventos, conclusão de aula e navegação

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Ler uma trilha e acompanhar progresso

  Cenário: Abrir o detalhe da trilha
    Dado que estou na listagem de trilhas
    Quando seleciono uma trilha
    Então o aside abre com stats do repo, criador e árvore de conteúdo

  Cenário: Concluir uma aula
    Dado que estou lendo a primeira aula de um módulo
    Quando marco a aula como concluída
    Então o check aparece na árvore do aside
    E a barra de progresso da listagem aumenta

  Cenário: Navegar linearmente
    Dado que estou na última aula de um módulo
    Quando avanço para a próxima
    Então caio na primeira aula do módulo seguinte, na ordem do ETL

  Cenário: Última aula da trilha
    Dado que estou na última aula de toda a trilha
    Quando o leitor renderiza
    Então o botão "Próxima" não aparece

  Cenário: Aula renomeada entre syncs
    Dado que marquei uma aula como concluída e ela foi renomeada no repo
    Quando o próximo sync roda e eu reabro a trilha
    Então meu check continua presente na aula sucessora
```

## Bloqueada por

- #07 — listagem navegável existe

---

[← Anterior: 07](07-panel-app-listagem-trilhas.md) · [issues/README](README.md) · [Próxima: 09 →](09-user-track-state-salvar-avaliar-feedback.md)
