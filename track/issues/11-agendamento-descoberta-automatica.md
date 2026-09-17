# 11 — feat(tracks): agendamento do sync + descoberta automática de novas trilhas

**Labels (GitHub):** `type:feat` · `mod:tracks` · `difficulty:small`
**Status:** ready-for-agent

## Contexto

Até aqui o sync (`tracks:sync`) é manual — adequado para a fase 1. Para o catálogo ficar vivo sem esforço operacional, ele precisa rodar agendado, e a **descoberta** (capability `DiscoversTrackSources` do ticket #03) precisa fazer parte da mesma execução. **Escopo v3 (agregador, ADR 0005 E-D4):** quando a comunidade anuncia uma trilha nova no README central, ela é proposta como pendente no painel e não nasce publicada — gate de curadoria (admin aprova/publica via allowlist `purpose=Tracks` + `tracks.status`). Nenhuma lógica nova de descoberta é necessária — só orquestração, proposição e proteção.

## O que construir

- Agendamento do `tracks:sync` com intervalo configurável via `config('tracks.sync.interval_minutes')` (default 1 semana), registrado no ServiceProvider
- **Sync manual no painel**: ação "Sincronizar agora" no `GithubRepositoryResource` (Filament) dispara `tracks:sync` para o track — execução manual tem precedência sobre a agendada
- Lock de cache anti-sobreposição: execução agendada não inicia se a anterior ainda roda; execução manual (`php artisan tracks:sync`) sempre tem precedência e pode coexistir com política explícita documentada
- Descoberta embutida na mesma execução: novos `{topic}4noobs` descobertos entram como trilhas **pendentes de publicação** (reuso direto do fluxo dos tickets #04–#05); nenhuma trilha nasce `active` sem aprovação
- Observabilidade por execução: log estruturado com descobertas, trilhas atualizadas, aulas alteradas e falhas parciais por fonte
- Flag `--force` (refresh completo de working copies) disponível também na execução manual
- Webhook de push do GitHub **fora do escopo** deste ticket — registrado como próximo passo natural no ADR

## Critérios de aceite

- [ ] Sync roda no intervalo configurado sem intervenção
- [ ] Duas execuções nunca se sobrepõem (lock provado em teste)
- [ ] Trilha nova anunciada no README central aparece como **pendente de publicação** após a passada seguinte, sem deploy nem comando manual
- [ ] Publicar descoberta exige ação do admin (gate de curadoria) — descoberta nunca auto-publica
- [ ] Falha parcial numa fonte não bloqueia a próxima execução agendada
- [ ] Log de execução permite auditar o que mudou

## Teste

### BDD

```gherkin
# language: pt
Funcionalidade: Catálogo vivo por agendamento

  Cenário: Execuções não se sobrepõem
    Dado que uma sincronização agendada está em andamento
    Quando o scheduler dispara novamente
    Então a nova execução é ignorada pelo lock

  Cenário: Nova trilha é proposta, não publicada
    Dado que "{topic}4noobs" foi adicionado ao README central
    Quando a próxima execução agendada roda
    Então a trilha nasce no catálogo como pendente de publicação
    E continua oculta da listagem até o admin aprovar

  Cenário: Falha parcial não trava o ciclo
    Dado que a API falhou para uma fonte na última execução
    Quando a execução seguinte acontece
    Então as demais fontes são processadas normalmente
```

## Bloqueada por

- #04 — provider de descoberta funcionando

---

[← Anterior: 10](10-panel-app-acoes-github-ui.md) · [issues/README](README.md)
