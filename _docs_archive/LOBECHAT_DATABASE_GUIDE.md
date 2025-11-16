# 🗄️ LobeChat: Bancos de Dados e Recursos

## 📊 Arquitetura de Dados do LobeChat

O LobeChat tem **2 modos de operação**:

### 1️⃣ Modo Cliente (Padrão) - **SEM servidor de banco de dados**

```
┌─────────────────────────────────────────┐
│        Navegador do Usuário              │
│                                          │
│  ┌────────────────────────────────┐    │
│  │       LobeChat Frontend        │    │
│  └───────────┬────────────────────┘    │
│              │                           │
│  ┌───────────▼────────────────────┐    │
│  │    PGLite (PostgreSQL WASM)    │    │
│  │    Roda no NAVEGADOR           │    │
│  │                                 │    │
│  │  • Agentes                      │    │
│  │  • Conversas                    │    │
│  │  • Mensagens                    │    │
│  │  • Configurações                │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Tudo fica LOCALMENTE no navegador!     │
└─────────────────────────────────────────┘
```

**Características:**
- ✅ Sem necessidade de servidor PostgreSQL
- ✅ Sem necessidade de configuração
- ✅ Dados ficam no navegador (privacidade total)
- ✅ Funciona offline
- ⚠️ Dados não sincronizam entre dispositivos
- ⚠️ Se limpar cache do navegador, perde tudo

**Recursos que FUNCIONAM:**
- ✅ Criar agentes
- ✅ Conversas
- ✅ Mensagens
- ❌ RAG / Knowledge Base (precisa servidor)
- ❌ Upload de arquivos permanente (precisa S3)
- ⚠️ File upload temporário (para visão de imagens)

---

### 2️⃣ Modo Servidor - **COM servidor PostgreSQL**

```
┌─────────────────────────────────────────┐
│        Navegador do Usuário              │
│                                          │
│  ┌────────────────────────────────┐    │
│  │       LobeChat Frontend        │    │
│  └───────────┬────────────────────┘    │
│              │ tRPC API                 │
└──────────────┼──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Servidor LobeChat (Next.js)          │
│                                          │
│  ┌────────────────────────────────┐    │
│  │      PostgreSQL + pgvector     │    │
│  │                                 │    │
│  │  • Agentes                      │    │
│  │  • Conversas                    │    │
│  │  • Mensagens                    │    │
│  │  • Embeddings (RAG)             │    │
│  │  • Knowledge Bases              │    │
│  │  • File metadata                │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌────────────────────────────────┐    │
│  │        S3 Storage               │    │
│  │                                 │    │
│  │  • Arquivos dos usuários        │    │
│  │  • Documentos para RAG          │    │
│  │  • Imagens                      │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Características:**
- ✅ Dados sincronizam entre dispositivos
- ✅ RAG / Knowledge Base completo
- ✅ Upload de arquivos permanente
- ✅ Multi-usuário
- ✅ Backup fácil
- ⚠️ Precisa servidor PostgreSQL
- ⚠️ Precisa S3 para arquivos

**Recursos que FUNCIONAM:**
- ✅ Tudo do modo cliente +
- ✅ RAG / Knowledge Base
- ✅ Upload de arquivos permanente
- ✅ Sincronização multi-dispositivo
- ✅ Embeddings e semantic search

---

## 🎯 Pergunta: Posso usar o MESMO banco do backend?

### Resposta: **SIM, mas com schemas separados!**

### Opção 1: Mesmo PostgreSQL, Schemas Separados (✅ RECOMENDADO)

```sql
-- No mesmo PostgreSQL:

CREATE SCHEMA lobechat;  -- Para o LobeChat
CREATE SCHEMA backend;   -- Para seu backend Python

-- Instalar pgvector (para RAG do LobeChat)
CREATE EXTENSION IF NOT EXISTS vector;
```

**Configuração:**

#### Seu Backend Python:
```python
# .env do backend
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb?schema=backend
```

#### LobeChat:
```bash
# .env.local do LobeChat
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb?schema=lobechat
KEY_VAULTS_SECRET=<chave-gerada-com-openssl>

# Para RAG
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=meu-bucket
S3_REGION=us-east-1

# Para embeddings
OPENAI_API_KEY=sk-...
```

**Vantagens:**
- ✅ Um único servidor PostgreSQL
- ✅ Schemas isolados (sem conflito)
- ✅ Backup único
- ✅ Menos custos
- ✅ Gerenciamento simplificado

**Estrutura:**
```
PostgreSQL (mydb)
├── Schema: backend
│   ├── users
│   ├── agents
│   ├── conversations
│   └── ...
│
└── Schema: lobechat
    ├── users
    ├── sessions
    ├── messages
    ├── agents
    ├── files
    ├── chunks (embeddings/RAG)
    └── knowledge_bases
```

---

### Opção 2: Bancos Separados

```bash
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/backend_db

# LobeChat
DATABASE_URL=postgresql://user:pass@localhost:5432/lobechat_db
```

**Vantagens:**
- ✅ Isolamento total
- ✅ Fácil de escalar independentemente

**Desvantagens:**
- ⚠️ Mais complexo gerenciar
- ⚠️ Backup separado
- ⚠️ Dois bancos para monitorar

---

## 🔍 Como Ficam os Recursos do LobeChat?

### 1. RAG / Knowledge Base

**Como funciona NO LobeChat:**

```
1. Usuário faz upload de arquivo (PDF, texto)
2. Arquivo vai para S3
3. LobeChat processa e faz chunking
4. OpenAI gera embeddings (text-embedding-3-small)
5. Embeddings salvos no PostgreSQL (pgvector)
6. Ao perguntar, faz semantic search
7. Chunks relevantes são adicionados ao prompt
```

**Com seu backend:**
Você tem **2 opções**:

#### Opção A: Usar RAG do LobeChat (✅ Recomendado para simplicidade)
```
• LobeChat gerencia upload, chunking, embeddings
• Usa S3 para arquivos
• Usa PostgreSQL + pgvector para embeddings
• Semantic search automático
```

#### Opção B: Usar RAG do seu backend (Google File Search)
```
• Backend gerencia upload para Google
• Google File Search faz indexação
• Ao conversar, backend consulta Google
• Requer modificar código do LobeChat
```

**Recomendação:** Use RAG do LobeChat para arquivos gerais, e Google File Search apenas para casos específicos via tools do agente.

---

### 2. Upload de Arquivos

**Arquitetura Atual do LobeChat:**

```
Frontend → S3 (presigned URL) → LobeChat Backend (registra metadata)
```

**Com seu backend:**

Você pode:

#### Opção A: LobeChat gerencia uploads (✅ Simples)
```bash
# LobeChat .env
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=lobechat-files
```

#### Opção B: Backend gerencia uploads (⚠️ Mais trabalho)
- Modificar endpoints de upload do LobeChat
- Apontar para seu backend
- Backend faz upload e retorna URL

**Recomendação:** Deixe LobeChat gerenciar uploads. É mais simples e já está pronto.

---

### 3. Agentes

**Como está AGORA (após integração):**

```
• Criação: LobeChat cria → Sincroniza para backend
• Chat: Usa backend (/api/agents/chat)
• Edição: LobeChat local + precisa sincronizar
• Deleção: LobeChat local + precisa sincronizar
```

**O que funciona:**
- ✅ Criar agentes (já sincroniza)
- ✅ Conversar (usa backend)
- ⚠️ Editar (precisa adicionar sincronização)
- ⚠️ Deletar (precisa adicionar sincronização)

---

### 4. Configurações, Modelos, Providers

**LobeChat gerencia localmente:**
- Configurações do usuário
- Lista de modelos disponíveis
- API keys dos providers
- Preferências de UI

**Não precisa sincronizar** com backend.

---

## 🎯 Decisão: O que Fazer?

### Cenário 1: **Uso Pessoal / Poucos Usuários**

**Recomendação:** Modo Cliente (Padrão)

```bash
# Sem configuração de banco!
# Apenas:
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://localhost:8001/v1
```

**Por que:**
- ✅ Mais simples
- ✅ Sem custos de servidor PostgreSQL
- ✅ Sem S3 para configurar
- ✅ RAG do backend (Google File Search) já funciona via tools
- ⚠️ Dados ficam no navegador

---

### Cenário 2: **Multi-usuário / Produção / Precisa RAG avançado**

**Recomendação:** Modo Servidor + Mesmo PostgreSQL (schemas separados)

```bash
# LobeChat .env.local
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb?schema=lobechat
KEY_VAULTS_SECRET=<openssl rand -base64 32>

# S3 (para arquivos)
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=lobechat-files
S3_PUBLIC_DOMAIN=https://cdn.seudominio.com

# Embedding (para RAG)
OPENAI_API_KEY=sk-...

# Autenticação customizada
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
NEXT_PUBLIC_CUSTOM_API_BASE_URL=https://api.seudominio.com/v1
```

**Por que:**
- ✅ RAG completo do LobeChat
- ✅ Upload de arquivos permanente
- ✅ Sincronização multi-dispositivo
- ✅ Usa mesmo PostgreSQL (economiza)
- ✅ Isolamento de dados (schemas separados)

---

## 📋 Checklist: Modo Servidor

Se decidir usar modo servidor, precisa:

### 1. PostgreSQL
```bash
# Criar schema para LobeChat
psql -U user -d mydb -c "CREATE SCHEMA IF NOT EXISTS lobechat;"

# Instalar pgvector
psql -U user -d mydb -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 2. Rodar Migrations
```bash
cd /home/ignitor/projects/lobechat-dev
pnpm db:migrate
```

### 3. Configurar S3
```bash
# AWS S3 ou MinIO
# Criar bucket: lobechat-files
# Configurar CORS
```

### 4. Configurar OpenAI (para embeddings)
```bash
OPENAI_API_KEY=sk-...
```

### 5. Gerar KEY_VAULTS_SECRET
```bash
openssl rand -base64 32
```

---

## 💡 Minha Recomendação Específica para Você

### **Use Modo Cliente (Padrão) + Backend Python para Chat**

**Por que:**
1. ✅ **Seu backend JÁ tem RAG** (Google File Search via ADK)
2. ✅ **Seu backend JÁ gerencia agentes**
3. ✅ **Menos complexidade** (sem PostgreSQL adicional)
4. ✅ **Menos custos** (sem S3 separado)
5. ✅ **Já está funcionando!**

**O que você perde:**
- ❌ RAG do LobeChat (mas você tem Google File Search!)
- ❌ Sincronização multi-dispositivo (mas pode adicionar depois)

**Quando migrar para Modo Servidor:**
- Se precisar sincronizar entre dispositivos
- Se quiser RAG duplo (LobeChat + Google)
- Se crescer para multi-usuário corporativo

---

## 🚀 Resumo Executivo

| Feature | Modo Cliente | Modo Servidor |
|---------|--------------|---------------|
| **PostgreSQL** | ❌ Não precisa | ✅ Precisa |
| **S3** | ❌ Não precisa | ✅ Precisa para arquivos |
| **RAG LobeChat** | ❌ Não funciona | ✅ Completo |
| **RAG Backend** | ✅ Funciona | ✅ Funciona |
| **Chat via Backend** | ✅ Funciona | ✅ Funciona |
| **Agentes** | ✅ Local + Backend | ✅ Servidor + Backend |
| **Sincronização** | ❌ Não | ✅ Sim |
| **Complexidade** | 🟢 Baixa | 🟡 Média |
| **Custo** | 🟢 Grátis | 🟡 S3 + hosting |

---

## ✅ Conclusão

**Para sua situação atual:**

1. **Continue usando Modo Cliente** (padrão, sem banco)
2. **Use seu backend para chat** (já implementado)
3. **Use Google File Search para RAG** (via tools do agente)
4. **Se precisar, migre para Modo Servidor depois**

**Arquivos já funcionam** sem PostgreSQL adicional!

Se no futuro precisar de RAG do LobeChat + sincronização multi-dispositivo, aí sim configure PostgreSQL + S3 em modo servidor.

**Não precisa mudar nada agora!** 🎯

