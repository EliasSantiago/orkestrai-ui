# 🔐 GitHub Secrets - Configuração Completa

## ✅ Checklist de Secrets Necessários

Acesse: https://github.com/EliasSantiago/orkestrai-ui/settings/secrets/actions

### 1. CUSTOM_API_URL

```
Name:  CUSTOM_API_URL
Value: http://34.42.168.19:8001
```

**Como adicionar:**
1. Clique em "New repository secret"
2. Name: `CUSTOM_API_URL`
3. Value: `http://34.42.168.19:8001`
4. Add secret

---

### 2. KEY_VAULTS_SECRET

```
Name:  KEY_VAULTS_SECRET
Value: /Ke1pCM6xIsLZrRVUs5wp0mjsoKRsU+kqTBWVjWm/NE=
```

**⚠️ IMPORTANTE:** Você pode usar o valor acima OU gerar um novo com:

```bash
openssl rand -base64 32
```

**Como adicionar:**
1. Clique em "New repository secret"
2. Name: `KEY_VAULTS_SECRET`
3. Value: (cole o valor acima ou gere um novo)
4. Add secret

---

### 3. GCP_HOST

```
Name:  GCP_HOST
Value: [IP do seu servidor]
```

**Como adicionar:**
1. Clique em "New repository secret"
2. Name: `GCP_HOST`
3. Value: (IP do servidor, ex: `34.42.168.19`)
4. Add secret

---

### 4. GCP_USERNAME

```
Name:  GCP_USERNAME
Value: [Usuário SSH do servidor]
```

**Como adicionar:**
1. Clique em "New repository secret"
2. Name: `GCP_USERNAME`
3. Value: (usuário SSH, ex: `github-actions-deploy`)
4. Add secret

---

### 5. GCP_SSH_KEY

```
Name:  GCP_SSH_KEY
Value: [Conteúdo da chave privada SSH]
```

**Como obter o valor:**

```bash
# Exibir chave privada (copie TODO o conteúdo)
cat ~/.ssh/id_ed25519

# Deve começar com:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... (várias linhas)
# -----END OPENSSH PRIVATE KEY-----
```

**Como adicionar:**
1. Clique em "New repository secret"
2. Name: `GCP_SSH_KEY`
3. Value: (cole TODO o conteúdo da chave privada, incluindo BEGIN e END)
4. Add secret

---

### 6. GCP_SSH_PORT

```
Name:  GCP_SSH_PORT
Value: 22
```

**Como adicionar:**
1. Clique em "New repository secret"
2. Name: `GCP_SSH_PORT`
3. Value: `22` (ou outra porta SSH se diferente)
4. Add secret

---

## ✅ Verificação Final

Após adicionar todos os secrets, verifique em:
https://github.com/EliasSantiago/orkestrai-ui/settings/secrets/actions

Você deve ver **6 secrets** listados:
- ✅ CUSTOM_API_URL
- ✅ KEY_VAULTS_SECRET
- ✅ GCP_HOST
- ✅ GCP_USERNAME
- ✅ GCP_SSH_KEY
- ✅ GCP_SSH_PORT

---

## 🔄 Como os Secrets são Usados

### Durante o Build (GitHub Actions):

```yaml
build-args: |
  NEXT_PUBLIC_CUSTOM_API_BASE_URL=${{ secrets.CUSTOM_API_URL }}
  KEY_VAULTS_SECRET=${{ secrets.KEY_VAULTS_SECRET }}
```

### Durante o Deploy (SSH no servidor):

```bash
# GitHub Actions cria .env no servidor:
cat > .env << 'EOF_ENV'
CUSTOM_API_URL=${{ secrets.CUSTOM_API_URL }}
KEY_VAULTS_SECRET=${{ secrets.KEY_VAULTS_SECRET }}
EOF_ENV

# Docker Compose lê .env e passa para container:
docker-compose -f docker-compose.prod.yml up -d
```

### No Container (Runtime):

```bash
# Container recebe as variáveis:
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://34.42.168.19:8001
KEY_VAULTS_SECRET=/Ke1pCM6xIsLZrRVUs5wp0mjsoKRsU+kqTBWVjWm/NE=
```

---

## 🧪 Teste de Verificação

Após adicionar os secrets e fazer deploy:

```bash
# 1. SSH no servidor
ssh user@server

# 2. Verificar .env foi criado
cd ~/chat-ui
cat .env

# Deve mostrar:
# CUSTOM_API_URL=http://34.42.168.19:8001
# KEY_VAULTS_SECRET=/Ke1pCM6xIsLZrRVUs5wp0mjsoKRsU+kqTBWVjWm/NE=

# 3. Verificar variáveis no container
docker exec lobechat-production env | grep -E "CUSTOM|KEY_VAULTS"

# Deve mostrar:
# NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://34.42.168.19:8001
# KEY_VAULTS_SECRET=/Ke1pCM6xIsLZrRVUs5wp0mjsoKRsU+kqTBWVjWm/NE=
```

---

## 🚨 Troubleshooting

### Secret não aparece no container:

1. Verifique se o secret está no GitHub
2. Re-run o workflow no GitHub Actions
3. Verifique logs do deploy

### .env não foi criado no servidor:

```bash
# Criar manualmente:
cd ~/chat-ui
cat > .env << 'EOF'
CUSTOM_API_URL=http://34.42.168.19:8001
KEY_VAULTS_SECRET=/Ke1pCM6xIsLZrRVUs5wp0mjsoKRsU+kqTBWVjWm/NE=
EOF

# Restartar container:
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ Próximos Passos

1. [ ] Adicionar todos os 6 secrets no GitHub
2. [ ] Fazer commit das mudanças de código
3. [ ] Push para main
4. [ ] Monitorar GitHub Actions
5. [ ] Verificar .env no servidor
6. [ ] Testar login no frontend

🎉 **Tudo pronto para deploy automático!**

