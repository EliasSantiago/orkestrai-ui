# 🚀 Quick Start - Integração Backend

## ⚡ Guia Rápido de 5 Minutos

Este guia te coloca online em **5 minutos**.

---

## 📋 Pré-requisitos

- ✅ Backend Python rodando em `http://34.42.168.19:8001`
- ✅ PostgreSQL configurado
- ✅ Node.js instalado
- ✅ pnpm instalado

---

## 🔥 Setup em 5 Passos

### **1. Configurar Variáveis de Ambiente** (1 min)

```bash
cd /home/ignitor/projects/lobechat-dev

# Criar arquivo de produção
cat > .env.production << 'EOF'
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://34.42.168.19:8001/api
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
KEY_VAULTS_SECRET=$(openssl rand -base64 32)
DATABASE_URL=postgresql://fake:fake@localhost:5432/fake
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
EOF
```

### **2. Instalar Dependências** (2 min)

```bash
pnpm install
```

### **3. Build** (1 min)

```bash
pnpm run build
```

### **4. Rodar** (10 segundos)

```bash
pnpm start
```

### **5. Testar** (1 min)

```bash
# Abrir navegador em: http://localhost:3000
# 1. Fazer login
# 2. Criar agente
# 3. Conversar

# Verificar no PostgreSQL:
psql -U user -d database_name -c "SELECT * FROM agents;"
```

---

## 🎯 Comandos Essenciais

### **Desenvolvimento Local**

```bash
# Rodar em modo dev (sem Docker)
pnpm dev

# Abrir em: http://localhost:3000
```

### **Produção com Docker**

```bash
# Build da imagem
./docker-prod.sh build

# Rodar container
./docker-prod.sh start

# Ver logs
./docker-prod.sh logs

# Parar
./docker-prod.sh stop
```

---

## 🔍 Verificações Rápidas

### **1. Backend está rodando?**

```bash
curl http://34.42.168.19:8001/health

# Deve retornar:
# {"status":"healthy"}
```

### **2. Frontend consegue acessar backend?**

```bash
# Abrir navegador em: http://localhost:3000
# Abrir Console (F12)
# Verificar Network tab
# Fazer login
# Deve ver requests para: http://34.42.168.19:8001/api/auth/login
```

### **3. Agentes são salvos no backend?**

```bash
# Criar um agente no frontend
# Verificar no PostgreSQL:
psql -U user -d database_name

\dt  # Listar tabelas
SELECT * FROM agents;  # Ver agentes
SELECT * FROM users;   # Ver usuários
```

---

## 🐛 Problemas Comuns

### **❌ Erro: "Not authenticated"**

```bash
# Solução: Fazer logout e login novamente
```

### **❌ Erro: "CORS policy blocked"**

```bash
# Adicionar domínio no backend .env:
echo "CORS_ORIGINS=http://localhost:3000" >> backend/.env

# Reiniciar backend
```

### **❌ Erro: "Failed to fetch"**

```bash
# Verificar se backend está rodando:
curl http://34.42.168.19:8001/health

# Verificar URL no .env.production:
cat .env.production | grep NEXT_PUBLIC_CUSTOM_API_BASE_URL
```

---

## 🎉 Pronto!

Agora você tem:
- ✅ Frontend LobeChat rodando
- ✅ Integrado com seu backend Python
- ✅ Agentes salvos no PostgreSQL
- ✅ Autenticação funcionando
- ✅ Chat funcionando

---

## 📚 Documentação Completa

Para entender a arquitetura completa:
- 📖 `BACKEND_INTEGRATION_COMPLETE.md` - Arquitetura detalhada
- 🔧 `ENV_SETUP_GUIDE.md` - Guia de variáveis de ambiente
- 📋 Ver `INDEX.md` para índice completo

