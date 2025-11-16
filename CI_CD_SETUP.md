# 🤖 CI/CD Setup - Resumo Executivo

## ✅ O Que Foi Configurado

### Workflows GitHub Actions:

1. **`deploy-production.yml`** ⭐
   - Deploy automático ao push na `main`
   - Deploy automático ao merge de PR na `main`
   - Build e push para GitHub Container Registry
   - Deploy SSH no servidor
   - Health check automático

2. **`build-only.yml`**
   - Build de teste em PRs
   - Comentário automático no PR

---

## 🔐 Secrets Necessários

Configure em: **Settings → Secrets and variables → Actions**

| Secret | Valor | Como Obter |
|--------|-------|------------|
| `CUSTOM_API_URL` | `http://34.42.168.19:8001/api` | URL do seu backend |
| `KEY_VAULTS_SECRET` | `<chave-32-chars>` | `openssl rand -base64 32` |
| `SERVER_HOST` | `34.42.168.19` | IP do servidor |
| `SERVER_USER` | `ignitor_online` | Usuário SSH |
| `SSH_PRIVATE_KEY` | `<chave-ssh>` | `cat ~/.ssh/github-actions` |

---

## 🔑 Configurar SSH (5 Minutos)

### No seu computador local:

```bash
# 1. Gerar chave SSH
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github-actions

# 2. Copiar para servidor
ssh-copy-id -i ~/.ssh/github-actions.pub usuario@34.42.168.19

# 3. Testar
ssh -i ~/.ssh/github-actions usuario@34.42.168.19

# 4. Ver chave privada (copiar TUDO)
cat ~/.ssh/github-actions
```

### Adicionar ao GitHub:

```
Settings → Secrets → New secret
Nome: SSH_PRIVATE_KEY
Valor: (colar chave privada completa)
```

---

## ⚙️ Configurar Permissões GitHub

### 1. Workflow Permissions
```
Settings → Actions → General → Workflow permissions
✓ Read and write permissions
✓ Allow GitHub Actions to create and approve pull requests
```

### 2. GitHub Container Registry
```
Settings → Packages
✓ Inherit access from source repository
```

---

## 🚀 Ativar CI/CD

### 1. Commit workflows:
```bash
git add .github/workflows/
git commit -m "feat: add automated CI/CD workflows"
git push origin main
```

### 2. Verificar execução:
```
GitHub → Actions → Deploy to Production
```

### 3. Ver imagem publicada:
```
Packages → ghcr.io/seu-usuario/seu-repo
```

---

## 📊 Fluxo de Deploy Automático

```
Developer
   │
   ├─ git commit
   ├─ git push origin main
   │
   ↓
GitHub Actions
   │
   ├─ Checkout code
   ├─ Build Docker image
   ├─ Push to ghcr.io
   │
   ↓
SSH no Servidor
   │
   ├─ Pull latest code
   ├─ Pull latest image
   ├─ docker-compose down
   ├─ docker-compose up -d
   │
   ↓
Health Check
   │
   ├─ Aguarda 30s
   ├─ curl http://servidor:3210
   │
   ↓
✅ Deploy Concluído!
```

---

## ⏱️ Tempo de Deploy

- **Build:** ~10-15 min
- **Push:** ~1-2 min
- **Deploy:** ~2-3 min
- **Total:** ~15-20 min

**Após primeiro build:** ~5-10 min (com cache)

---

## 🐛 Troubleshooting Rápido

### "Permission denied (publickey)"
```bash
# Recopiar chave SSH
ssh-copy-id -i ~/.ssh/github-actions.pub usuario@servidor
```

### "docker: command not found"
```bash
# No servidor
sudo usermod -aG docker $USER
newgrp docker
```

### "resource not accessible"
```
Settings → Actions → General
✓ Read and write permissions
```

### Build muito lento
```yaml
# Cache está configurado em ambos workflows:
cache-from: type=gha
cache-to: type=gha,mode=max
```

---

## 📚 Documentação Completa

- **[.github/workflows/README.md](./.github/workflows/README.md)** - Documentação detalhada
- **[.github/workflows/SETUP.md](./.github/workflows/SETUP.md)** - Guia passo a passo

---

## ✅ Checklist de Ativação

### Antes de Commitar:
- [ ] Secrets configurados no GitHub
- [ ] SSH configurado e testado
- [ ] Permissões do Actions habilitadas
- [ ] GitHub Container Registry habilitado

### Depois de Commitar:
- [ ] Workflow iniciou automaticamente
- [ ] Build concluído sem erros
- [ ] Imagem no ghcr.io
- [ ] Deploy no servidor funcionou
- [ ] Health check passou
- [ ] Aplicação acessível

---

## 🎯 Benefícios do CI/CD

✅ **Deploy Automático**
- Push na main = deploy automático
- Sem intervenção manual

✅ **Testes em PRs**
- Build automático em pull requests
- Feedback antes do merge

✅ **Histórico**
- Todos os deploys registrados
- Fácil identificar quando algo quebrou

✅ **Rollback**
- `git revert <commit>` = deploy anterior
- Rollback em minutos

✅ **Cache Otimizado**
- Primeiro build: 15-20 min
- Builds seguintes: 5-10 min

---

## 🔒 Segurança

✅ Secrets nunca aparecem nos logs  
✅ SSH key específica para CI/CD  
✅ Permissões mínimas necessárias  
✅ GitHub Container Registry privado  
✅ Health check antes de considerar sucesso

---

## 📞 Suporte

### Ver logs do workflow:
```
Actions → [workflow name] → [run] → [job] → [step]
```

### Ver imagens:
```
Packages → ghcr.io/seu-usuario/seu-repo
```

### Ver deploy no servidor:
```bash
ssh usuario@servidor
cd ~/chat-ui
./docker-prod.sh logs
```

---

## 🎉 Está Pronto!

**Agora você tem:**
- ✅ Deploy automático
- ✅ Testes em PRs
- ✅ Container registry
- ✅ SSH deploy
- ✅ Health checks
- ✅ Notificações

**Próximo passo:**
1. Configure os secrets
2. Faça um commit
3. Veja a mágica acontecer! 🚀

---

**Última atualização:** Novembro 15, 2025  
**Backend:** http://34.42.168.19:8001/  
**Status:** ✅ CI/CD Configurado

