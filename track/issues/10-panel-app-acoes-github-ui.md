# 10 — feat(panel-app): ações GitHub na UI do aside com matriz de estados

**Labels (GitHub):** `type:feat` · `mod:panel-app` · `mod:integration-github` · `difficulty:medium`
**Status:** ready-for-agent

## Contexto

Grupo A das interações (valorizar criadores): o header do aside (#08) expõe ações que **escrevem no GitHub** em nome do usuário. A decisão de produto define que o estado exibido é **sempre verificado contra a API** — nunca assumido de cache local, porque star/watch/follow mudam fora da plataforma o tempo todo.

A matriz de estados acordada:

| Estado do usuário/fonte | Comportamento do botão |
|---|---|
| Conta GitHub vinculada + escopos válidos | ativo, estado real via check prévio |
| Sem conta vinculada **ou** token expirado/sem escopo | desabilitado + tooltip "Conecte sua conta GitHub para interagir" + CTA para a conexão |
| Repo morto/transferido | desabilitado + tooltip informativa |

## O que construir

- Header do aside com os três controles:
  - **Star** — ícone + contagem; toggle estrelar/desestrelar
  - **Watch** — ícone + contagem; toggle inscrever/cancelar
  - **Share** — Web Share API com fallback para clipboard
- **Follow + Sponsor por contribuidor**: botões junto a cada contribuidor na seção de autores do aside; check prévio de follow antes de exibir estado; **Sponsor** só exibe se `GET /users/{login}/sponsorship` retornar que o owner tem sponsor ativo (abre em nova aba)
- Check prévio: ao abrir/sincronizar o aside, consultas booleanas (`GET` starred/watch/following do ticket #09) definem estado inicial dos toggles
- Aplicação integral da matriz de estados acima; contagem base vem da metadata sincronizada (#04), atualização otimista após confirmação da ação
- Estados de carregamento: skeleton nos checks prévios para não piscar estado errado

## Critérios de aceite

- [ ] Star/Watch alternam estado real no GitHub e refletem após reload (estado verificado)
- [ ] Usuário sem conta vinculada vê todos desabilitados com tooltip + CTA funcionando
- [ ] Repo removido do GitHub desabilita as ações com tooltip informativa
- [ ] Token antigo sem novos escopos degrada silenciosamente para neutro
- [ ] Follow aparece por contribuidor e respeita o mesmo check prévio
- [ ] Share copia link quando Web Share API indisponível
- [ ] Testes Livewire mockando as actions da integration cobrindo cada linha da matriz

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Interações GitHub dentro do aside

  Cenário: Usuário vinculado estrela uma trilha
    Dado que minha conta GitHub está conectada com escopos válidos
    Quando clico no botão de estrela de uma trilha
    Então a ação executa no GitHub e a contagem aumenta otimisticamente
    E após recarregar o estado verificado continua estrelado

  Cenário: Usuário sem conta vinculada
    Dado que não tenho identidade GitHub conectada
    Quando o aside abre
    Então star e watch estão desabilitados com tooltip de conexão e CTA visível

  Cenário: Fonte desapareceu
    Dado que o repo de origem foi apagado do GitHub
    Quando o aside abre
    Então as ações ficam desabilitadas com tooltip informando a indisponibilidade
```

## Bloqueada por

- #08 — aside existe como superfície
- #09 — endpoints de escrita disponíveis

---

[← Anterior: 09](09-github-interaction-endpoints.md) · [issues/README](README.md) · [Próxima: 11 →](11-agendamento-descoberta-automatica.md)
