# 🔧 Database Optional Mode - Fix for tRPC 500 Errors

## 🚨 **Problema Original**

Várias rotas tRPC estavam retornando erro 500:

```
/trpc/lambda/message.getMessages
/trpc/lambda/session.getGroupedSessions
/trpc/lambda/topic.getTopics  
/trpc/lambda/plugin.getPlugins
/trpc/lambda/market.getPluginList
```

### **Causa Raiz:**

1. As rotas tentavam acessar `DATABASE_URL` configurado como "fake"
2. `getDBInstance()` tentava conectar ao PostgreSQL fake e falhava
3. Erros 500 em todas as páginas que faziam chamadas tRPC

---

## ✅ **Solução Implementada**

### **1. Database Optional Mode**

Modificado `packages/database/src/core/web-server.ts`:

```typescript
export const getDBInstance = (): LobeChatDatabase => {
  // In test environment, return a mock instance
  if (process.env.NODE_ENV === 'test') return {} as LobeChatDatabase;

  // When using custom backend authentication, database is optional
  // The frontend will use HTTP API instead of local database
  const isCustomAuth = process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1';
  
  if (isCustomAuth) {
    console.log('⚠️  Custom auth enabled - database features disabled');
    return null as any; // Routes will handle null and return empty data
  }

  // ... resto do código original
}
```

### **2. Rotas tRPC Modificadas**

Todas as rotas públicas agora verificam se custom auth está ativo e retornam arrays vazios:

#### **message.getMessages**
```typescript
.query(async ({ input, ctx }) => {
  if (!ctx.userId) return [];
  
  // If custom auth is enabled, return empty (frontend uses custom API)
  if (process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1') {
    return [];
  }
  
  const serverDB = await getServerDB();
  
  // If database is not available, return empty
  if (!serverDB) return [];
  
  // ... código original
}),
```

#### **session.getGroupedSessions**
```typescript
.query(async ({ ctx }): Promise<ChatSessionList> => {
  const userId = ctx.userId;
  if (!userId) return { sessionGroups: [], sessions: [] };

  // If custom auth is enabled, return empty
  if (process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1') {
    return { sessionGroups: [], sessions: [] };
  }

  const serverDB = await getServerDB();
  
  // If database is not available, return empty
  if (!serverDB) return { sessionGroups: [], sessions: [] };
  
  // ... código original
}),
```

#### **topic.getTopics**
```typescript
.query(async ({ input, ctx }) => {
  if (!ctx.userId) return [];

  // If custom auth is enabled, return empty
  if (process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1') {
    return [];
  }

  const serverDB = await getServerDB();
  
  // If database is not available, return empty
  if (!serverDB) return [];
  
  // ... código original
}),
```

#### **plugin.getPlugins**
```typescript
.query(async ({ ctx }): Promise<LobeTool[]> => {
  if (!ctx.userId) return [];

  // If custom auth is enabled, return empty
  if (process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1') {
    return [];
  }

  const serverDB = await getServerDB();
  
  // If database is not available, return empty
  if (!serverDB) return [];
  
  // ... código original
}),
```

### **3. Docker Configuration Atualizada**

Removido `DATABASE_URL` de:

- `docker-compose.prod.yml` (build args)
- `Dockerfile.local` (ARG e ENV)
- `Dockerfile.local.fast` (ARG e ENV)

Não é mais necessário passar `DATABASE_URL=postgresql://fake:fake@localhost:5432/fake`!

---

## 🎯 **Como Funciona Agora**

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                     │
│                                                         │
│  NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1                       │
│  ↓                                                      │
│  getDBInstance() → return null                          │
│  ↓                                                      │
│  tRPC routes → return [] (empty arrays)                 │
│  ↓                                                      │
│  Frontend usa Custom API ao invés de tRPC               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Custom Backend (Python FastAPI)                        │
│                                                         │
│  GET /api/agents          → Lista de agentes            │
│  GET /api/conversations   → Histórico de mensagens      │
│  POST /api/chat           → Enviar mensagem             │
│  GET /api/user/preferences → Preferências do usuário    │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ **Benefícios**

1. **Sem erros 500** nas rotas tRPC
2. **Build mais rápido** (sem necessidade de DATABASE_URL)
3. **Deploy mais simples** (menos variáveis de ambiente)
4. **Código mais limpo** (lógica centralizada)
5. **Flexibilidade** (pode usar backend custom ou PGLite)

---

## 🔧 **Variáveis de Ambiente Finais**

### **Frontend**

```env
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://34.42.168.19:8001/api
KEY_VAULTS_SECRET=<sua-chave>
```

**Não precisa mais de:**
- ❌ `DATABASE_URL`
- ❌ `DATABASE_DRIVER`

### **Backend**

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/orkestrai
JWT_SECRET_KEY=<secret>
OPENAI_API_KEY=sk-...
```

---

## 🐛 **Testing**

Para testar se está funcionando:

```bash
# 1. Build local
cd /home/ignitor/projects/lobechat-dev
docker compose -f docker-compose.prod.yml build

# 2. Start
docker compose -f docker-compose.prod.yml up -d

# 3. Check logs
docker compose -f docker-compose.prod.yml logs -f lobechat

# 4. Verificar no browser
# Abrir: http://136.111.4.62:3210
# Fazer login
# Verificar console do browser (não deve ter erros 500)
```

---

## 📊 **Antes vs Depois**

### **Antes:**
```
❌ tRPC routes: erro 500
❌ DATABASE_URL obrigatório (mesmo que fake)
❌ Build falhava sem DATABASE_URL
❌ Logs cheios de erros de conexão
```

### **Depois:**
```
✅ tRPC routes: retornam arrays vazios
✅ DATABASE_URL opcional
✅ Build funciona sem DATABASE_URL
✅ Sem erros de conexão
✅ Frontend usa Custom API
```

---

## 🚀 **Próximos Passos**

1. ✅ Fazer commit das mudanças
2. ✅ Push para main
3. ✅ Deploy automático via GitHub Actions
4. ✅ Testar no servidor de produção
5. ✅ Verificar se não há mais erros 500

---

## 📝 **Changelog**

**v2.0.0-next.49** (2025-11-18)

- **feat**: Add database optional mode for custom backend auth
- **fix**: tRPC routes return empty arrays when custom auth is enabled
- **fix**: Remove DATABASE_URL requirement from Docker builds
- **refactor**: Simplify database initialization logic
- **docs**: Add TRPC_DATABASE_STRATEGY.md and DATABASE_OPTIONAL_FIX.md

**Breaking Changes:**
- Database features (topics, plugins, local messages) are disabled when `NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1`
- Applications using custom backend must implement their own message/session management

**Migration Guide:**
- Remove `DATABASE_URL` from your `.env` files (when using custom auth)
- Ensure your custom backend implements all required endpoints (agents, messages, sessions, preferences)
- Test tRPC routes to verify they return empty arrays instead of errors

