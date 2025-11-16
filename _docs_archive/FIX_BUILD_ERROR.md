# 🔧 Correção: Erro de Build - KEY_VAULTS_SECRET

## ❌ Erro Que Você Teve

```
Error: `KEY_VAULTS_SECRET` is not set
Failed to collect page data for /oidc/handoff
```

## 🎯 Causa

O Next.js precisa de `KEY_VAULTS_SECRET` durante o build para:
- Criptografar dados sensíveis no banco
- Build de algumas rotas (mesmo que não use)

## ✅ SOLUÇÃO RÁPIDA

### No Servidor (onde está rodando Docker):

```bash
cd ~/chat-ui  # (ou seu diretório)

# 1. Gerar chave secreta
openssl rand -base64 32

# Vai gerar algo como:
# xK7mP9qR2vN5wL8tY3sF1aE6bJ4nC0dH9gM2vX7uZ5A=
```

### 2. Configurar .env.docker.prod

```bash
nano .env.docker.prod
```

**Conteúdo completo:**
```env
# Backend API
CUSTOM_API_URL=https://seu-backend.com/api

# Chave de criptografia (cole a chave gerada acima)
KEY_VAULTS_SECRET=xK7mP9qR2vN5wL8tY3sF1aE6bJ4nC0dH9gM2vX7uZ5A=
```

**Salvar:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 3. Refazer Build

```bash
./docker-prod.sh build
```

---

## 🚀 COMANDOS COMPLETOS

```bash
# No servidor
cd ~/chat-ui

# Gerar chave
KEY_SECRET=$(openssl rand -base64 32)

# Criar arquivo .env com tudo
cat > .env.docker.prod << EOF
CUSTOM_API_URL=https://seu-backend.com/api
KEY_VAULTS_SECRET=$KEY_SECRET
EOF

# Verificar
cat .env.docker.prod

# Build
./docker-prod.sh build
```

---

## ⚠️ IMPORTANTE

### Se ainda não tiver o código no servidor:

Você precisa **fazer upload do código** antes de rodar o build.

**Método 1: Git Clone (RECOMENDADO)**
```bash
cd ~
git clone https://github.com/seu-usuario/lobechat-dev.git chat-ui
cd chat-ui
```

**Método 2: Upload Manual**
- Use SCP/SFTP para fazer upload de `/home/ignitor/projects/lobechat-dev`
- Para o servidor em `~/chat-ui`

---

## 📋 CHECKLIST ANTES DO BUILD

- [ ] Código está no servidor (`cd ~/chat-ui`)
- [ ] Arquivo `.env.docker.prod` existe
- [ ] `CUSTOM_API_URL` configurado com URL real
- [ ] `KEY_VAULTS_SECRET` gerado e configurado
- [ ] Script `docker-prod.sh` existe e é executável
- [ ] Docker e Docker Compose instalados

---

## 🔍 VERIFICAR SE ESTÁ CORRETO

```bash
# Ver se .env existe e está configurado
cat .env.docker.prod

# Deve mostrar:
# CUSTOM_API_URL=https://...
# KEY_VAULTS_SECRET=...

# Ver se tem pelo menos 20 caracteres
echo $KEY_VAULTS_SECRET | wc -c
# Deve ser > 20
```

---

## 🐛 SE AINDA DER ERRO

### Erro: "CUSTOM_API_URL variable is not set"

**Solução:**
```bash
# Verificar se .env.docker.prod existe
ls -la .env.docker.prod

# Se não existir, criar:
nano .env.docker.prod
```

### Erro: "Permission denied"

**Solução:**
```bash
chmod +x docker-prod.sh
```

### Erro: "docker: command not found"

**Solução:**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## ✅ APÓS CORREÇÃO

O build deve completar com sucesso:

```
✓ Compiled successfully in 9.0min
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

✅ Build concluído!
```

---

## 🚀 PRÓXIMOS PASSOS

Depois do build bem-sucedido:

```bash
# 1. Iniciar
./docker-prod.sh start

# 2. Ver logs
./docker-prod.sh logs

# 3. Verificar status
./docker-prod.sh status

# 4. Acessar
# http://seu-servidor:3210
```

---

## 📝 RESUMO

**Problema:** Faltava `KEY_VAULTS_SECRET`  
**Solução:** Gerar com `openssl rand -base64 32` e adicionar ao `.env.docker.prod`  
**Tempo:** 2 minutos para corrigir  
**Status:** ✅ Corrigido

---

**Criado:** Novembro 15, 2025  
**Erro:** KEY_VAULTS_SECRET não configurado  
**Solução:** Documentada acima



