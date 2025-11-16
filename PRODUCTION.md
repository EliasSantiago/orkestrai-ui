# 🚀 LobeChat - Configuração de Produção

## ⚡ Quick Start

```bash
# 1. Configurar ambiente
cp .env.docker.prod.example .env.docker.prod
# Editar .env.docker.prod e gerar KEY_VAULTS_SECRET

# 2. Build
./docker-prod.sh build

# 3. Start
./docker-prod.sh start

# 4. Ver logs
./docker-prod.sh logs
```

---

## 🌐 URLs

- **Backend API:** http://34.42.168.19:8001/
- **Frontend:** http://SEU-SERVIDOR:3210
- **Documentação completa:** [DEPLOY.md](./DEPLOY.md)

---

## 📦 Estrutura

```
lobechat-custom/
├── src/                          # Código customizado
│   ├── services/customAuth/      # Autenticação custom
│   └── services/customApi/       # API custom
├── docker-compose.prod.yml       # Config Docker produção
├── Dockerfile.local              # Dockerfile customizado
├── .env.docker.prod              # Variáveis de ambiente
└── docker-prod.sh                # Script de deploy
```

---

## 🔧 Comandos

| Comando | Descrição |
|---------|-----------|
| `./docker-prod.sh build` | Build da imagem |
| `./docker-prod.sh start` | Iniciar aplicação |
| `./docker-prod.sh stop` | Parar aplicação |
| `./docker-prod.sh restart` | Reiniciar |
| `./docker-prod.sh logs` | Ver logs |
| `./docker-prod.sh status` | Ver status |
| `./docker-prod.sh update` | Atualizar código e rebuild |
| `./docker-prod.sh shell` | Acessar shell do container |
| `./docker-prod.sh clean` | Limpar tudo |

---

## ⚙️ Configuração

### Variáveis de Ambiente Obrigatórias

```env
# Backend API
CUSTOM_API_URL=http://34.42.168.19:8001/api

# Chave de criptografia (gerar com: openssl rand -base64 32)
KEY_VAULTS_SECRET=<sua-chave-aqui>
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────┐
│  Navegador                          │
│  ↓                                  │
│  LobeChat Frontend                  │
│  • PGLite (DB local)                │
│  • React 19 + Next.js 15            │
│  ↓                                  │
│  Autenticação Custom                │
│  ↓                                  │
│  Backend API (34.42.168.19:8001)    │
│  • LiteLLM                          │
│  • ADK Google                       │
│  • MCP Tools                        │
│  • Google File Search (RAG)         │
└─────────────────────────────────────┘
```

---

## 📊 Requisitos

- **CPU:** 4 vCPUs (mínimo 1 vCPU)
- **RAM:** 16 GB (mínimo 2 GB)
- **Disco:** ~10 GB livre
- **Docker:** 20.10+
- **Docker Compose:** 2.0+

---

## 🔒 Segurança

✅ Workflows do GitHub desabilitados (`.github/workflows/_disabled/`)  
✅ Modelos LLM locais desabilitados  
✅ Autenticação customizada habilitada  
✅ Healthcheck configurado  
✅ Logs rotacionados (10MB max, 3 arquivos)

---

## 📚 Documentação

- [Guia de Deploy Completo](./DEPLOY.md)
- [README Principal](./README.md)
- [Changelog](./CHANGELOG.md)

---

## 🆘 Problemas?

1. **Ver logs:** `./docker-prod.sh logs`
2. **Verificar status:** `./docker-prod.sh status`
3. **Consultar troubleshooting:** [DEPLOY.md#troubleshooting](./DEPLOY.md#troubleshooting)

---

## ✅ Checklist Rápido

- [ ] `.env.docker.prod` configurado
- [ ] Backend acessível (http://34.42.168.19:8001/)
- [ ] Build executado com sucesso
- [ ] Aplicação rodando na porta 3210
- [ ] Login funcionando
- [ ] Chat funcionando

---

**Status:** ✅ Production Ready  
**Última atualização:** Novembro 15, 2025

