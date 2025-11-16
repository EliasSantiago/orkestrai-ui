# 🔑 Guia: Obter Dados SSH para GitHub Secrets

## ⚠️ IMPORTANTE: Não é da sua máquina local!

Os secrets `GCP_USERNAME` e `GCP_SSH_KEY` são para conectar no **SERVIDOR DE PRODUÇÃO**, não na sua máquina local!

---

## 📋 Informações Necessárias

### 1. `GCP_USERNAME` - Usuário SSH do Servidor

**O que é:** O nome de usuário que você usa para fazer SSH no servidor de produção.

**Como identificar:**

Quando você faz SSH no servidor, você usa um comando assim:
```bash
ssh USUARIO@IP-DO-SERVIDOR
```

No seu caso, baseado nos logs anteriores, é:
```bash
ssh ignitor_online@34.42.168.19
```

**Então:**
- `GCP_USERNAME` = `ignitor_online`
- `GCP_HOST` = `34.42.168.19`

---

### 2. `GCP_SSH_KEY` - Chave SSH Privada

**O que é:** A chave privada que permite conectar no servidor sem senha.

**Onde encontrar:** Na sua máquina **local**, dentro do diretório `~/.ssh/`

---

## 🔍 Passo a Passo: Encontrar Suas Chaves SSH

### 1️⃣ Listar chaves existentes

Na sua **máquina local**, execute:

```bash
ls -la ~/.ssh/
```

**Você verá arquivos como:**
```
id_rsa          ← Chave PRIVADA (RSA)
id_rsa.pub      ← Chave PÚBLICA (RSA)
id_ed25519      ← Chave PRIVADA (ED25519)
id_ed25519.pub  ← Chave PÚBLICA (ED25519)
known_hosts
config
```

**Tipos de chaves:**
- `id_rsa` / `id_rsa.pub` - RSA (formato antigo)
- `id_ed25519` / `id_ed25519.pub` - ED25519 (formato moderno, recomendado)
- Sem extensão = PRIVADA (usar no GitHub)
- Com `.pub` = PÚBLICA (está no servidor)

---

### 2️⃣ Verificar qual chave está no servidor

```bash
# Conectar no servidor
ssh ignitor_online@34.42.168.19

# Ver chaves autorizadas no servidor
cat ~/.ssh/authorized_keys
```

**Você verá algo como:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK... user@local-machine
```

**Identificar o tipo:**
- Se começa com `ssh-ed25519` → sua chave local é `~/.ssh/id_ed25519`
- Se começa com `ssh-rsa` → sua chave local é `~/.ssh/id_rsa`

---

### 3️⃣ Ver sua chave PRIVADA

**Na sua máquina local:**

```bash
# Para chave ED25519 (recomendado)
cat ~/.ssh/id_ed25519

# OU para chave RSA (antigo)
cat ~/.ssh/id_rsa
```

**Resultado será algo como:**

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBK5tTZZB3...
...muitas linhas...
...J9xK8NvU2Qw==
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ ATENÇÃO:**
- Esta é a chave **PRIVADA** - nunca compartilhe publicamente!
- Copie **TUDO**, incluindo as linhas `-----BEGIN` e `-----END`
- Use esta chave inteira no secret `GCP_SSH_KEY`

---

## 🎯 Resumo Rápido

### Descobrir `GCP_USERNAME`:

```bash
# Como você conecta no servidor?
ssh USUARIO@IP

# Exemplo do seu caso:
ssh ignitor_online@34.42.168.19

# GCP_USERNAME = ignitor_online ✅
```

---

### Descobrir `GCP_SSH_KEY`:

```bash
# 1. Ver qual chave está no servidor
ssh ignitor_online@34.42.168.19
cat ~/.ssh/authorized_keys
exit

# 2. Ver a chave PRIVADA correspondente (na sua máquina local)
cat ~/.ssh/id_ed25519
# OU
cat ~/.ssh/id_rsa

# 3. Copiar TUDO para o secret GCP_SSH_KEY ✅
```

---

## 🔒 Adicionar no GitHub

### 1. Copiar a chave privada

```bash
# Mostrar a chave (na sua máquina local)
cat ~/.ssh/id_ed25519

# Copiar TODO o conteúdo (incluindo BEGIN e END)
```

### 2. Adicionar no GitHub

```
Settings → Secrets and variables → Actions → New repository secret

Nome: GCP_SSH_KEY
Valor: [COLAR CHAVE COMPLETA AQUI]

Exemplo:
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
-----END OPENSSH PRIVATE KEY-----
```

---

## 🧪 Testar a Conexão

**Na sua máquina local:**

```bash
# Testar conexão SSH
ssh -i ~/.ssh/id_ed25519 ignitor_online@34.42.168.19

# Se funcionar, está tudo certo! ✅
```

Se não funcionar:
```bash
# Debug detalhado
ssh -v -i ~/.ssh/id_ed25519 ignitor_online@34.42.168.19
```

---

## ❓ Perguntas Comuns

### 1. E se eu não tiver chave SSH?

**Criar uma nova:**

```bash
# Gerar chave ED25519 (recomendado)
ssh-keygen -t ed25519 -C "github-actions-deploy"

# Pressione Enter para salvar no local padrão
# Configure senha (ou deixe vazio)

# Copiar chave pública para o servidor
ssh-copy-id -i ~/.ssh/id_ed25519.pub ignitor_online@34.42.168.19

# Testar
ssh -i ~/.ssh/id_ed25519 ignitor_online@34.42.168.19
```

---

### 2. Como eu conecto no servidor atualmente?

**Opção A: Com chave específica:**
```bash
ssh -i /caminho/para/chave ignitor_online@34.42.168.19
```

**Opção B: Com senha:**
```bash
ssh ignitor_online@34.42.168.19
# (pede senha)
```

Se você usa senha, precisa configurar uma chave SSH!

---

### 3. E se eu uso senha ao invés de chave?

Você precisa criar uma chave SSH e copiar para o servidor:

```bash
# 1. Gerar chave
ssh-keygen -t ed25519 -C "deploy-automation"

# 2. Copiar para servidor
ssh-copy-id ignitor_online@34.42.168.19

# 3. Testar (não deve pedir senha)
ssh ignitor_online@34.42.168.19
```

---

## 📝 Template para GitHub Secrets

Após descobrir os valores, adicione no GitHub:

```yaml
# Secrets do GitHub Actions
GCP_HOST=34.42.168.19
GCP_USERNAME=ignitor_online
GCP_SSH_KEY=<conteúdo-da-chave-privada-completa>
GCP_SSH_PORT=22
```

---

## 🔐 Segurança

### ✅ O que PODE:
- Compartilhar chave PÚBLICA (`.pub`)
- Adicionar chave PRIVADA nos GitHub Secrets
- Usar a mesma chave em múltiplos repositórios

### ❌ O que NÃO PODE:
- Compartilhar chave PRIVADA publicamente
- Commitar chave privada no Git
- Enviar chave privada por email/chat

---

## 🎯 Checklist Final

Antes de adicionar no GitHub, verifique:

- [ ] Você consegue fazer SSH no servidor
- [ ] Você sabe o usuário SSH (`ignitor_online`)
- [ ] Você sabe o IP do servidor (`34.42.168.19`)
- [ ] Você encontrou sua chave privada (`~/.ssh/id_ed25519` ou `~/.ssh/id_rsa`)
- [ ] Você testou a conexão com a chave
- [ ] Você copiou a chave COMPLETA (incluindo BEGIN e END)

---

## 🆘 Precisa de Ajuda?

### Comando debug completo:

```bash
# Ver suas chaves
echo "=== Chaves na máquina local ==="
ls -la ~/.ssh/

echo ""
echo "=== Conteúdo da chave ED25519 ==="
cat ~/.ssh/id_ed25519 2>/dev/null || echo "Não existe"

echo ""
echo "=== Conteúdo da chave RSA ==="
cat ~/.ssh/id_rsa 2>/dev/null || echo "Não existe"

echo ""
echo "=== Testar conexão ==="
ssh -T ignitor_online@34.42.168.19
```

---

**Última atualização:** Novembro 16, 2025  
**Servidor:** 34.42.168.19  
**Usuário:** ignitor_online

