# 🚀 Otimizações de Deploy - GitHub Actions

## 📊 Problemas Identificados

### Antes das Otimizações:
- ⏱️ **Tempo de deploy**: 15-25 minutos
- 💾 **Sem cache**: Rebuild completo toda vez
- 🔄 **Dependências**: Instaladas do zero a cada deploy
- 🐌 **Docker build**: Sem cache de layers
- 📦 **pnpm store**: Não reutilizado entre builds

## ✅ Otimizações Implementadas

### 1. Cache do Docker BuildKit

**Antes**:
```yaml
# Sem cache - rebuild completo toda vez
docker compose build
```

**Depois**:
```yaml
# Cache de layers Docker
- name: Cache Docker layers
  uses: actions/cache@v4
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-

# Build com cache
docker compose build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from orkestrai-ui:latest
```

**Benefício**: Reduz tempo de build em 60-80% quando há cache

### 2. Cache do pnpm Store

**Antes**:
```yaml
# Sem cache - download de todos os pacotes toda vez
```

**Depois**:
```yaml
- name: Cache pnpm store
  uses: actions/cache@v4
  with:
    path: ~/.local/share/pnpm/store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml', '**/package.json') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-
```

**Benefício**: Reduz tempo de instalação de dependências em 70-90%

### 3. Cache Mounts no Dockerfile

**Antes**:
```dockerfile
RUN pnpm install --no-frozen-lockfile --prefer-offline
```

**Depois**:
```dockerfile
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile --prefer-offline
```

**Benefício**: Reutiliza pacotes entre builds Docker (mesmo no servidor)

### 4. Build Paralelo

**Antes**:
```yaml
docker compose build
```

**Depois**:
```yaml
docker compose build --parallel
```

**Benefício**: Builds múltiplos serviços em paralelo (se houver)

### 5. Limpeza Inteligente de Cache

**Antes**:
```yaml
docker image prune -af  # Remove tudo
```

**Depois**:
```yaml
# Mantém últimas 2 versões
docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep "orkestrai-ui" | tail -n +3 | awk '{print $2}' | xargs -r docker rmi || true

# Limpa apenas cache antigo (>24h)
docker image prune -af --filter "until=24h"
docker builder prune -af --filter "until=24h"
```

**Benefício**: Mantém cache útil, remove apenas o antigo

### 6. Shallow Clone

**Antes**:
```yaml
git clone "https://github.com/..."
```

**Depois**:
```yaml
- name: Checkout code
  uses: actions/checkout@v4
  with:
    fetch-depth: 1  # Shallow clone
```

**Benefício**: Checkout mais rápido (menos histórico Git)

## 📈 Resultados Esperados

### Primeiro Deploy (sem cache):
- ⏱️ **Tempo**: 15-20 minutos (igual ao anterior)
- 💾 **Espaço**: ~8-12 GB

### Deploys Subsequentes (com cache):

#### Se apenas código mudou:
- ⏱️ **Tempo**: 3-5 minutos (vs 15-20 min) ⚡ **70-80% mais rápido**
- 💾 **Espaço**: ~2-3 GB adicional

#### Se apenas dependências mudaram:
- ⏱️ **Tempo**: 5-8 minutos (vs 15-20 min) ⚡ **60-70% mais rápido**
- 💾 **Espaço**: ~3-4 GB adicional

#### Se nada mudou (rebuild):
- ⏱️ **Tempo**: 1-2 minutos (vs 15-20 min) ⚡ **90% mais rápido**
- 💾 **Espaço**: ~500 MB adicional

## 🔧 Como Funciona

### Fluxo de Cache:

```
1. GitHub Actions:
   ├── Cache Docker layers → /tmp/.buildx-cache
   ├── Cache pnpm store → ~/.local/share/pnpm/store
   └── Shallow clone → código

2. Servidor Remoto:
   ├── Docker BuildKit cache mount → /root/.local/share/pnpm/store
   ├── Cache de layers Docker → orkestrai-ui:latest
   └── Build incremental → apenas o que mudou
```

### Estratégia de Cache:

1. **Primeiro build**: Sem cache, build completo
2. **Builds seguintes**: 
   - Se `package.json` não mudou → usa cache de dependências
   - Se código não mudou → usa cache de build
   - Se nada mudou → usa cache completo

## 🎯 Melhorias Adicionais Recomendadas

### 1. Build no GitHub Actions (Opcional - Mais Complexo)

**Vantagem**: Build mais rápido (máquinas GitHub Actions são mais potentes)

**Desvantagem**: Requer Docker registry (Docker Hub, GCR, etc.)

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ghcr.io/${{ github.repository }}:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### 2. Usar Dockerfile.local.fast

O `Dockerfile.local.fast` já tem otimizações de cache. Considere usá-lo:

```yaml
dockerfile: Dockerfile.local.fast
```

### 3. Multi-stage Build Otimizado

O `Dockerfile.local.fast` já implementa:
- Stage separado para dependências
- Cache de layers inteligente
- Imagem final mínima

## 📝 Notas Importantes

1. **Cache do GitHub Actions**: Limitado a 10 GB por repositório
2. **Cache do Docker**: Mantido no servidor (limpeza automática após 24h)
3. **Cache do pnpm**: Mantido no GitHub Actions (persiste entre runs)
4. **Primeiro deploy**: Sempre será mais lento (sem cache)

## 🚨 Troubleshooting

### Cache não está funcionando?

1. Verifique se BuildKit está habilitado:
   ```bash
   export DOCKER_BUILDKIT=1
   export COMPOSE_DOCKER_CLI_BUILD=1
   ```

2. Verifique se cache mount está disponível:
   ```bash
   docker buildx version
   ```

3. Limpe cache e rebuild:
   ```bash
   docker builder prune -af
   docker compose build --no-cache
   ```

### Deploy ainda está lento?

1. Verifique se há mudanças grandes no código
2. Verifique se dependências mudaram (`package.json`)
3. Considere usar `Dockerfile.local.fast` para melhor cache

## 📊 Monitoramento

Para monitorar o impacto das otimizações:

```bash
# No servidor, após deploy:
docker images | grep orkestrai-ui
docker system df
```

Observe:
- Tamanho das imagens
- Espaço usado pelo Docker
- Tempo de build nos logs do GitHub Actions

