# 🚀 Quick Start - Integração LobeChat + Backend

## ⚡ Início Rápido (5 minutos)

### 1. Configurar

```bash
# No diretório do LobeChat
echo "NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1" > .env.local
echo "NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://localhost:8001/v1" >> .env.local
```

### 2. Iniciar Backend

```bash
# Terminal 1 - Backend Python
python main.py
# ou
uvicorn main:app --reload --port 8001
```

### 3. Iniciar LobeChat

```bash
# Terminal 2 - LobeChat
pnpm dev
```

### 4. Testar

1. **Login**: http://localhost:3210/login
2. **Criar Agente**: Clique em "+" → Configure → Salve
3. **Conversar**: Selecione agente → Envie mensagem
4. **Verificar**: Abra Console do navegador (F12) → veja logs `[CustomChat]`

## 📝 Variáveis de Ambiente

### LobeChat (.env.local)
```bash
# OBRIGATÓRIO
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1

# OPCIONAL (padrão: http://localhost:8001/v1)
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://seu-backend.com/v1
```

### Backend Python (.env)
```bash
# JWT
SECRET_KEY=sua-chave-secreta-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=postgresql://user:pass@localhost/dbname

# LiteLLM
OPENAI_API_KEY=sk-...
# ou outras keys que você usa

# S3 (para upload de arquivos - futuro)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=seu-bucket
```

## 🔍 Verificação Rápida

### ✅ Backend está rodando?
```bash
curl http://localhost:8001/v1/health
# Esperado: {"status": "ok"}
```

### ✅ Login funciona?
```bash
curl -X POST http://localhost:8001/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "senha"}'
# Esperado: {"access_token": "...", "token_type": "bearer"}
```

### ✅ Token é válido?
```bash
TOKEN="seu-token-aqui"
curl http://localhost:8001/v1/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
# Esperado: {"id": 1, "email": "...", ...}
```

## 🐛 Troubleshooting Rápido

### Problema: "Not authenticated"
```javascript
// No console do browser (F12)
localStorage.getItem('custom_auth_access_token')
// Se null → faça login novamente
```

### Problema: "Failed to fetch"
- ✅ Backend está rodando? (porta 8001)
- ✅ CORS configurado no backend?
```python
# backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3210"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Problema: Chat não usa backend
- Abra console (F12)
- Procure por: `[CustomChat]`
- Se não aparecer:
  - ✅ `NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1` está no .env.local?
  - ✅ Agente foi criado DEPOIS do login?
  - ✅ Refresh da página após criar .env.local?

## 📊 Logs Importantes

### Console do Browser (F12)
```
[CustomAuth] Login successful ✅
[BackendSync] Agent synced to backend: {...} ✅
[CustomChat] Using custom backend for agent: 42 ✅
[CustomChat] Response received: ... ✅
```

### Terminal do Backend
```
INFO: POST /api/auth/login
INFO: POST /api/agents
INFO: POST /api/agents/chat
```

## 🎯 Upload de Arquivos - Resposta Direta

### ❓ Deve partir do LobeChat ou do Backend?

**Resposta: HÍBRIDO (Backend gera URL, Frontend faz upload)**

### ✅ Por que?
1. **Não sobrecarrega backend** - Arquivos grandes não passam pelo Python
2. **Mais rápido** - Upload direto para S3
3. **Seguro** - Backend controla quem pode fazer upload (presigned URLs)
4. **Econômico** - Menos banda e memória no servidor Python

### 📦 Implementação (Adicionar no Futuro)

#### Backend
```python
@router.post("/api/files/upload-url")
async def get_upload_url(filename: str, content_type: str):
    # Gera URL assinada válida por 5 min
    url = s3.generate_presigned_url(...)
    return {"upload_url": url, "file_key": key}
```

#### LobeChat
```typescript
// 1. Pede URL ao backend
const {upload_url, file_key} = await api.getUploadUrl(file.name)

// 2. Upload DIRETO para S3
await fetch(upload_url, {method: 'PUT', body: file})

// 3. Notifica backend
await api.confirmUpload(file_key)
```

### 🚫 NÃO Recomendado
```
Frontend → Backend → S3  ❌ (Consome muita RAM do backend)
Frontend → S3 (credenciais no frontend) ❌ (INSEGURO)
```

## 📚 Documentação Completa

Arquivo | Conteúdo
---|---
[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) | 📋 Resumo completo + fluxos
[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) | 🔧 Guia técnico detalhado
[INTEGRATION_STATUS.md](./INTEGRATION_STATUS.md) | ✅ Status + checklist
[CUSTOM_AUTH_SETUP.md](./CUSTOM_AUTH_SETUP.md) | 🔐 Setup de autenticação
[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | 🚀 Checklist para produção

## ⚡ Comandos Úteis

```bash
# Limpar cache do Next.js
rm -rf .next

# Reinstalar dependências
pnpm install

# Verificar tipos TypeScript
pnpm type-check

# Ver logs em tempo real (backend)
tail -f logs/app.log

# Testar endpoint específico
curl -X POST http://localhost:8001/v1/api/agents/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agent_id": 1, "message": "Olá!"}'
```

## ✨ Está Pronto!

A integração está **completa e funcional**. Você pode:
- ✅ Fazer login/logout
- ✅ Criar agentes (sincronizam automaticamente)
- ✅ Conversar via seu backend Python
- ✅ Usar o poder do LiteLLM + ADK Google

**Próximo passo:** Implementar upload de arquivos (quando necessário)

