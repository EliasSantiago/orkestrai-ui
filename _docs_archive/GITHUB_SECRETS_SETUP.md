# 🔐 Configuração de Secrets no GitHub - Frontend (LobeChat)

## 📋 Secrets Necessários

Configure em: **Settings → Secrets and variables → Actions → New repository secret**

---

## 🔑 Secrets Obrigatórios

### 1. `CUSTOM_API_URL`

**Descrição:** URL do backend API  
**Valor:**
```
http://34.42.168.19:8001/api
```

**Como adicionar:**
```
Settings → Secrets and variables → Actions → New repository secret
Nome: CUSTOM_API_URL
Valor: http://34.42.168.19:8001/api
```

---

### 2. `KEY_VAULTS_SECRET`

**Descrição:** Chave de criptografia para o banco de dados  
**Como gerar:**
```bash
openssl rand -base64 32
```

**Exemplo de saída:**
```
xK7mP9qR2vN5wL8tY3sF1aE6bJ4nC0dH9gM2vX7uZ5A=
```

**Como adicionar:**
```
Settings → Secrets and variables → Actions → New repository secret
Nome: KEY_VAULTS_SECRET
Valor: <cole-a-chave-gerada-acima>
```

---

### 3. `GCP_USERNAME` e `GCP_SSH_KEY` (VOCÊ JÁ TEM!)

**✅ Você já configurou esses secrets para o backend!**

O workflow foi atualizado para reutilizá-los automaticamente.

**❓ Não sabe como obtê-los?**  
👉 **Leia:** [SSH_KEYS_GUIDE.md](./SSH_KEYS_GUIDE.md) - Guia completo sobre SSH keys!

**Resumo rápido:**
- `GCP_USERNAME` = usuário SSH do servidor (ex: `ignitor_online`)
- `GCP_SSH_KEY` = chave privada SSH (arquivo `~/.ssh/id_ed25519` da sua máquina local)
- `GCP_HOST` = IP do servidor (ex: `34.42.168.19`)
- `GCP_SSH_PORT` = porta SSH (padrão: `22`)

---

## 🔄 Otimização Inteligente: Reutilizar Secrets Existentes

✅ **Workflow já configurado para usar seus secrets do backend!**

### Secrets Reutilizados (você já tem):
```yaml
GCP_HOST         → IP do servidor
GCP_USERNAME     → Usuário SSH
GCP_SSH_KEY      → Chave SSH privada
GCP_SSH_PORT     → Porta SSH
```

❓ **Como obter esses valores?**  
📖 Leia: [SSH_KEYS_GUIDE.md](./SSH_KEYS_GUIDE.md)

### Secrets NOVOS que você precisa adicionar:
1. 🆕 `CUSTOM_API_URL` - http://34.42.168.19:8001/api
2. 🆕 `KEY_VAULTS_SECRET` - Gerar com `openssl rand -base64 32`

---

## 📝 Guia Rápido

### 1. Gerar KEY_VAULTS_SECRET

```bash
openssl rand -base64 32
```

Copie o resultado!

---

### 2. Adicionar no GitHub

```
1. Vá para: https://github.com/SEU-USUARIO/SEU-REPO/settings/secrets/actions

2. Clique: "New repository secret"

3. Adicionar CUSTOM_API_URL:
   Nome: CUSTOM_API_URL
   Valor: http://34.42.168.19:8001/api
   Clique: "Add secret"

4. Adicionar KEY_VAULTS_SECRET:
   Nome: KEY_VAULTS_SECRET
   Valor: <cole-resultado-do-openssl>
   Clique: "Add secret"
```

---

## ✅ Checklist Final

Após configurar, você deve ter:

### Secrets Existentes (do backend):
- [x] `GCP_HOST`
- [x] `GCP_SSH_KEY`
- [x] `GCP_SSH_PORT`
- [x] `GCP_USERNAME`

### Secrets NOVOS (para frontend):
- [ ] `CUSTOM_API_URL`
- [ ] `KEY_VAULTS_SECRET`

---

## 🔧 Atualizar Workflow

Vou atualizar o arquivo `.github/workflows/deploy-production.yml` para usar os secrets existentes:

**Antes:**
```yaml
host: ${{ secrets.SERVER_HOST }}
username: ${{ secrets.SERVER_USER }}
key: ${{ secrets.SSH_PRIVATE_KEY }}
port: ${{ secrets.SERVER_PORT || 22 }}
```

**Depois:**
```yaml
host: ${{ secrets.GCP_HOST }}
username: ${{ secrets.GCP_USERNAME }}
key: ${{ secrets.GCP_SSH_KEY }}
port: ${{ secrets.GCP_SSH_PORT || 22 }}
```

---

## 🎯 Resumo

### Ação Imediata:

1. **Gerar chave:**
   ```bash
   openssl rand -base64 32
   ```

2. **Adicionar 2 secrets novos:**
   - `CUSTOM_API_URL` = http://34.42.168.19:8001/api
   - `KEY_VAULTS_SECRET` = (resultado do openssl)

3. **Workflow será atualizado** para usar os secrets existentes do GCP

---

## 🆘 Se Tiver Problemas

### Erro: "Permission denied (publickey)"
```bash
# Verificar se chave está no servidor
ssh -i ~/.ssh/sua-chave usuario@servidor

# Se não funcionar, recopiar
ssh-copy-id -i ~/.ssh/sua-chave.pub usuario@servidor
```

### Erro: "Host key verification failed"
```bash
# Adicionar host ao known_hosts
ssh-keyscan seu-servidor >> ~/.ssh/known_hosts
```

---

## 📞 Próximos Passos

1. ✅ Gerar `KEY_VAULTS_SECRET`
2. ✅ Adicionar os 2 secrets novos no GitHub
3. ✅ Workflow será atualizado automaticamente
4. ✅ Fazer primeiro push e ver o magic acontecer! 🚀

---

**Última atualização:** Novembro 15, 2025  
**Backend:** http://34.42.168.19:8001/  
**Status:** ⚙️ Aguardando configuração de secrets

