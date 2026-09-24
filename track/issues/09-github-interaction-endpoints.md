---
type: Issue
title: "09 — Requests de interação (star, watch, follow) com escopo elevado"
description: "Adiciona à integration-github os endpoints de escrita para ações de apoio ao criador, com escopo OAuth elevado."
tags: [integration-github, issue, endpoints, interação]
status: proposed
generated:
  by: human:GabrielFVDev
  at: 2026-09-16T00:00:00Z
---
# 09 — feat(integration-github): requests de interação (star, watch, follow) com escopo elevado

**Labels (GitHub):** `type:feat` · `mod:integration-github` · `difficulty:medium`
**Status:** ready-for-agent

## Contexto

A integração GitHub da plataforma hoje é **somente leitura** (users, PRs, issues, commits — 10 requests GET). Nenhuma ação em nome do usuário existe. Para valorizar criadores de trilhas dentro do site (#10), precisamos dos verbos de escrita mapeados na pesquisa:

| Ação | Verbos GitHub |
|---|---|
| Estrelar repo | `PUT` / `DELETE /user/starred/{owner}/{repo}` + check `GET` |
| Watch (inscrever-se) | `PUT` / `DELETE /repos/{owner}/{repo}/subscription` + check `GET` |
| Seguir pessoa | `PUT` / `DELETE /user/following/{username}` + check `GET` |

Dois detalhes estruturais:

1. **Token por requisição**: as ações acontecem em nome do usuário logado — o token vem da `ExternalIdentity` dele (credenciais descriptografadas), não do token global da integração. O padrão de override por request já existe nesta integration (`GetCurrentUser`) e deve ser seguido.
2. **Escopos insuficientes**: os escopos atuais (`read:user`, `user:email`) não permitem star/watch/follow. É preciso adicionar `public_repo` e `user:follow` à configuração de scopes.

## O que construir

- Requests Saloon em `Transport/Requests/Interactions/`, um par por operação seguindo a tabela acima:
  - `StarRepositoryRequest`, `UnstarRepositoryRequest`, `GetStarredStatusRequest`
  - `WatchRepositoryRequest`, `UnwatchRepositoryRequest`, `GetWatchStatusRequest`
  - `FollowUserRequest`, `UnfollowUserRequest`, `GetFollowStatusRequest`
  - Todos aceitando token por requisição no padrão existente
- Semântica dos checks: `GET` devolve `204` quando ativo e `404` quando inativo — encapsular isso num retorno booleano claro para o domínio
- Actions wrappers finas (ex.: `StarRepositoryAction`) no estilo das actions já existentes da integration, para que panel-app nunca monte URL
- Config: acrescentar `public_repo` e `user:follow` aos scopes em `services.github.scopes`
- Nota de migração documentada na issue: conexões antigas foram feitas sem os novos escopos — usuários precisarão reconectar (re-consent) para interagir; a UI trata token insuficiente como estado neutro (#10)
- Testes MockClient cobrindo sucesso (`204`/`200`), check negativo (`404`) e `401` de token expirado sinalizado como erro tratável (não exceção crua)

## Critérios de aceite

- [ ] Os 9 requests existem, aceitam token por requisição e usam os endpoints corretos
- [ ] Checks booleanos traduzem 204/404 corretamente
- [ ] Actions wrappers disponíveis; nenhum consumidor monta endpoint
- [ ] Scopes novos configurados e refletidos nos testes de OAuth
- [ ] Token expirado produz erro tipado tratável
- [ ] Testes MockClient cobrindo os três cenários por família de operação

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Interações de escrita no GitHub em nome do usuário

  Cenário: Estrelar uma trilha
    Dado um token válido do usuário autenticado
    Quando a ação de estrela roda contra "he4rt/css4noobs"
    Então um PUT é enviado ao endpoint de starred com aquele token
    E a resposta 204 é interpretada como sucesso

  Cenário: Verificar se já estrelou
    Dado que a API responde 404 para o check
    Então o status retornado é "não estrelado"

  Cenário: Token sem permissão nova
    Dado uma conexão feita antes dos novos escopos
    Quando qualquer interação tenta executar
    Então um erro tipado de credencial inválida é retornado
    E nenhuma exceção crua escapa para a UI
```

## Bloqueada por

Nada — pode começar imediatamente (paralela ao ETL).

---

[← Anterior: 08](08-panel-app-detalhe-leitor.md) · [Índice das issues](index.md) · [Próxima: 10 →](10-panel-app-acoes-github-ui.md)
