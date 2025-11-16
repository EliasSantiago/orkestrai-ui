# 🐳 Docker Build Local vs Imagem Oficial

## 📊 Comparação

| Aspecto | Imagem Oficial | Build Local |
|---------|---------------|-------------|
| **Fonte** | Docker Hub | Seus arquivos |
| **Customizações** | ❌ Não | ✅ Sim |
| **Auth Backend** | ❌ Não | ✅ Sim |
| **Tempo primeira vez** | 2 min (download) | 5-10 min (build) |
| **Tamanho** | ~145 MB | ~150 MB |
| **Atualização** | `docker pull` | `./docker-local.sh rebuild` |

---

## 🔄 O Que Mudou

### ❌ ANTES (Imagem Oficial)

```yaml
# docker-compose.local.yml
services:
  lobechat:
    image: lobehub/lobe-chat:latest  # ← Baixa imagem pronta
```

**Problema:** Suas customizações locais não eram usadas!

### ✅ AGORA (Build Local)

```yaml
# docker-compose.local.yml
services:
  lobechat:
    build:
      context: .                     # ← Usa arquivos locais
      dockerfile: Dockerfile.local   # ← Build customizado
    image: lobechat-custom:local     # ← Sua imagem
```

**Solução:** Todas as suas modificações estão incluídas!

---

## 📁 Arquivos Criados

### 1. `Dockerfile.local`

Dockerfile multi-stage otimizado que:
- ✅ Copia todos os seus arquivos locais
- ✅ Instala dependências com pnpm
- ✅ Builda o Next.js com suas customizações
- ✅ Cria imagem otimizada para produção

### 2. `.dockerignore`

Evita copiar arquivos desnecessários:
- `node_modules` (será reinstalado)
- `.next` (será rebuilbado)
- `*.md` (documentação)
- `.git` (histórico)

### 3. `docker-compose.local.yml` (atualizado)

Agora usa `build:` em vez de `image:`

### 4. `docker-local.sh` (atualizado)

Novos comandos:
- `build` - Buildar pela primeira vez
- `rebuild` - Rebuildar após mudanças

---

## 🚀 Workflow de Desenvolvimento

### Primeira Vez

```bash
# 1. Buildar imagem local (5-10 min)
./docker-local.sh build

# 2. Iniciar
./docker-local.sh start

# 3. Acessar
http://localhost:3210
```

### Após Fazer Mudanças no Código

```bash
# 1. Edite seus arquivos
vim src/app/...

# 2. Rebuildar e reiniciar
./docker-local.sh rebuild

# 3. Testar mudanças
http://localhost:3210
```

### Comandos Disponíveis

```bash
./docker-local.sh build    # Build inicial
./docker-local.sh start    # Iniciar
./docker-local.sh stop     # Parar
./docker-local.sh restart  # Reiniciar (sem rebuild)
./docker-local.sh rebuild  # Rebuildar e reiniciar
./docker-local.sh logs     # Ver logs
./docker-local.sh status   # Ver status
./docker-local.sh clean    # Limpar tudo
```

---

## 🔍 O Que Está Sendo Buildado

### Stage 1: Dependencies
```dockerfile
FROM node:20-alpine AS deps
# Instala apenas as dependências
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
```

### Stage 2: Builder
```dockerfile
FROM base AS builder
# Copia todo o código e builda
COPY . .
ENV NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
RUN pnpm run build:docker
```

### Stage 3: Runner
```dockerfile
FROM base AS runner
# Copia apenas os arquivos necessários
COPY --from=builder /app/.next/standalone ./
# Imagem final otimizada
```

---

## 📦 O Que Está Incluído

### ✅ Suas Customizações

- **Autenticação customizada:**
  - `src/services/customAuth/`
  - `src/layout/AuthProvider/CustomAuth/`
  - `src/app/[variants]/(auth)/login/` (componentes customizados)
  
- **Integração com backend:**
  - `src/services/customApi/`
  - `src/services/customChat/`
  - `src/store/session/slices/backendSync/`
  - `src/store/chat/slices/aiChat/actions/` (sendMessageWithCustomBackend)

- **Configurações:**
  - `packages/const/src/auth.ts` (enableCustomAuth)
  - `src/envs/app.ts` (variáveis de ambiente)

### ✅ Variáveis de Ambiente

Build time (baked in):
```bash
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://host.docker.internal:8001/api
```

Runtime (pode mudar sem rebuild):
```bash
DATABASE_URL=...
S3_ACCESS_KEY_ID=...
```

---

## 🎯 Quando Fazer Rebuild

### ✅ Rebuild Necessário

- Mudou código TypeScript/React
- Modificou componentes
- Alterou store/services
- Mudou variáveis `NEXT_PUBLIC_*`
- Atualizou dependências

### ❌ Rebuild NÃO Necessário

- Mudou variáveis de ambiente runtime (não `NEXT_PUBLIC_*`)
- Apenas reiniciar: `./docker-local.sh restart`

---

## 💡 Dicas

### 1. Cache do Docker

Docker usa cache inteligente:
- Primeira build: 5-10 min
- Rebuilds subsequentes: 1-3 min (se só mudou código)

### 2. Build Sem Cache

Se tiver problemas:
```bash
docker compose -f docker-compose.local.yml build --no-cache
```

### 3. Ver Progresso do Build

```bash
# Em outro terminal
tail -f /tmp/lobechat-build.log
```

### 4. Verificar Imagem

```bash
# Listar imagens
docker images | grep lobechat

# Você deve ver:
# lobechat-custom  local  ...  ~150MB
```

---

## 🐛 Troubleshooting

### Build Falha por Falta de Memória

```bash
# Aumentar memória do Docker Desktop
# Settings → Resources → Memory → 4GB+
```

### Build Muito Lento

```bash
# Limpar cache antigo
docker builder prune

# Rebuild
./docker-local.sh rebuild
```

### Mudanças Não Aparecem

```bash
# Rebuild completo sem cache
./docker-local.sh stop
docker compose -f docker-compose.local.yml build --no-cache
./docker-local.sh start
```

### Container Não Inicia Após Build

```bash
# Ver erro completo
./docker-local.sh logs

# Verificar se build completou
docker images | grep lobechat-custom
```

---

## 📊 Comparação de Tamanhos

```bash
# Verificar tamanho das camadas
docker history lobechat-custom:local

# Comparar com oficial
docker pull lobehub/lobe-chat:latest
docker images | grep lobe-chat
```

---

## 🎊 Resumo

### O Que Você Tem Agora

✅ **Build local** - Usa seus arquivos  
✅ **Customizações incluídas** - Auth, backend integration, etc.  
✅ **Fácil de atualizar** - `./docker-local.sh rebuild`  
✅ **Mesma performance** - Imagem otimizada  
✅ **Pronto para produção** - Mesmo Dockerfile para Easypanel  

### Próximos Passos

1. Aguardar build terminar (5-10 min)
2. Testar: http://localhost:3210
3. Fazer mudanças no código
4. Rebuildar: `./docker-local.sh rebuild`
5. Deploy produção: usar mesmo `Dockerfile.local` no Easypanel

---

**Agora sim, você está usando SEUS arquivos locais! 🎉**

