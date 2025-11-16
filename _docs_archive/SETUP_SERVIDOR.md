# 🚀 Setup Inicial no Servidor

## ❌ Erro Comum: "No such file or directory"

Se você recebeu este erro:
```bash
-bash: ./docker-prod.sh: No such file or directory
```

**Causa:** Você não está no diretório correto ou não clonou o repositório ainda.

---

## ✅ SOLUÇÃO: Setup Passo a Passo

### 1️⃣ Verificar Onde Você Está

```bash
pwd
# Mostra o diretório atual
```

---

### 2️⃣ Opção A: Clonar do GitHub (RECOMENDADO)

Se você tem o código no GitHub:

```bash
# Ir para o diretório home
cd ~

# Clonar repositório
git clone https://github.com/seu-usuario/seu-repositorio.git

# Entrar no diretório
cd seu-repositorio

# Verificar se script existe
ls -la docker-prod.sh
```

---

### 2️⃣ Opção B: Upload Manual (Se Não Tem no GitHub)

#### No Seu Computador Local:

```bash
# Comprimir o projeto (excluindo node_modules e .next)
cd /home/ignitor/projects/lobechat-dev
tar -czf lobechat-prod.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='*.log' \
  .
```

#### Upload para Servidor:

```bash
# Usando SCP
scp lobechat-prod.tar.gz ignitor_online@seu-servidor:/home/ignitor_online/

# Ou usando SFTP (FileZilla, WinSCP, etc)
```

#### No Servidor:

```bash
cd ~
tar -xzf lobechat-prod.tar.gz -C lobechat-dev
cd lobechat-dev

# Tornar scripts executáveis
chmod +x docker-prod.sh
chmod +x docker-local.sh
chmod +x dev.sh

# Verificar
ls -la docker-prod.sh
```

---

### 2️⃣ Opção C: Criar Script Manualmente (Rápido)

Se você só precisa do script de deploy:

```bash
# Criar diretório
mkdir -p ~/lobechat-dev
cd ~/lobechat-dev

# Criar script
nano docker-prod.sh
```

**Cole este conteúdo:**

```bash
#!/bin/bash

# =========================================
# Script de Deploy Docker para Produção
# =========================================

set -e

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.docker.prod"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "🐳 Docker Deploy - Produção"
echo ""

# Verificar se .env existe
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Arquivo $ENV_FILE não encontrado!${NC}"
    echo ""
    echo "Crie o arquivo com:"
    echo "  CUSTOM_API_URL=https://seu-backend.com/api"
    echo ""
    exit 1
fi

case "$1" in
    build)
        echo "🔨 Fazendo build da imagem de produção..."
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE build --no-cache
        echo ""
        echo -e "${GREEN}✅ Build concluído!${NC}"
        ;;
    
    start)
        echo "🚀 Iniciando aplicação em produção..."
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
        echo ""
        echo -e "${GREEN}✅ Aplicação iniciada!${NC}"
        echo ""
        echo "Verifique os logs com: ./docker-prod.sh logs"
        ;;
    
    stop)
        echo "🛑 Parando aplicação..."
        docker-compose -f $COMPOSE_FILE down
        echo ""
        echo -e "${GREEN}✅ Aplicação parada!${NC}"
        ;;
    
    restart)
        echo "🔄 Reiniciando aplicação..."
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE restart
        echo ""
        echo -e "${GREEN}✅ Aplicação reiniciada!${NC}"
        ;;
    
    logs)
        echo "📋 Logs da aplicação (Ctrl+C para sair):"
        echo ""
        docker-compose -f $COMPOSE_FILE logs -f --tail=100
        ;;
    
    status)
        echo "📊 Status dos containers:"
        echo ""
        docker-compose -f $COMPOSE_FILE ps
        ;;
    
    update)
        echo "🔄 Atualizando aplicação..."
        echo ""
        echo "1. Parando aplicação..."
        docker-compose -f $COMPOSE_FILE down
        
        echo "2. Fazendo pull do código..."
        git pull
        
        echo "3. Fazendo build da nova versão..."
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE build --no-cache
        
        echo "4. Iniciando nova versão..."
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
        
        echo ""
        echo -e "${GREEN}✅ Atualização concluída!${NC}"
        echo ""
        echo "Verifique os logs: ./docker-prod.sh logs"
        ;;
    
    shell)
        echo "🐚 Acessando shell do container..."
        docker exec -it lobechat-production sh
        ;;
    
    clean)
        echo -e "${YELLOW}⚠️  Isso irá remover a imagem e liberar espaço${NC}"
        read -p "Continuar? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🧹 Limpando..."
            docker-compose -f $COMPOSE_FILE down --rmi all --volumes
            docker system prune -f
            echo ""
            echo -e "${GREEN}✅ Limpeza concluída!${NC}"
        fi
        ;;
    
    *)
        echo "Uso: ./docker-prod.sh {comando}"
        echo ""
        echo "Comandos disponíveis:"
        echo "  build    - Fazer build da imagem"
        echo "  start    - Iniciar aplicação"
        echo "  stop     - Parar aplicação"
        echo "  restart  - Reiniciar aplicação"
        echo "  logs     - Ver logs em tempo real"
        echo "  status   - Ver status dos containers"
        echo "  update   - Atualizar código e rebuild"
        echo "  shell    - Acessar shell do container"
        echo "  clean    - Limpar imagens e liberar espaço"
        echo ""
        exit 1
        ;;
esac
```

**Salvar:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Tornar executável:**
```bash
chmod +x docker-prod.sh
```

---

### 3️⃣ Verificar Pré-requisitos

```bash
# Verificar Docker
docker --version
# Esperado: Docker version 20.x ou superior

# Verificar Docker Compose
docker-compose --version
# Esperado: docker-compose version 1.29 ou superior

# Se não tiver Docker instalado:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

---

### 4️⃣ Verificar Estrutura de Arquivos

```bash
cd ~/lobechat-dev
ls -la

# Você deve ter:
# - docker-prod.sh (executável)
# - docker-compose.prod.yml
# - Dockerfile.local
# - src/ (diretório com código)
# - package.json
# - next.config.ts
```

---

## 🎯 MÉTODO RECOMENDADO: Git Clone

### No Servidor:

```bash
# 1. Configurar Git (se ainda não fez)
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# 2. Clonar repositório
cd ~
git clone https://github.com/seu-usuario/lobechat-dev.git
cd lobechat-dev

# 3. Tornar scripts executáveis
chmod +x docker-prod.sh
chmod +x docker-local.sh
chmod +x dev.sh

# 4. Configurar variáveis
nano .env.docker.prod
```

**Conteúdo do .env.docker.prod:**
```
CUSTOM_API_URL=https://seu-backend.com/api
```

**Salvar:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# 5. Build e Start
./docker-prod.sh build
./docker-prod.sh start
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Permission denied"

```bash
chmod +x docker-prod.sh
./docker-prod.sh build
```

---

### Erro: "docker: command not found"

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Logout e login novamente
exit
# (fazer login novamente)

# Verificar
docker --version
```

---

### Erro: "Got permission denied while trying to connect to the Docker daemon socket"

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Ou usar sudo
sudo ./docker-prod.sh build
```

---

## ✅ CHECKLIST

- [ ] Você está no diretório correto (`cd ~/lobechat-dev`)
- [ ] Arquivo `docker-prod.sh` existe (`ls -la docker-prod.sh`)
- [ ] Script é executável (`chmod +x docker-prod.sh`)
- [ ] Docker está instalado (`docker --version`)
- [ ] Docker Compose está instalado (`docker-compose --version`)
- [ ] Arquivo `.env.docker.prod` existe e configurado
- [ ] Todos os arquivos necessários estão presentes

---

## 🚀 RESUMO: Setup Completo

```bash
# No servidor
cd ~
git clone https://github.com/seu-usuario/lobechat-dev.git
cd lobechat-dev
chmod +x *.sh
echo "CUSTOM_API_URL=https://seu-backend.com/api" > .env.docker.prod
./docker-prod.sh build
./docker-prod.sh start
./docker-prod.sh logs
```

---

## 📞 PRÓXIMOS PASSOS

Depois que resolver o problema do diretório:

1. ✅ Configurar `.env.docker.prod`
2. ✅ Executar `./docker-prod.sh build`
3. ✅ Executar `./docker-prod.sh start`
4. ✅ Verificar logs: `./docker-prod.sh logs`

---

**Criado:** Novembro 15, 2025  
**Erro comum:** Diretório errado ou arquivo não clonado  
**Solução:** Seguir este guia passo a passo

