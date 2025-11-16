# 🔧 Guia de Configuração de Variáveis de Ambiente

## 📋 Visão Geral

Este guia explica **TODAS** as variáveis de ambiente necessárias para rodar o LobeChat integrado com seu backend Python.

---

## 🌍 Variáveis de Ambiente

### **Frontend (LobeChat)**

Arquivo: `.env.production` ou `.env.docker.prod`

```env
# ============================================
# Backend API Configuration
# ============================================

# URL do seu backend Python (OBRIGATÓRIO)
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://34.42.168.19:8001/api

# Habilitar autenticação customizada (OBRIGATÓRIO)
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1

# ============================================
# Security & Encryption
# ============================================

# Chave secreta para criptografia de dados sensíveis (OBRIGATÓRIO)
# IMPORTANTE: Deve ser a MESMA do backend!
# Gerar com: openssl rand -base64 32
KEY_VAULTS_SECRET=<sua-chave-secreta-aqui>

# ============================================
# Build Configuration
# ============================================

# DATABASE_URL "fake" apenas para o build do Next.js
# NÃO é usado em runtime! O app usa o backend API.
DATABASE_URL=postgresql://fake:fake@localhost:5432/fake

# ============================================
# Next.js Configuration
# ============================================

# Disable Next.js telemetry
NEXT_TELEMETRY_DISABLED=1

# Node environment
NODE_ENV=production
```

---

### **Backend (Python/FastAPI)**

Arquivo: `.env` (no repositório do backend)

```env
# ============================================
# Database Configuration
# ============================================

# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/database_name

# ============================================
# Authentication & Security
# ============================================

# JWT Secret Key (para gerar tokens)
# Gerar com: openssl rand -base64 32
JWT_SECRET_KEY=<sua-jwt-secret-key>

# Chave para criptografia de dados sensíveis
# IMPORTANTE: Deve ser a MESMA do frontend!
KEY_VAULTS_SECRET=<sua-chave-secreta-aqui>

# ============================================
# LiteLLM Configuration
# ============================================

# OpenAI API Key
OPENAI_API_KEY=sk-...

# Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-...

# Google API Key
GOOGLE_API_KEY=...

# ============================================
# MCP Tools Configuration
# ============================================

# Tavily Search API Key
TAVILY_API_KEY=tvly-...

# ============================================
# Google File Search (RAG)
# ============================================

# Google Cloud credentials path
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# ============================================
# Server Configuration
# ============================================

# Server host and port
HOST=0.0.0.0
PORT=8001

# CORS origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://34.42.168.19:3000

# ============================================
# Email Configuration (para reset de senha)
# ============================================

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app
EMAIL_FROM=seu-email@gmail.com
```

---

## 🔐 Gerando Chaves Secretas

### **KEY_VAULTS_SECRET**

Esta chave é usada para criptografar dados sensíveis (como tokens de API dos usuários).

```bash
# Gerar nova chave
openssl rand -base64 32

# Exemplo de saída:
# 7Xj9kP2mN5qR8sT4vW1xY6zA3bC0dE9fG2hI5jK8lM1n

# IMPORTANTE: Use a MESMA chave no frontend e backend!
```

### **JWT_SECRET_KEY** (apenas backend)

Esta chave é usada para assinar tokens JWT de autenticação.

```bash
# Gerar nova chave
openssl rand -base64 32

# Exemplo de saída:
# 4mN7qP9sR2tU5vX8yZ1aC3dF6gH0jK3lM6nO9pQ2rS5t
```

---

## 📂 Estrutura de Arquivos

### **Frontend**

```
lobechat-dev/
├─ .env.production          # Para desenvolvimento local
├─ .env.docker.prod         # Para produção com Docker
└─ .env.docker.prod.example # Template com exemplos
```

### **Backend**

```
backend/
├─ .env                     # Variáveis principais
├─ .env.example             # Template
└─ .env.local               # Overrides locais (opcional)
```

---

## 🚀 Configuração Passo a Passo

### **1. Frontend**

```bash
cd /path/to/lobechat-dev

# Criar arquivo de produção
cp .env.docker.prod.example .env.docker.prod

# Editar com suas configurações
nano .env.docker.prod
```

**Configurações Mínimas:**

```env
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://34.42.168.19:8001/api
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
KEY_VAULTS_SECRET=<gerar-com-openssl>
DATABASE_URL=postgresql://fake:fake@localhost:5432/fake
```

### **2. Backend**

```bash
cd /path/to/backend

# Criar arquivo de configuração
cp .env.example .env

# Editar com suas configurações
nano .env
```

**Configurações Mínimas:**

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET_KEY=<gerar-com-openssl>
KEY_VAULTS_SECRET=<MESMA-DO-FRONTEND>
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

---

## ⚠️ Pontos de Atenção

### **1. KEY_VAULTS_SECRET deve ser IGUAL**

```bash
# ❌ ERRADO - Chaves diferentes
# Frontend: KEY_VAULTS_SECRET=abc123
# Backend:  KEY_VAULTS_SECRET=xyz789

# ✅ CORRETO - Mesma chave
# Frontend: KEY_VAULTS_SECRET=7Xj9kP2mN5qR8sT4vW1xY6z...
# Backend:  KEY_VAULTS_SECRET=7Xj9kP2mN5qR8sT4vW1xY6z...
```

### **2. DATABASE_URL no Frontend é "fake"**

```bash
# Frontend .env.docker.prod:
DATABASE_URL=postgresql://fake:fake@localhost:5432/fake

# Isso é PROPOSITAL! É apenas para o build do Next.js passar.
# Em runtime, o frontend usa o backend API via HTTP.
```

### **3. CORS no Backend**

```bash
# Backend .env:
CORS_ORIGINS=http://localhost:3000,http://34.42.168.19:3000

# Adicionar todos os domínios que vão acessar a API
# Separar por vírgula, SEM espaços
```

### **4. NEXT_PUBLIC_* são Públicas**

```bash
# Variáveis que começam com NEXT_PUBLIC_ são expostas no navegador
# ❌ NÃO coloque chaves secretas nelas!
# ✅ Apenas URLs e flags públicas

# ✅ CORRETO:
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://...
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1

# ❌ ERRADO:
NEXT_PUBLIC_JWT_SECRET=abc123  # ⚠️ Nunca faça isso!
```

---

## 🧪 Testando a Configuração

### **1. Verificar Frontend**

```bash
cd lobechat-dev

# Verificar se as variáveis estão carregadas
pnpm dev

# No navegador, abrir Console (F12):
console.log(process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL);
// Deve mostrar: http://34.42.168.19:8001/api

console.log(process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH);
// Deve mostrar: 1
```

### **2. Verificar Backend**

```bash
cd backend

# Verificar se as variáveis estão carregadas
python -c "import os; print(os.getenv('DATABASE_URL'))"
# Deve mostrar a connection string do PostgreSQL

python -c "import os; print(os.getenv('KEY_VAULTS_SECRET'))"
# Deve mostrar a chave secreta

# Rodar backend
uvicorn main:app --reload

# Acessar: http://localhost:8001/docs
# Deve abrir a documentação da API
```

### **3. Testar Integração**

```bash
# 1. Backend deve estar rodando em http://34.42.168.19:8001
# 2. Frontend deve estar acessando essa URL
# 3. Fazer login no frontend
# 4. Criar um agente
# 5. Verificar no banco PostgreSQL se o agente foi criado

# Verificar no PostgreSQL:
psql -U user -d database_name
SELECT * FROM agents;
```

---

## 🐛 Troubleshooting

### **Erro: "NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured"**

```bash
# Causa: Variável não está definida
# Solução:
echo "NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://34.42.168.19:8001/api" >> .env.production

# Rebuild necessário:
pnpm run build
```

### **Erro: "Not authenticated"**

```bash
# Causa: Token inválido ou expirado
# Solução: Fazer logout e login novamente
```

### **Erro: CORS policy blocked**

```bash
# Causa: Backend não permite o domínio do frontend
# Solução: Adicionar domínio no backend .env
CORS_ORIGINS=http://localhost:3000,http://34.42.168.19:3000
```

### **Erro: "Failed to sync agent to backend"**

```bash
# Possíveis causas:
# 1. Backend não está rodando
# 2. URL incorreta no NEXT_PUBLIC_CUSTOM_API_BASE_URL
# 3. Token expirado
# 4. Backend retornou erro

# Debug:
# 1. Verificar logs do backend
# 2. Verificar Network tab no browser (F12)
# 3. Verificar se o endpoint /api/agents está acessível
curl -H "Authorization: Bearer TOKEN" http://34.42.168.19:8001/api/agents
```

---

## 📝 Checklist Final

Antes de fazer deploy, verificar:

- [ ] `NEXT_PUBLIC_CUSTOM_API_BASE_URL` configurado no frontend
- [ ] `NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1` no frontend
- [ ] `KEY_VAULTS_SECRET` configurado no frontend
- [ ] `KEY_VAULTS_SECRET` configurado no backend (MESMA chave!)
- [ ] `DATABASE_URL` configurado no backend (PostgreSQL real)
- [ ] `JWT_SECRET_KEY` configurado no backend
- [ ] `OPENAI_API_KEY` configurado no backend
- [ ] `GOOGLE_API_KEY` configurado no backend (para File Search)
- [ ] `CORS_ORIGINS` configurado no backend
- [ ] Backend está rodando e acessível
- [ ] Frontend pode fazer requests para o backend
- [ ] Login funciona
- [ ] Criar agente funciona
- [ ] Chat funciona
- [ ] Dados aparecem no PostgreSQL

---

## 🎉 Conclusão

Com todas as variáveis configuradas corretamente, seu LobeChat estará **100% integrado** com seu backend Python!

**Próximos Passos:**
1. ✅ Configurar variáveis
2. ✅ Testar localmente
3. ✅ Deploy em produção
4. 🚀 Usar a aplicação!

---

## 📚 Referências

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [FastAPI Settings](https://fastapi.tiangolo.com/advanced/settings/)
- [OpenSSL](https://www.openssl.org/)
- [PostgreSQL Environment Variables](https://www.postgresql.org/docs/current/libpq-envars.html)

