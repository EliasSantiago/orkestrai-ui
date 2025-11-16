# 🐳 Guia Docker Local - LobeChat

## ✅ Sistema Iniciado!

O LobeChat está rodando com Docker localmente e conectado ao seu backend.

---

## 🚀 Acesso

- **LobeChat:** http://localhost:3210
- **Backend:** http://localhost:8001/api

---

## 📋 Comandos Disponíveis

Use o script `./docker-local.sh`:

```bash
# Iniciar LobeChat
./docker-local.sh start

# Parar LobeChat
./docker-local.sh stop

# Reiniciar LobeChat
./docker-local.sh restart

# Ver logs em tempo real
./docker-local.sh logs

# Ver status
./docker-local.sh status

# Abrir shell no container
./docker-local.sh shell

# Limpar tudo (parar e remover volumes)
./docker-local.sh clean

# Atualizar imagem do LobeChat
./docker-local.sh update
```

---

## 🔧 Configuração

### Arquivos Criados

1. **`docker-compose.local.yml`** - Configuração do Docker Compose
2. **`docker-local.sh`** - Script helper para gerenciar
3. **`.env.local`** - Variáveis de ambiente (não commitado)

### Variáveis de Ambiente

O Docker está usando estas configurações:

```bash
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://host.docker.internal:8001/api
NEXT_TELEMETRY_DISABLED=1
```

**Nota:** `host.docker.internal` permite o container acessar o `localhost` do seu notebook.

---

## 🧪 Testando o Sistema

### 1. Acesse o LobeChat
```
http://localhost:3210
```

### 2. Faça Login
- A tela de login deve aparecer automaticamente
- Use as credenciais do seu backend

### 3. Crie um Agente
- Após login, crie um novo agente
- O agente será sincronizado com o backend

### 4. Converse
- Envie mensagens para testar
- O chat usa a rota `/api/agents/chat` do backend

---

## 🔍 Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
./docker-local.sh logs

# Verificar se porta 3210 está livre
sudo lsof -i :3210

# Reiniciar
./docker-local.sh restart
```

### Backend não conecta
```bash
# Verificar se backend está rodando
curl http://localhost:8001/api/health

# Ver logs do container
./docker-local.sh logs
```

### Erro "host.docker.internal" não resolve

**Linux:** Adicione ao `docker-compose.local.yml`:
```yaml
extra_hosts:
  - "host.docker.internal:172.17.0.1"
```

**Ou use o IP real da sua máquina:**
```bash
# Descobrir IP
ip addr show

# Editar docker-compose.local.yml
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://SEU_IP:8001/api
```

### Limpar e recomeçar
```bash
# Parar e limpar tudo
./docker-local.sh clean

# Iniciar novamente
./docker-local.sh start
```

---

## 💾 Uso de Recursos

### Memória
O Docker usa **muito menos memória** que rodar localmente:

- **Docker:** ~200-300 MB
- **Local (pnpm dev):** ~2-4 GB

### Espaço em Disco
- **Imagem:** ~145 MB
- **Container:** ~10-20 MB adicionais

---

## 🔄 Workflow de Desenvolvimento

### Desenvolvimento com Backend Local

**Terminal 1 - Backend:**
```bash
cd /path/to/backend
python main.py
# Backend rodando em http://localhost:8001
```

**Terminal 2 - LobeChat (Docker):**
```bash
cd /home/ignitor/projects/lobechat-dev
./docker-local.sh start
# LobeChat rodando em http://localhost:3210
```

**Browser:**
```
http://localhost:3210 → Login → Testar
```

### Atualizando o LobeChat

```bash
# Quando houver nova versão
./docker-local.sh update
./docker-local.sh restart
```

---

## 🌐 Deploy em Produção

Quando estiver pronto para produção, veja:
- **[EASYPANEL_DEPLOY.md](./EASYPANEL_DEPLOY.md)** - Deploy no Easypanel
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Checklist completo

---

## 📊 Monitoramento

### Ver Logs em Tempo Real
```bash
./docker-local.sh logs
```

### Ver Status do Container
```bash
./docker-local.sh status
```

### Inspecionar o Container
```bash
# Abrir shell dentro do container
./docker-local.sh shell

# Dentro do container
ls -la /app
cat /app/.env.local
ps aux
```

---

## 🎯 Resumo

| Item | Valor |
|------|-------|
| **URL** | http://localhost:3210 |
| **Backend** | http://localhost:8001/api |
| **Container** | lobechat-local |
| **Imagem** | lobehub/lobe-chat:latest |
| **Rede** | lobechat-network |
| **Memória** | ~200-300 MB |

---

## ✨ Vantagens do Docker

✅ **Baixo uso de memória** - Ideal para notebooks com pouca RAM  
✅ **Isolamento** - Não interfere com outras aplicações  
✅ **Fácil de gerenciar** - Um comando para start/stop  
✅ **Consistente** - Mesma imagem que vai para produção  
✅ **Rápido** - Não precisa buildar, já vem pronto  

---

## 🆘 Suporte

Se tiver problemas:

1. Ver logs: `./docker-local.sh logs`
2. Ver status: `./docker-local.sh status`
3. Limpar e recomeçar: `./docker-local.sh clean && ./docker-local.sh start`

**Documentação completa:** [QUICK_START.md](./QUICK_START.md)

---

**Pronto para testar! 🚀**

Acesse: **http://localhost:3210**

