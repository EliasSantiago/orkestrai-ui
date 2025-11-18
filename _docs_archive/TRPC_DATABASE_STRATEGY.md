# 🔧 Estratégia tRPC + Database Custom Backend

## 🚨 **Problema Identificado**

As seguintes rotas tRPC estão falhando com erro 500:

```
/trpc/lambda/message.getMessages
/trpc/lambda/market.getPluginList
/trpc/lambda/topic.getTopics
/trpc/lambda/session.getGroupedSessions
/trpc/lambda/plugin.getPlugins
```

### **Por que estão falhando?**

1. Essas rotas dependem do `DATABASE_URL` para acessar PostgreSQL/PGLite
2. O `DATABASE_URL` está configurado como `postgresql://fake:fake@localhost:5432/fake`
3. Quando o Next.js tenta fazer SSR/pre-render, essas rotas tentam conectar ao banco e falham

---

## 📊 **Análise das Rotas tRPC**

### **Categorias de Funcionalidades:**

| Funcionalidade | Rotas tRPC | Uso | Estratégia Recomendada |
|---------------|-----------|-----|----------------------|
| **Mensagens** | `message.*` | Histórico de chat, CRUD de mensagens | ✅ **Backend** (já implementado) |
| **Sessões** | `session.*` | Gerenciar sessões de chat | ✅ **Backend** (já implementado) |
| **Agentes** | `agent.*` | CRUD de agentes | ✅ **Backend** (já implementado) |
| **Tópicos** | `topic.*` | Organizar mensagens por tópicos | ❌ **Desabilitar** (não essencial) |
| **Plugins** | `plugin.*` | Plugins instalados localmente | ❌ **Desabilitar** (não usado) |
| **Market** | `market.*` | Marketplace de assistentes/plugins | ❌ **Desabilitar** (não usado) |
| **Usuário** | `user.*` | Preferências e configurações | ✅ **Backend** (já implementado) |

---

## ✅ **Solução Implementada**

### **1. Desabilitar tRPC Database em Produção**

Quando `NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1`, o frontend:
- ✅ Usa API do backend para: mensagens, sessões, agentes, preferências
- ❌ Não usa tRPC para funcionalidades locais (topics, plugins, market)
- ✅ Retorna arrays vazios para rotas não essenciais

### **2. Modificar `getDBInstance()` para permitir modo "custom backend"**

```typescript
// packages/database/src/core/web-server.ts
export const getDBInstance = (): LobeChatDatabase => {
  // Se custom auth está ativo, não inicializar banco
  if (process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1') {
    return null as any; // Retorna null (será tratado nas rotas)
  }
  
  // ... resto do código original
}
```

### **3. Modificar rotas tRPC para retornar vazio quando não há DB**

```typescript
// src/server/routers/lambda/message.ts
getMessages: publicProcedure
  .input(...)
  .query(async ({ input, ctx }) => {
    // Se custom auth, retornar vazio (frontend usa API)
    if (process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1') {
      return [];
    }
    
    // Código original...
  }),
```

---

## 🎯 **Funcionalidades no Seu Backend**

### **✅ Já Implementadas:**

1. **Autenticação** (`/api/auth/*`)
   - Login, registro, JWT tokens

2. **Agentes** (`/api/agents/*`)
   - CRUD de agentes custom

3. **Conversações** (`/api/conversations/*`)
   - Histórico de mensagens
   - Chat com agentes

4. **Preferências** (`/api/user/preferences`)
   - Theme, language, settings

### **❌ Não Necessárias (podem ficar desabilitadas):**

1. **Topics** - Organização secundária de mensagens
2. **Plugins** - Sistema de plugins local (não usado)
3. **Market** - Marketplace de assistentes (usa o público)
4. **File Upload** - Usa S3 direto ou backend
5. **RAG/Knowledge Base** - Se não usar, desabilitar

---

## 🔧 **Próximos Passos**

1. ✅ Modificar `getDBInstance()` para permitir "no database mode"
2. ✅ Modificar rotas tRPC essenciais para retornar vazio
3. ✅ Testar deploy e verificar erros 500
4. ✅ Documentar funcionalidades habilitadas/desabilitadas

---

## 📝 **Variáveis de Ambiente Finais**

### **Frontend (`docker-compose.prod.yml`):**

```yaml
environment:
  NEXT_PUBLIC_ENABLE_CUSTOM_AUTH: 1
  NEXT_PUBLIC_CUSTOM_API_BASE_URL: http://34.42.168.19:8001/api
  KEY_VAULTS_SECRET: ${KEY_VAULTS_SECRET}
  # DATABASE_URL não é mais necessário!
```

### **Backend (Python):**

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/orkestrai
JWT_SECRET_KEY=<secret>
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=<para file search>
```

---

## ✅ **Resumo da Estratégia**

```
┌─────────────────┐          HTTP API           ┌──────────────────┐
│  LobeChat UI    │─────────────────────────────▶│  Python Backend  │
│  (Next.js)      │                              │  (FastAPI)       │
│                 │  ✅ Agents                   │                  │
│  - PGLite: ❌   │  ✅ Messages/Sessions        │  - PostgreSQL ✅ │
│  - tRPC: ❌     │  ✅ User Preferences         │  - Alembic ✅    │
│  - Local DB: ❌ │  ✅ Authentication           │  - JWT Auth ✅   │
└─────────────────┘                              └──────────────────┘
```

**Benefícios:**
- ✅ Dados centralizados no backend
- ✅ Sincronização automática entre dispositivos
- ✅ Backup e segurança controlados
- ✅ Sem necessidade de banco local no frontend
- ✅ Deploy mais simples (sem migrations no frontend)

---

## 🐛 **Debugging**

Se ainda houver erros 500, verificar:

```bash
# No servidor
cd ~/chat-ui
docker compose -f docker-compose.prod.yml logs --tail=100 lobechat | grep "Error"

# Procurar por:
# - "DATABASE_URL" errors
# - "getDBInstance" errors  
# - tRPC path errors
```

