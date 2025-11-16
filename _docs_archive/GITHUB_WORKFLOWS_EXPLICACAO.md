# 📘 Guia Completo: `.github/workflows/`

## 🎯 O Que É Este Diretório?

`.github/workflows/` contém **GitHub Actions** — automações que rodam no GitHub quando eventos específicos acontecem (push, PR, issue, etc.).

Pense nele como um **robô que trabalha 24/7** automatizando:
- 🚀 Deploys
- 🧪 Testes
- 🌍 Traduções
- 🤖 Respostas com IA
- 📦 Publicações

---

## 📂 ESTRUTURA ORGANIZADA

### 🚀 **1. DEPLOY E PUBLICAÇÃO**

#### `docker.yml` ⭐ PRINCIPAL
**Quando roda:**
- ✅ Quando cria uma release
- ✅ Quando adiciona label `trigger:build-docker` em PR
- ✅ Manualmente (workflow_dispatch)

**O que faz:**
```yaml
1. Build para AMD64 e ARM64 (dois jobs paralelos)
2. Push para Docker Hub (lobehub/lobehub)
3. Cria manifest multi-arquitetura
4. Comenta no PR com info do build

Tags geradas:
- Release: latest, v1.2.3
- PR: pr-branch-name-abc1234
```

**Exemplo real:**
```bash
# Quando você cria release v1.0.0:
→ Gera: lobehub/lobehub:latest
→ Gera: lobehub/lobehub:1.0.0

# Quando adiciona label em PR #123:
→ Gera: lobehub/lobehub:pr-feature-xyz-a1b2c3d
```

---

#### `release.yml`
**Quando roda:** Push na branch `main` ou `next`

**O que faz:**
1. Roda testes completos
2. Gera changelog automaticamente
3. Cria release no GitHub
4. Publica pacotes NPM
5. Atualiza README

**É tipo um "publish button" automático!**

---

#### `release-desktop-beta.yml`
**Quando roda:** Tag `desktop-v*` (ex: `desktop-v1.0.0`)

**O que faz:**
- Build do app Electron
- Gera instaladores (Windows, Mac, Linux)
- Publica release no GitHub

---

### 🧪 **2. TESTES E QUALIDADE**

#### `test.yml` ⭐
**Quando roda:** Em TODOS os pushes e PRs

**O que testa:**
```yaml
1. Packages internos:
   - file-loaders, prompts, model-runtime
   - web-crawler, utils, python-interpreter
   - agent-runtime, conversation-flow
   
2. Aplicação web (cobertura de código)

3. App desktop

4. Database (com PostgreSQL)

5. Upload de coverage para Codecov
```

**Por que é importante:**
- Garante que nada quebra antes de fazer merge
- Mantém qualidade do código
- Detecta bugs automaticamente

---

#### `e2e.yml`
**Quando roda:** PRs importantes

**O que faz:**
- Testes end-to-end (simulação de usuário real)
- Testa fluxos completos (login, chat, etc)
- Usa Playwright

---

#### `lighthouse.yml`
**Quando roda:** PRs e releases

**O que faz:**
- Testa performance da aplicação
- Gera relatório Lighthouse (SEO, acessibilidade, velocidade)
- Comenta no PR com resultados

---

### 🤖 **3. AUTOMAÇÕES COM IA (Claude)**

#### `claude.yml`
**Quando roda:** Quando alguém menciona `@claude` em issue/PR

**O que faz:**
```yaml
1. Claude lê o contexto (código, issues, PRs)
2. Pode rodar comandos: bun, pnpm, vitest, grep
3. Responde com soluções de código
4. Pode criar PRs com correções
```

**Exemplo:**
```markdown
Issue: "Bug no login"
Você comenta: "@claude fix this"
→ Claude analisa código
→ Claude cria PR com correção
```

---

#### `claude-translator.yml`
**Quando roda:** Push em arquivos de locale (`locales/`)

**O que faz:**
- Detecta mudanças em `locales/en-US/`
- Traduz automaticamente para outros idiomas
- Cria PR com traduções

**Magia!** 🌍

---

#### `claude-auto-testing.yml`
**Quando roda:** PRs sem testes

**O que faz:**
- Analisa código do PR
- Gera testes automaticamente
- Comenta sugestões de teste

---

#### `claude-issue-triage.yml`
**Quando roda:** Issue nova

**O que faz:**
- Categoriza issue (bug, feature, question)
- Adiciona labels automaticamente
- Sugere soluções se for bug conhecido

---

#### `claude-translate-comments.yml`
**Quando roda:** Comentário em issue/PR em outro idioma

**O que faz:**
- Detecta idioma
- Traduz para inglês
- Responde em ambos os idiomas

---

### 📝 **4. GERENCIAMENTO DE ISSUES/PRs**

#### `issue-auto-comments.yml`
**Quando roda:** Issue nova

**O que faz:**
- Adiciona mensagem de boas-vindas
- Pede informações necessárias (versão, logs, etc)
- Link para documentação

---

#### `issue-close-require.yml`
**Quando roda:** Issue sem atividade por X dias

**O que faz:**
- Adiciona label `stale`
- Pede atualização
- Fecha automaticamente se não houver resposta

---

#### `issue-auto-close-duplicates.yml`
**Quando roda:** Issue nova

**O que faz:**
- Busca issues similares
- Fecha automaticamente se for duplicada
- Comenta com link para issue original

---

#### `lock-closed-issues.yml`
**Quando roda:** Issue fechada há X dias

**O que faz:**
- Trava issue para não aceitar mais comentários
- Mantém repositório organizado

---

### 🌍 **5. INTERNACIONALIZAÇÃO**

#### `auto-i18n.yml`
**Quando roda:** Diariamente (cron: `0 0 * * *`)

**O que faz:**
```yaml
1. Roda `bun run i18n`
2. Usa OpenAI para traduzir textos novos
3. Atualiza arquivos locales/*.json
4. Cria PR automático: "🤖 style: update i18n"
```

**Por que é útil:**
- Você só precisa atualizar `en-US`
- Outros idiomas são traduzidos automaticamente

---

### 🔄 **6. SINCRONIZAÇÃO**

#### `sync.yml`
**Quando roda:** Push em branches específicas

**O que faz:**
- Sincroniza branches (main → next, etc)
- Mantém branches alinhadas

---

#### `sync-database-schema.yml`
**Quando roda:** Mudanças em schema do banco

**O que faz:**
- Atualiza migrations
- Valida schema Drizzle
- Gera tipos TypeScript

---

### 🖥️ **7. DESKTOP (Electron)**

#### `desktop-pr-build.yml`
**Quando roda:** PR que altera código do desktop

**O que faz:**
- Build do app Electron
- Testa em Windows, Mac, Linux
- Disponibiliza instalador para teste

---

## 🎨 FLUXO TÍPICO DE DESENVOLVIMENTO

### Cenário 1: Nova Feature

```mermaid
1. Você cria branch: feature/nova-funcao
2. Faz commits e abre PR
   ↓
3. test.yml roda automaticamente
   → Testa tudo
   → Comenta no PR com resultados
   ↓
4. claude-auto-testing.yml
   → Sugere testes se faltar
   ↓
5. lighthouse.yml
   → Testa performance
   ↓
6. Você adiciona label: trigger:build-docker
   ↓
7. docker.yml
   → Build de imagem Docker
   → Comenta: "Imagem pronta: pr-feature-nova-funcao-abc123"
   → Você pode testar!
   ↓
8. Merge do PR
   ↓
9. release.yml
   → Cria release
   → Atualiza changelog
   ↓
10. docker.yml
    → Publica: lobehub/lobehub:latest
```

---

### Cenário 2: Bug Report

```mermaid
1. Usuário abre issue: "Login quebrado"
   ↓
2. claude-issue-triage.yml
   → Adiciona label: bug
   → Categoriza: high-priority
   ↓
3. issue-auto-comments.yml
   → Comenta: "Obrigado! Pode compartilhar logs?"
   ↓
4. Você comenta: "@claude fix this"
   ↓
5. claude.yml
   → Claude analisa código
   → Identifica problema
   → Cria PR com correção
   ↓
6. test.yml
   → Valida correção
   ↓
7. Merge → Release automático
```

---

### Cenário 3: Tradução

```mermaid
1. Você atualiza: locales/en-US/common.json
   ↓
2. Push para branch
   ↓
3. claude-translator.yml
   → Detecta mudança em en-US
   → Traduz para: pt-BR, zh-CN, es-ES, etc
   → Cria PR automático
   ↓
4. Você revisa e faz merge
```

---

## 🔑 VARIÁVEIS NECESSÁRIAS (Secrets)

Alguns workflows precisam de **secrets** configurados no GitHub:

```yaml
# Docker
DOCKER_REGISTRY_USER     # Usuário Docker Hub
DOCKER_REGISTRY_PASSWORD # Senha Docker Hub

# Claude/OpenAI
CLAUDE_CODE_OAUTH_TOKEN  # Token do Claude
OPENAI_API_KEY           # Para traduções

# GitHub
GH_TOKEN                 # Token com permissões especiais
NPM_TOKEN                # Para publicar pacotes

# Testes
CODECOV_TOKEN            # Para relatórios de cobertura
BUN_VERSION              # Versão do Bun
```

---

## 🎯 RESUMO VISUAL

| Workflow | Quando Roda | Finalidade | Tempo |
|----------|-------------|------------|-------|
| `docker.yml` | Release/PR com label | 🚀 Deploy Docker | 15-20 min |
| `release.yml` | Push main/next | 📦 Release automático | 10 min |
| `test.yml` | Todos pushes/PRs | 🧪 Testes | 5-10 min |
| `claude.yml` | Mention @claude | 🤖 Assistência IA | Variável |
| `auto-i18n.yml` | Diário (00:00 UTC) | 🌍 Traduções | 5 min |
| `lighthouse.yml` | PRs importantes | 📊 Performance | 3 min |
| `e2e.yml` | PRs | 🎭 Testes E2E | 8 min |
| `issue-*` | Issues | 🏷️ Gerenciamento | Instantâneo |

---

## 🛠️ COMO USAR NO SEU PROJETO

### ⚠️ IMPORTANTE

**Esses workflows são do LobeChat original!**

Se você quer usar no **SEU fork customizado**:

### ❌ Não vai funcionar direto porque:
1. Apontam para `lobehub/lobehub` (Docker Hub)
2. Precisam de secrets que você não tem
3. Tem features que você não usa (Electron desktop, etc)

### ✅ O que você PODE fazer:

#### 1. **Desabilitar workflows não usados**
```bash
cd /home/ignitor/projects/lobechat-dev/.github/workflows

# Criar diretório _disabled
mkdir -p _disabled

# Mover workflows que não usa
mv desktop-*.yml _disabled/
mv claude-*.yml _disabled/
mv release-desktop-beta.yml _disabled/
```

---

#### 2. **Adaptar docker.yml para seu projeto**

Criar `.github/workflows/docker-custom.yml`:

```yaml
name: Build Custom Docker

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      
      - name: Login Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USER }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and Push
        run: |
          docker build -f Dockerfile.local \
            --build-arg NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1 \
            --build-arg NEXT_PUBLIC_CUSTOM_API_BASE_URL=${{ secrets.CUSTOM_API_URL }} \
            --build-arg KEY_VAULTS_SECRET=${{ secrets.KEY_VAULTS_SECRET }} \
            -t seu-usuario/lobechat-custom:latest .
          
          docker push seu-usuario/lobechat-custom:latest
```

---

#### 3. **Manter apenas testes básicos**

Simplificar `test.yml` para rodar apenas seus testes:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
      
      - name: Install
        run: bun i
      
      - name: Lint
        run: bun run lint
      
      - name: Test
        run: bun run test-app
```

---

## 📖 DOCUMENTAÇÃO OFICIAL

- **GitHub Actions:** https://docs.github.com/actions
- **Docker Actions:** https://github.com/marketplace?type=actions&query=docker
- **Vitest:** https://vitest.dev
- **Playwright:** https://playwright.dev

---

## 🤔 PERGUNTAS FREQUENTES

### 1. "Preciso de todos esses workflows?"

**Não!** Para seu projeto customizado, você só precisa de:
- `test.yml` (básico)
- Seu próprio `docker-custom.yml`
- Talvez `auto-i18n.yml` se usar múltiplos idiomas

### 2. "Os workflows vão rodar automaticamente?"

**Sim**, mas muitos vão falhar porque:
- Não tem secrets configurados
- Apontam para repositório original

**Solução:** Desabilite ou customize!

### 3. "Como desabilitar um workflow?"

```bash
# Opção 1: Mover para _disabled/
mv .github/workflows/claude.yml .github/workflows/_disabled/

# Opção 2: Adicionar condição que nunca é true
# No workflow, adicionar:
if: false
```

### 4. "Workflows consomem minutos do GitHub?"

**Sim!** GitHub dá 2000 min/mês grátis.

**Dica:** Desabilite workflows não essenciais para economizar.

---

## 🎯 RECOMENDAÇÃO PARA SEU PROJETO

### ✅ MANTER:
- `test.yml` (simplificado)

### ❌ DESABILITAR:
- Todos os `claude-*` (não tem secrets)
- Todos os `desktop-*` (não usa Electron)
- `release.yml` (é do LobeChat original)
- `docker.yml` (aponta para lobehub/lobehub)

### 🔄 CRIAR NOVO:
- `docker-custom.yml` (seu deploy)
- `deploy-production.yml` (seu servidor)

---

## 🚀 PRÓXIMOS PASSOS

1. **Revisar workflows** → Entender quais você precisa
2. **Desabilitar não usados** → Economizar recursos
3. **Criar workflows customizados** → Para seu fluxo
4. **Configurar secrets** → Se precisar de automações

---

## 📝 RESUMO FINAL

**`.github/workflows/` = Automação Total**

- 🤖 **20 workflows** automatizando tudo
- 🚀 **Deploy** automático no Docker Hub
- 🧪 **Testes** em cada PR
- 🌍 **Traduções** diárias com IA
- 🤖 **Claude** respondendo issues
- 📦 **Releases** automáticas

**É como ter uma equipe DevOps trabalhando 24/7!**

---

**Criado:** Novembro 15, 2025  
**Versão:** 1.0  
**Autor:** Análise do LobeChat  
**Última atualização:** 2025-11-15

