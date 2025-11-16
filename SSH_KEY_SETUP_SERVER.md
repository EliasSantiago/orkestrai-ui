# 🔐 Adicionar Chave SSH no Servidor

## ❓ Você Precisa Fazer Isso?

**Teste primeiro!**

```bash
# Na sua máquina LOCAL, tente conectar:
ssh ignitor_online@34.42.168.19
```

### Resultado A: ✅ Conectou SEM pedir senha
- **Sua chave JÁ ESTÁ no servidor!**
- **NÃO precisa fazer nada!**
- Apenas copie a chave privada para o GitHub Secret

### Resultado B: ❌ Pediu senha
- **Sua chave NÃO ESTÁ no servidor**
- **SIM, precisa adicionar!**
- Siga os passos abaixo ⬇️

---

## 🚀 Passo a Passo: Adicionar Chave SSH no Servidor

### Método 1: Usando `ssh-copy-id` (Recomendado - Mais Fácil!)

**Na sua máquina LOCAL:**

```bash
# Copiar chave ED25519 para o servidor
ssh-copy-id -i ~/.ssh/id_ed25519.pub ignitor_online@34.42.168.19

# OU, se você usa chave RSA
ssh-copy-id -i ~/.ssh/id_rsa.pub ignitor_online@34.42.168.19
```

**O que vai acontecer:**
1. Pedirá a senha do servidor (última vez!)
2. Copiará sua chave pública automaticamente
3. Configurará permissões corretas

**Testar:**
```bash
# Agora deve conectar SEM senha
ssh ignitor_online@34.42.168.19
```

✅ Se conectou sem senha = **Sucesso!**

---

### Método 2: Manual (Se não tiver ssh-copy-id)

**Passo 1: Ver sua chave PÚBLICA (na máquina LOCAL)**

```bash
# Chave ED25519
cat ~/.ssh/id_ed25519.pub

# OU chave RSA
cat ~/.ssh/id_rsa.pub
```

**Copie o resultado** (será uma linha como):
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK... user@machine
```

**Passo 2: Conectar no servidor e adicionar a chave**

```bash
# Conectar no servidor (vai pedir senha)
ssh ignitor_online@34.42.168.19

# No servidor, criar diretório SSH (se não existir)
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Adicionar sua chave pública
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK... user@machine" >> ~/.ssh/authorized_keys

# Configurar permissões corretas
chmod 600 ~/.ssh/authorized_keys

# Sair do servidor
exit
```

**Passo 3: Testar**

```bash
# Deve conectar SEM senha agora
ssh ignitor_online@34.42.168.19
```

---

## 🔍 Verificar se a Chave Está no Servidor

**Conectar no servidor:**

```bash
ssh ignitor_online@34.42.168.19
```

**Ver chaves autorizadas:**

```bash
cat ~/.ssh/authorized_keys
```

**Você deve ver algo como:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK7B... user@local-machine
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... another@machine
```

Cada linha é uma chave pública autorizada a conectar.

---

## 🔑 Entendendo: Chave Pública vs Privada

### Chave PÚBLICA (`.pub`)
- **Fica no SERVIDOR** (`~/.ssh/authorized_keys`)
- Pode ser compartilhada
- Usada para VERIFICAR sua identidade

### Chave PRIVADA (sem `.pub`)
- **Fica na SUA MÁQUINA LOCAL** (`~/.ssh/id_ed25519`)
- NUNCA compartilhar publicamente
- Usada para PROVAR sua identidade
- Esta vai no GitHub Secret

---

## 🆘 Problemas Comuns

### 1. Ainda pede senha após adicionar chave

**Verificar permissões no servidor:**

```bash
# Conectar no servidor
ssh ignitor_online@34.42.168.19

# Verificar permissões
ls -la ~/.ssh/

# Deve mostrar:
# drwx------  (700) .ssh/
# -rw-------  (600) authorized_keys
```

**Corrigir permissões:**

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

### 2. Erro: "Permission denied (publickey)"

**Possíveis causas:**

**A) Chave errada:**
```bash
# Especificar chave explicitamente
ssh -i ~/.ssh/id_ed25519 ignitor_online@34.42.168.19
```

**B) Chave não adicionada:**
```bash
# Ver chaves carregadas
ssh-add -l

# Se vazio, adicionar
ssh-add ~/.ssh/id_ed25519
```

**C) Debug detalhado:**
```bash
# Ver o que está acontecendo
ssh -v ignitor_online@34.42.168.19
```

---

### 3. Erro: "ssh-copy-id: command not found"

**No Windows (Git Bash/WSL):**
```bash
# Usar método manual (Método 2 acima)
```

**No macOS:**
```bash
# ssh-copy-id já vem instalado
```

**No Linux:**
```bash
# Instalar (se necessário)
sudo apt-get install openssh-client  # Debian/Ubuntu
sudo yum install openssh-clients      # CentOS/RHEL
```

---

## 🎯 Checklist de Configuração

### Na Máquina Local:
- [ ] Tenho chave SSH (`~/.ssh/id_ed25519` ou `~/.ssh/id_rsa`)
- [ ] Consegui ver a chave privada (`cat ~/.ssh/id_ed25519`)
- [ ] Consegui ver a chave pública (`cat ~/.ssh/id_ed25519.pub`)

### No Servidor:
- [ ] Chave pública está em `~/.ssh/authorized_keys`
- [ ] Permissões corretas (700 em .ssh, 600 em authorized_keys)
- [ ] Consigo conectar SEM senha

### No GitHub:
- [ ] Secret `GCP_SSH_KEY` com chave PRIVADA completa
- [ ] Secret `GCP_USERNAME` = `ignitor_online`
- [ ] Secret `GCP_HOST` = `34.42.168.19`

---

## 🧪 Teste Final

**Execute na sua máquina LOCAL:**

```bash
# 1. Testar conexão
ssh ignitor_online@34.42.168.19 "echo '✅ SSH funcionando!'"

# Se mostrou a mensagem = Perfeito!
```

**Se funcionar, você está pronto!** 🎉

---

## 📝 Resumo Visual

```
┌─────────────────────────────────────────────────────────┐
│  SUA MÁQUINA LOCAL                                      │
├─────────────────────────────────────────────────────────┤
│  ~/.ssh/id_ed25519      ← PRIVADA (GitHub Secret)      │
│  ~/.ssh/id_ed25519.pub  ← PÚBLICA (copiar p/ servidor) │
└─────────────────────────────────────────────────────────┘
                         │
                         │ ssh-copy-id
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  SERVIDOR (34.42.168.19)                                │
├─────────────────────────────────────────────────────────┤
│  ~/.ssh/authorized_keys ← Contém chave PÚBLICA         │
│  (permissões: 600)                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Próximos Passos Após Configurar

1. ✅ Testar conexão SSH sem senha
2. ✅ Copiar chave PRIVADA para GitHub Secret `GCP_SSH_KEY`
3. ✅ Adicionar outros secrets (`CUSTOM_API_URL`, `KEY_VAULTS_SECRET`)
4. ✅ Fazer push e ver o magic acontecer! 🎉

---

## 🔗 Links Úteis

- **[SSH_KEYS_GUIDE.md](./SSH_KEYS_GUIDE.md)** - Como obter chaves SSH
- **[GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)** - Configurar secrets no GitHub
- **[START.md](./START.md)** - Guia de início rápido

---

**Última atualização:** Novembro 16, 2025  
**Servidor:** 34.42.168.19  
**Usuário:** ignitor_online  
**Status:** ⚙️ Configuração de SSH

