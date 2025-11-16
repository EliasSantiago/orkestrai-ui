# GitHub Actions Workflows

## 📋 Workflows Ativos

### 1. `deploy-production.yml` ⭐
**Deploy automático para produção**

**Quando roda:**
- ✅ Push na branch `main`
- ✅ Pull Request aprovado e merged para `main`

**O que faz:**
1. **Build e Push:** Cria imagem Docker e envia para GitHub Container Registry
2. **Deploy:** Conecta no servidor via SSH e atualiza a aplicação
3. **Health Check:** Verifica se aplicação está respondendo
4. **Notificação:** Envia status do deploy

**Tempo estimado:** 15-20 minutos

---

### 2. `build-only.yml`
**Testa build em Pull Requests**

**Quando roda:**
- ✅ PR aberto para `main`
- ✅ Novos commits em PR existente

**O que faz:**
1. Testa se build Docker funciona
2. Comenta no PR se build passou

**Tempo estimado:** 10-15 minutos

---

## 🔐 Secrets Necessários

Configure em: `Settings → Secrets and variables → Actions`

### Obrigatórios:

```bash
# Backend
CUSTOM_API_URL=http://34.42.168.19:8001/api

# Chave de criptografia (gerar com: openssl rand -base64 32)
KEY_VAULTS_SECRET=<sua-chave>

# Servidor SSH
SERVER_HOST=<ip-do-servidor>
SERVER_USER=<usuario-ssh>
SSH_PRIVATE_KEY=<chave-privada-ssh>
```

### Opcionais:

```bash
# Se usar porta SSH diferente de 22
SERVER_PORT=22

# Se usar Docker Hub ao invés de GitHub Container Registry
DOCKER_USERNAME=<seu-usuario-dockerhub>
DOCKER_PASSWORD=<seu-token-dockerhub>
```

---

## 🚀 Como Funciona

### Fluxo de Deploy

```mermaid
1. Developer faz commit na main
   ↓
2. Workflow "deploy-production" inicia
   ↓
3. Build da imagem Docker
   ↓
4. Push para GitHub Container Registry
   ↓
5. SSH no servidor
   ↓
6. Pull da nova imagem
   ↓
7. Restart do container
   ↓
8. Health check
   ↓
9. ✅ Deploy concluído!
```

---

## ⚙️ Configurar SSH no Servidor

### 1. Gerar chave SSH (no seu computador)

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions
```

### 2. Copiar chave pública para servidor

```bash
ssh-copy-id -i ~/.ssh/github-actions.pub usuario@seu-servidor
```

### 3. Testar conexão

```bash
ssh -i ~/.ssh/github-actions usuario@seu-servidor
```

### 4. Adicionar chave privada ao GitHub

```bash
# Ver chave privada
cat ~/.ssh/github-actions

# Copiar TODO o conteúdo (incluindo BEGIN e END)
# Adicionar em: Settings → Secrets → SSH_PRIVATE_KEY
```

---

## 📦 Usar GitHub Container Registry

### 1. Habilitar no repositório

`Settings → Packages → Inherit access from source repository`

### 2. Imagem será publicada em:

```
ghcr.io/seu-usuario/seu-repositorio:latest
```

### 3. Pull manual (se necessário):

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u seu-usuario --password-stdin

# Pull
docker pull ghcr.io/seu-usuario/seu-repositorio:latest
```

---

## 🔧 Customizar Workflows

### Alterar branch de deploy

```yaml
# deploy-production.yml
on:
  push:
    branches:
      - main        # ← Alterar aqui
      - production  # ← Adicionar outras branches
```

### Desabilitar deploy automático no servidor

```yaml
# deploy-production.yml
# Comentar o job "deploy-to-server"
# Manter apenas "build-and-push"
```

### Adicionar notificações

```yaml
# Adicionar no job "notify"
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🐛 Troubleshooting

### Build falha: "Permission denied"

**Solução:**
```yaml
# Verificar se GITHUB_TOKEN tem permissões
# Settings → Actions → General → Workflow permissions
# ✓ Read and write permissions
```

### Deploy falha: "SSH connection refused"

**Solução:**
```bash
# No servidor, verificar SSH
sudo systemctl status sshd

# Verificar firewall
sudo ufw status
sudo ufw allow 22/tcp
```

### Health check falha

**Solução:**
```bash
# No servidor, verificar logs
cd ~/chat-ui
./docker-prod.sh logs

# Verificar se porta 3210 está aberta
curl http://localhost:3210
```

---

## 📊 Monitoramento

### Ver workflows rodando

```
Actions → Running workflows
```

### Ver imagens publicadas

```
Packages → ghcr.io/seu-usuario/seu-repo
```

### Ver logs de deploy

```
Actions → Deploy to Production → [último run]
```

---

## 🔒 Segurança

### Boas Práticas:

- ✅ Use secrets para todas as credenciais
- ✅ Nunca faça commit de `.env` files
- ✅ Use chaves SSH específicas para CI/CD
- ✅ Limite permissões do usuário SSH no servidor
- ✅ Use GitHub Container Registry (mais seguro que Docker Hub)

---

## 📚 Documentação

- **GitHub Actions:** https://docs.github.com/actions
- **Docker Build Push:** https://github.com/docker/build-push-action
- **SSH Action:** https://github.com/appleboy/ssh-action

---

## 🎯 Próximos Passos

1. ✅ Configurar secrets no GitHub
2. ✅ Configurar SSH no servidor
3. ✅ Fazer primeiro commit na main
4. ✅ Ver workflow rodando
5. ✅ Verificar deploy no servidor

---

**Última atualização:** Novembro 15, 2025  
**Status:** ✅ Workflows Configurados

