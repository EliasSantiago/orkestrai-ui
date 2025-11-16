# 🚀 Configuração dos Workflows - Guia Passo a Passo

## 📋 Pré-requisitos

- ✅ Repositório no GitHub
- ✅ Servidor com Docker instalado
- ✅ Acesso SSH ao servidor

---

## 1️⃣ Configurar Secrets no GitHub

### Acessar configurações:
```
Seu Repositório → Settings → Secrets and variables → Actions → New repository secret
```

### Adicionar os seguintes secrets:

#### **CUSTOM_API_URL**
```
http://34.42.168.19:8001/api
```

#### **KEY_VAULTS_SECRET**
```bash
# Gerar no seu terminal:
openssl rand -base64 32

# Copiar o resultado e adicionar como secret
```

#### **SERVER_HOST**
```
# IP do seu servidor
exemplo: 34.42.168.19
```

#### **SERVER_USER**
```
# Usuário SSH do servidor
exemplo: ignitor_online
```

#### **SSH_PRIVATE_KEY**
```bash
# 1. Gerar chave SSH (no seu computador local):
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github-actions

# 2. Copiar chave pública para o servidor:
ssh-copy-id -i ~/.ssh/github-actions.pub usuario@seu-servidor

# 3. Ver chave PRIVADA:
cat ~/.ssh/github-actions

# 4. Copiar TODO o conteúdo (incluindo BEGIN e END)
# 5. Colar no secret SSH_PRIVATE_KEY
```

---

## 2️⃣ Preparar o Servidor

### Conectar no servidor:
```bash
ssh usuario@seu-servidor
```

### Criar estrutura de diretórios:
```bash
cd ~
mkdir -p chat-ui
cd chat-ui
```

### Clonar repositório (se ainda não fez):
```bash
git clone https://github.com/seu-usuario/seu-repo.git .
```

### Garantir permissões do Docker:
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Relogar ou usar:
newgrp docker

# Testar
docker ps
```

### Criar .env.docker.prod:
```bash
cat > .env.docker.prod << EOF
CUSTOM_API_URL=http://34.42.168.19:8001/api
KEY_VAULTS_SECRET=$(openssl rand -base64 32)
EOF
```

---

## 3️⃣ Configurar Permissões do GitHub Actions

### No repositório:
```
Settings → Actions → General → Workflow permissions
```

**Selecionar:**
- ✓ **Read and write permissions**
- ✓ **Allow GitHub Actions to create and approve pull requests**

---

## 4️⃣ Habilitar GitHub Container Registry

### No repositório:
```
Settings → Packages → Inherit access from source repository
```

**Marcar:**
- ✓ **Inherit access from source repository**

---

## 5️⃣ Testar SSH Connection

### No seu computador local:
```bash
# Testar conexão SSH
ssh -i ~/.ssh/github-actions usuario@seu-servidor

# Se funcionar, está pronto!
# Se não funcionar, verificar:
# 1. Chave pública está no servidor (~/.ssh/authorized_keys)
# 2. Permissões: chmod 600 ~/.ssh/authorized_keys
# 3. Firewall permite porta 22
```

---

## 6️⃣ Fazer Primeiro Deploy Manual

### Antes de ativar workflow, testar manualmente:
```bash
# No servidor
cd ~/chat-ui
./docker-prod.sh build
./docker-prod.sh start
./docker-prod.sh logs
```

**Se funcionar:** Workflow também vai funcionar! ✅

---

## 7️⃣ Ativar Workflows

### Commit e push:
```bash
# No seu computador local
cd /home/ignitor/projects/lobechat-dev

git add .github/workflows/
git commit -m "feat: add GitHub Actions workflows for automated deployment"
git push origin main
```

### Verificar execução:
```
GitHub → Actions → Deploy to Production
```

---

## 8️⃣ Verificar Deploy

### Ver logs do workflow:
```
Actions → Deploy to Production → [último run] → Ver logs
```

### Ver no servidor:
```bash
ssh usuario@seu-servidor
cd ~/chat-ui
./docker-prod.sh logs
```

### Testar aplicação:
```
http://seu-servidor:3210
```

---

## 🎯 Checklist Completo

### GitHub Secrets:
- [ ] `CUSTOM_API_URL` configurado
- [ ] `KEY_VAULTS_SECRET` configurado
- [ ] `SERVER_HOST` configurado
- [ ] `SERVER_USER` configurado
- [ ] `SSH_PRIVATE_KEY` configurado

### Servidor:
- [ ] Docker instalado
- [ ] Usuário no grupo docker
- [ ] Repositório clonado em `~/chat-ui`
- [ ] `.env.docker.prod` criado
- [ ] SSH key autorizada

### GitHub:
- [ ] Workflow permissions: Read and write
- [ ] GitHub Container Registry habilitado
- [ ] Workflows commitados

### Testes:
- [ ] SSH manual funciona
- [ ] Deploy manual funciona (`./docker-prod.sh build`)
- [ ] Workflow rodou com sucesso
- [ ] Aplicação acessível

---

## 🔧 Customizações Opcionais

### Alterar porta SSH (se não for 22):

Adicionar secret:
```
SERVER_PORT=2222
```

### Deploy apenas manual (sem auto-deploy):

```yaml
# deploy-production.yml
# Alterar "on:" para:
on:
  workflow_dispatch:  # Apenas manual
```

### Adicionar mais branches:

```yaml
# deploy-production.yml
on:
  push:
    branches:
      - main
      - production
      - staging
```

---

## 🐛 Problemas Comuns

### 1. "Permission denied (publickey)"

**Causa:** Chave SSH não autorizada no servidor

**Solução:**
```bash
# Copiar chave novamente
ssh-copy-id -i ~/.ssh/github-actions.pub usuario@servidor

# Verificar no servidor
cat ~/.ssh/authorized_keys
# Deve conter a chave pública
```

### 2. "docker: command not found"

**Causa:** Usuário não tem acesso ao Docker

**Solução:**
```bash
# No servidor
sudo usermod -aG docker $USER
newgrp docker
docker ps
```

### 3. "resource not accessible by integration"

**Causa:** Workflow não tem permissões

**Solução:**
```
Settings → Actions → General → Workflow permissions
✓ Read and write permissions
```

### 4. Build demora muito (>30 min)

**Causa:** Cache não está funcionando

**Solução:**
```yaml
# Verificar se tem estas linhas no workflow:
cache-from: type=gha
cache-to: type=gha,mode=max
```

### 5. Health check falha

**Causa:** Aplicação não iniciou a tempo

**Solução:**
```yaml
# Aumentar tempo de espera no workflow:
sleep 60  # ao invés de 30
```

---

## 📊 Monitorar Workflows

### Ver status:
```
Actions → All workflows
```

### Ver builds:
```
Packages → ghcr.io/seu-usuario/seu-repo
```

### Ver deploys no servidor:
```bash
ssh usuario@servidor
cd ~/chat-ui
./docker-prod.sh logs
docker ps
```

---

## 🎉 Pronto!

Agora você tem CI/CD automático! 🚀

**Fluxo:**
1. Você faz commit na `main`
2. Workflow roda automaticamente
3. Build da imagem
4. Push para GitHub Container Registry
5. Deploy no servidor
6. Health check
7. ✅ Aplicação atualizada!

---

**Tempo total:** ~20 minutos por deploy  
**Manual:** 0 minutos (tudo automático!)

**Documentação completa:** [README.md](./.github/workflows/README.md)

