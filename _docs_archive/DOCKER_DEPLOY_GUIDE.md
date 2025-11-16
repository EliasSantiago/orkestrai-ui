# 🚀 Guia de Deploy Docker - Passo a Passo

## ✅ Sua Estrutura Está PERFEITA!

**Confirmado:** Seu Docker vai usar SEU CÓDIGO CLONADO, não imagem oficial! ✅

---

## 📋 Checklist Pré-Deploy

- [ ] Servidor com Docker instalado
- [ ] Servidor com Docker Compose instalado
- [ ] Git instalado no servidor
- [ ] Backend Python rodando e acessível
- [ ] Pelo menos 2GB RAM disponível
- [ ] Pelo menos 10GB espaço em disco

---

## 🚀 DEPLOY EM 4 PASSOS

### Passo 1: Clonar Repositório

```bash
# No seu servidor
cd /home/seu-usuario/
git clone https://github.com/seu-usuario/lobechat-dev.git
cd lobechat-dev
```

**Resultado:** Seu código está no servidor ✅

---

### Passo 2: Configurar Backend URL

```bash
# Copiar template
cp .env.docker.prod.example .env.docker.prod

# Editar com URL real
nano .env.docker.prod
```

**Conteúdo do arquivo:**
```bash
CUSTOM_API_URL=https://seu-backend-real.com/api
```

**⚠️ IMPORTANTE:** Substitua `https://seu-backend-real.com/api` pela URL real do seu backend Python!

**Salvar:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

### Passo 3: Build da Imagem

```bash
./docker-prod.sh build
```

**O que acontece:**
```
🔨 Fazendo build da imagem de produção...
[+] Building 1200.0s
 => [internal] load build definition
 => [internal] load .dockerignore
 => COPY package.json
 => COPY src/
 => RUN pnpm install
 => RUN pnpm build
 => Creating image: lobechat-custom:production
✅ Build concluído!
```

**Tempo:** 15-20 minutos (apenas primeira vez!)

---

### Passo 4: Iniciar Aplicação

```bash
./docker-prod.sh start
```

**O que acontece:**
```
🚀 Iniciando aplicação em produção...
[+] Running 1/1
 ✓ Container lobechat-production  Started
✅ Aplicação iniciada!
```

**Tempo:** 30 segundos

---

## ✅ Verificar Se Está Funcionando

### 1. Ver Status

```bash
./docker-prod.sh status
```

**Esperado:**
```
NAME                  STATUS         PORTS
lobechat-production   Up 2 minutes   0.0.0.0:3210->3210/tcp
```

### 2. Ver Logs

```bash
./docker-prod.sh logs
```

**Esperado:**
```
Listening on port 3210
Ready in 2.5s
```

### 3. Testar no Navegador

```
http://seu-servidor:3210
```

**Ou com domínio:**
```
https://seu-dominio.com
```

---

## 🔄 ATUALIZAÇÕES (Futuras)

### Quando fizer mudanças no código:

```bash
# 1. Commitar mudanças
git add .
git commit -m "Minhas mudanças"
git push

# 2. No servidor, atualizar
cd /home/seu-usuario/lobechat-dev
./docker-prod.sh update
```

**O que acontece:**
```
1. Parando aplicação...
2. Fazendo pull do código...      ← Baixa suas mudanças
3. Fazendo build da nova versão... ← Rebuilda
4. Iniciando nova versão...        ← Sobe nova versão
✅ Atualização concluída!
```

**Tempo:** 5-10 minutos (com cache)

---

## 🛠️ COMANDOS ÚTEIS

### Gerenciamento Básico

```bash
# Ver logs em tempo real
./docker-prod.sh logs

# Ver status
./docker-prod.sh status

# Reiniciar
./docker-prod.sh restart

# Parar
./docker-prod.sh stop

# Iniciar novamente
./docker-prod.sh start
```

### Debugging

```bash
# Acessar shell do container
./docker-prod.sh shell

# Dentro do container, você pode:
ls -la /app/src/services/  # Ver seus arquivos
cat /app/.next/BUILD_ID    # Ver versão do build
```

### Manutenção

```bash
# Limpar espaço (remove imagens antigas)
./docker-prod.sh clean

# Rebuild completo (do zero)
./docker-prod.sh build
```

---

## 🐛 TROUBLESHOOTING

### Problema: Build Falha

**Erro:**
```
ERROR: failed to solve: process did not complete successfully
```

**Solução:**
```bash
# 1. Verificar espaço em disco
df -h

# 2. Limpar Docker
docker system prune -a

# 3. Tentar novamente
./docker-prod.sh build
```

---

### Problema: Container Não Inicia

**Erro:**
```
Error: NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured
```

**Solução:**
```bash
# Verificar se .env.docker.prod existe
cat .env.docker.prod

# Se não existir, criar:
echo "CUSTOM_API_URL=https://seu-backend.com/api" > .env.docker.prod
./docker-prod.sh start
```

---

### Problema: Backend Não Responde

**Erro:**
```
Failed to fetch from backend
```

**Solução:**
```bash
# 1. Verificar se backend está rodando
curl https://seu-backend.com/api/health

# 2. Verificar CORS no backend
# Adicionar no backend (FastAPI):
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://seu-dominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Problema: Porta 3210 Ocupada

**Erro:**
```
Error: port 3210 is already allocated
```

**Solução:**
```bash
# Ver o que está usando a porta
sudo lsof -i :3210

# Parar o processo
sudo kill -9 <PID>

# Ou mudar porta no docker-compose.prod.yml:
# ports: - "3211:3210"
```

---

## 🌐 CONFIGURAR NGINX (Opcional)

### 1. Instalar Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 2. Configurar

```bash
sudo nano /etc/nginx/sites-available/lobechat
```

**Conteúdo:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Ativar

```bash
sudo ln -s /etc/nginx/sites-available/lobechat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

---

## 📊 MONITORAMENTO

### Ver Uso de Recursos

```bash
# CPU e Memória
docker stats lobechat-production

# Logs com timestamp
./docker-prod.sh logs | grep "Error"

# Espaço em disco
df -h
```

### Logs Persistentes

```bash
# Ver logs salvos
docker inspect lobechat-production | grep LogPath

# Logs estão em:
/var/lib/docker/containers/<container-id>/*.log
```

---

## 🎯 FLUXO VISUAL

```
┌─────────────────────────────────────────┐
│  1. git clone                           │
│     ↓                                   │
│  2. Configurar .env.docker.prod         │
│     ↓                                   │
│  3. ./docker-prod.sh build              │
│     ↓                                   │
│  4. ./docker-prod.sh start              │
│     ↓                                   │
│  ✅ Aplicação Rodando!                  │
└─────────────────────────────────────────┘

Atualizações:
┌─────────────────────────────────────────┐
│  1. git commit + push                   │
│     ↓                                   │
│  2. ./docker-prod.sh update             │
│     ↓                                   │
│  ✅ Nova Versão Rodando!                │
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST FINAL

### Antes de Considerar Deploy Completo:

- [ ] Build executado com sucesso
- [ ] Container iniciado (status: Up)
- [ ] Logs não mostram erros
- [ ] Aplicação acessível no navegador
- [ ] Login funciona
- [ ] Chat funciona
- [ ] Backend responde
- [ ] CORS configurado no backend
- [ ] (Opcional) Nginx configurado
- [ ] (Opcional) SSL configurado

---

## 🎉 CONCLUSÃO

Sua estrutura Docker está **perfeita** e **pronta** para produção!

**Comandos essenciais:**
```bash
# Setup inicial
./docker-prod.sh build
./docker-prod.sh start

# Atualizações
./docker-prod.sh update

# Monitoramento
./docker-prod.sh logs
./docker-prod.sh status
```

**Próximo passo:**
```bash
./docker-prod.sh build
```

**Tempo total:** 20 minutos até estar online! 🚀

---

**Criado:** Novembro 15, 2025  
**Status:** ✅ Pronto para usar  
**Dificuldade:** Baixa (tudo automatizado)

