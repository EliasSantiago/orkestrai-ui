# LobeChat - Custom Production Setup

## 🎯 Esta é uma versão customizada do LobeChat

### Customizações:
- ✅ Autenticação customizada integrada
- ✅ Backend API próprio (http://34.42.168.19:8001/)
- ✅ Sem modelos LLM locais
- ✅ Configuração otimizada para produção

---

## 🚀 Deploy em Produção

Veja: **[DEPLOY.md](./DEPLOY.md)**

---

## 📖 Documentação

- **Deploy:** [DEPLOY.md](./DEPLOY.md)
- **Configuração:** [PRODUCTION.md](./PRODUCTION.md)
- **README Original:** [README.md](./README.md)

---

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Rodar em modo desenvolvimento
pnpm dev
```

**Porta:** http://localhost:3000

---

## 📦 Build Docker

```bash
# Build
./docker-prod.sh build

# Start
./docker-prod.sh start
```

---

## 🌐 URLs

- **Backend:** http://34.42.168.19:8001/
- **Frontend (dev):** http://localhost:3000
- **Frontend (prod):** http://SEU-SERVIDOR:3210

---

**Baseado em:** [LobeHub/LobeChat](https://github.com/lobehub/lobe-chat)  
**Versão:** Custom Production Build
