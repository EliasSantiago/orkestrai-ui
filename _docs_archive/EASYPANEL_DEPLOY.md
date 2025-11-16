# 🚀 Deploy LobeChat no Easypanel

## 🚨 Problemas Identificados

### 1. Conflito de Dependências
```
npm error peer dotenv@"^16.4.5" from @browserbasehq/stagehand
npm error Found: dotenv@17.2.3
```

### 2. Package Manager Errado
O LobeChat usa **pnpm** (monorepo), mas Easypanel está tentando usar **npm**.

### 3. Build Não Completou
Por causa dos erros acima, o build nunca rodou e não há pasta `.next/` para iniciar.

---

## ✅ Solução: Usar Docker

**Recomendação:** Use a imagem Docker oficial do LobeChat em vez de fazer build no Easypanel.

### Opção 1: Docker Hub (✅ Recomendado)

No Easypanel:

1. **Criar App** → **Docker**
2. **Image:** `lobehub/lobe-chat:latest`
3. **Porta:** `3210`
4. **Variáveis de Ambiente:**

```bash
# Autenticação Customizada
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
NEXT_PUBLIC_CUSTOM_API_BASE_URL=https://seu-backend.seudominio.com/v1

# OU se backend está no mesmo servidor
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://backend:8001/v1
```

5. **Deploy!**

---

## 🐳 Opção 2: Build com Docker no Easypanel

### Dockerfile Otimizado

Crie um `Dockerfile` na raiz do projeto:

```dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@9

FROM base AS deps

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

# Install dependencies with legacy peer deps to avoid conflicts
RUN pnpm install --frozen-lockfile --prefer-offline

FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1

# Skip prebuild lint (causes issues in docker)
RUN sed -i 's/"prebuild".*/"prebuild": "tsx scripts\/prebuild.mts",/' package.json

# Build
RUN pnpm run build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3210

# Create user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3210

CMD ["node", "server.js"]
```

### No Easypanel:

1. **Criar App** → **Build from Source**
2. **Repository:** Seu repositório GitHub
3. **Branch:** `main`
4. **Build Method:** Docker
5. **Dockerfile Path:** `./Dockerfile`
6. **Porta:** `3210`
7. **Variáveis de Ambiente:**

```bash
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
NEXT_PUBLIC_CUSTOM_API_BASE_URL=https://seu-backend.com/v1
```

---

## 🔧 Opção 3: Corrigir NPM Build (Não Recomendado)

Se insistir em usar build direto (sem Docker):

### 1. Adicionar `.npmrc`

Crie na raiz:

```
legacy-peer-deps=true
```

### 2. Modificar `package.json`

```json
{
  "scripts": {
    "prebuild": "echo 'Skipping prebuild in production'",
    "build": "next build",
    "start": "next start -p 3210"
  },
  "devDependencies": {
    "dotenv": "16.4.5"
  }
}
```

### 3. No Easypanel

**Build Command:**
```bash
npm install --legacy-peer-deps && npm run build
```

**Start Command:**
```bash
npm start
```

**Variáveis de Ambiente:** (mesmas)

---

## 📋 Configuração Completa no Easypanel

### Usando Docker (Recomendado)

```yaml
# Configuração no Easypanel
name: lobechat
image: lobehub/lobe-chat:latest
port: 3210

environment:
  # Autenticação
  NEXT_PUBLIC_ENABLE_CUSTOM_AUTH: "1"
  NEXT_PUBLIC_CUSTOM_API_BASE_URL: "https://api.seudominio.com/v1"
  
  # Opcional - Se usar modo servidor
  # DATABASE_URL: "postgresql://user:pass@host:5432/db?schema=lobechat"
  # KEY_VAULTS_SECRET: "sua-chave-base64"
  
  # Opcional - S3 para arquivos
  # S3_ACCESS_KEY_ID: "..."
  # S3_SECRET_ACCESS_KEY: "..."
  # S3_BUCKET: "lobechat-files"
  
  # Opcional - OpenAI para embeddings
  # OPENAI_API_KEY: "sk-..."

# Networking
domains:
  - chat.seudominio.com

# Resources
resources:
  memory: 512M
  cpu: 0.5
```

---

## 🔗 Conectar com Backend

Se seu backend também está no Easypanel:

### Backend Service:
```
Nome: backend
Porta: 8001
```

### LobeChat Service:
```yaml
environment:
  NEXT_PUBLIC_CUSTOM_API_BASE_URL: "http://backend:8001/v1"
```

Ou se backend tem domínio próprio:
```yaml
environment:
  NEXT_PUBLIC_CUSTOM_API_BASE_URL: "https://api.seudominio.com/v1"
```

---

## 🐛 Troubleshooting

### Erro: "next: not found"
**Causa:** Build não completou  
**Solução:** Use Docker em vez de build direto

### Erro: "ERESOLVE unable to resolve dependency"
**Causa:** Conflitos de versão  
**Solução:** Use Docker ou adicione `--legacy-peer-deps`

### Erro: "tsx: not found"
**Causa:** Dependências de dev não instaladas  
**Solução:** Use Docker (já vem pronto)

### App não conecta com backend
**Causa:** CORS ou URL errada  
**Solução:** 
```python
# No backend FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://chat.seudominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ✨ Conclusão

**Melhor opção:** Use a **imagem Docker oficial** `lobehub/lobe-chat:latest`

**Por que:**
- ✅ Sem conflitos de dependências
- ✅ Build já otimizado
- ✅ Funciona imediatamente
- ✅ Menos uso de recursos
- ✅ Mais rápido para deployar

**Configuração mínima:**
```yaml
image: lobehub/lobe-chat:latest
port: 3210
environment:
  NEXT_PUBLIC_ENABLE_CUSTOM_AUTH: "1"
  NEXT_PUBLIC_CUSTOM_API_BASE_URL: "https://api.seudominio.com/v1"
```

**Pronto!** 🚀

