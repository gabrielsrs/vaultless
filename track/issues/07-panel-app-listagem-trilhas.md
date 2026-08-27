# 07 — feat(panel-app): listagem de trilhas real substituindo o protótipo mockado

**Labels (GitHub):** `type:feat` · `mod:panel-app` · `mod:tracks` · `difficulty:medium`
**Status:** ready-for-agent

## Contexto

A experiência de descoberta de trilhas foi prototipada e aprovada entre seis variantes: a escolhida ("variante C") segue a identidade visual dark do GitHub — linguagem que o público 4noobs já conhece. O protótipo funciona com **dados em memória**, apenas provando UX; este ticket o substitui por uma página real alimentada pelo catálogo sincronizado (tickets 04–05).

Visual de referência completo (com mockups navegáveis) está em [`../artefatos/tracks-docs.html?poc=1`](../artefatos/tracks-docs.html?poc=1) (POC em tela cheia), seção "UX/UI escolhida". Layout aprovado:

- Tema `#0D1117` / `#161B22`, fonte Inter
- Hero com título + campo de busca
- Barra de estatísticas pessoais (horas totais/concluídas, trilhas concluídas/em andamento)
- Banner de destaque para trilha em evidência
- Grid de cards: barra de progresso, ícone tecnologia, título, criador, módulos, duração, badges "estrelado"/"salvo"
- **Ordenar por**: Mais recentes, Mais populares, Menor duração, Progresso (Não iniciadas / Em andamento / Concluídas)
- **Filtros**:
  - Categoria: Todas, Frontend, Backend, Mobile, DevOps, Design, Data, QA
  - Nível: Iniciante, Intermediário, Avançado
  - Duração: Até 3h, 3h–6h, 6h–10h, 10h+
  - Status: Novas, Populares, Recém atualizadas

## O que construir

- Página Livewire/Filament no painel do usuário consultando os models do tracks (sem dados mockados)
- Busca server-side por nome da trilha, tecnologia e autor
- Filtros combináveis + ordenação persistidos na URL (compartilhável)
- Stats pessoais agregadas do estado do usuário autenticado; visitante deslogado vê catálogo completo com progresso zerado e stats ocultas/neutras
- Progresso do card calculado do estado pessoal (aulas concluídas / total)
- Badges do card refletem interações já existentes (estrelado via GitHub quando houver estado verificado; salvo via UserTrackState — ticket 09 completa os toggles)
- Protótipos mockados aposentados/removidos neste ticket

## Critérios de aceite

- [ ] Listagem reflete exatamente o catálogo sincronizado — sem nenhum dado fixo
- [ ] Busca e cada filtro funcionam server-side e são combináveis
- [ ] Ordenação e filtros sobrevivem a refresh (estado na URL)
- [ ] Card exibe progresso real do usuário logado; deslogado vê tudo zerado
- [ ] Responsivo conforme protótipo; tema dark aplicado
- [ ] Testes Livewire cobrindo renderização, busca e filtros (padrão dos testes de página existentes)

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Descobrir trilhas na plataforma

  Cenário: Usuário explora o catálogo
    Dado que três trilhas foram sincronizadas
    Quando acesso a página de trilhas
    Então vejo as três trilhas com criador, duração, módulos e progresso zerado

  Cenário: Filtrar por status
    Dado que concluí duas aulas de uma trilha de quatro
    Quando filtro por "em andamento"
    Então somente essa trilha aparece na grade

  Cenário: Visitante deslogado
    Dado que não estou autenticado
    Quando acesso a página de trilhas
    Então vejo o catálogo completo sem estatísticas pessoais
```

## Bloqueada por

- #05 — ETL populando módulos e aulas (progresso precisa de conteúdo)

---

[← Anterior: 06](06-contribuidores-adocao-orfaos.md) · [issues/README](README.md) · [Próxima: 08 →](08-panel-app-detalhe-leitor.md)
