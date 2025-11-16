# 🚀 Guia de Deploy - Produção

## 📋 Pré-requisitos

- ✅ Servidor com Docker e Docker Compose instalados
- ✅ 4 vCPUs, 16 GB RAM (ou similar)
- ✅ Backend rodando em: http://34.42.168.19:8001/

---

## 🎯 Deploy Rápido (5 Minutos)

### 1. Clonar Repositório no Servidor

```bash
# No servidor
cd ~
git clone <seu-repositorio> chat-ui
cd chat-ui
```

---

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.docker.prod.example .env.docker.prod

# Gerar chave secreta
KEY_SECRET=$(openssl rand -base64 32)
echo "KEY_VAULTS_SECRET=$KEY_SECRET" >> .env.docker.prod

# Verificar configuração
cat .env.docker.prod
```

**Deve conter:**
```env
CUSTOM_API_URL=http://34.42.168.19:8001/api
KEY_VAULTS_SECRET=<chave-gerada>
```

---

### 3. Fazer Build

```bash
# Dar permissão de execução
chmod +x docker-prod.sh

# Build (15-20 minutos na primeira vez)
./docker-prod.sh build
```

**Output esperado:**
```
✓ Compiled successfully in 9.0min
✓ Collecting page data
✓ Generating static pages
✅ Build concluído!
```

---

### 4. Iniciar Aplicação

```bash
./docker-prod.sh start
```

**Verificar:**
```bash
# Ver logs
./docker-prod.sh logs

# Ver status
./docker-prod.sh status
```

---

### 5. Testar

Acesse: **http://SEU-SERVIDOR-IP:3210**

- [ ] Página de login carrega
- [ ] Consegue fazer login
- [ ] Chat funciona

---

## 🔧 Comandos Úteis

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

# Acessar shell do container
./docker-prod.sh shell

# Atualizar código e rebuild
./docker-prod.sh update

# Limpar tudo (liberar espaço)
./docker-prod.sh clean
```

---

## 🌐 Configurar Domínio (Opcional)

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/lobechat
server {
    listen 80;
    server_name chat.seudominio.com;

    location / {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Ativar:**
```bash
sudo ln -s /etc/nginx/sites-available/lobechat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### SSL com Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d chat.seudominio.com
```

---

## 🔄 Atualizando URL do Backend

Quando tiver o domínio definitivo:

```bash
# Editar .env
nano .env.docker.prod
```

**Alterar:**
```env
# De:
CUSTOM_API_URL=http://34.42.168.19:8001/api

# Para:
CUSTOM_API_URL=https://api.seudominio.com/api
```

**Rebuild e restart:**
```bash
./docker-prod.sh stop
./docker-prod.sh build
./docker-prod.sh start
```

---

## 📊 Monitoramento

### Ver Uso de Recursos

```bash
# CPU e RAM em tempo real
docker stats lobechat-production
```

**Output esperado:**
```
CONTAINER           CPU %    MEM USAGE / LIMIT
lobechat-production 5.2%     1.2GB / 16GB
```

---

### Ver Logs de Erro

```bash
# Últimas 100 linhas
./docker-prod.sh logs | tail -100

# Filtrar erros
docker logs lobechat-production 2>&1 | grep -i error
```

---

## 🐛 Troubleshooting

### Build falha: "KEY_VAULTS_SECRET not set"

**Solução:**
```bash
# Gerar chave
openssl rand -base64 32

# Editar .env.docker.prod
nano .env.docker.prod
# Cole a chave gerada

# Rebuild
./docker-prod.sh build
```

---

### Aplicação não inicia: "Port 3210 already in use"

**Solução:**
```bash
# Ver o que está usando a porta
sudo lsof -i :3210

# Parar processo
sudo kill -9 <PID>

# Ou alterar porta no docker-compose.prod.yml
# ports:
#   - "3211:3210"  # <-- mude de 3210 para 3211
```

---

### Erro de conexão com backend

**Solução:**
```bash
# 1. Verificar se backend está rodando
curl http://34.42.168.19:8001/

# 2. Verificar se .env está correto
cat .env.docker.prod

# 3. Verificar logs do LobeChat
./docker-prod.sh logs | grep -i "custom"
```

---

### Container reiniciando constantemente

**Solução:**
```bash
# Ver logs completos
docker logs lobechat-production --tail=500

# Verificar healthcheck
docker inspect lobechat-production | grep -A 10 "Health"

# Desabilitar temporariamente o healthcheck
# Editar docker-compose.prod.yml:
# Comentar seção "healthcheck:"
```

---

## 🔒 Segurança

### Firewall

```bash
# Permitir apenas porta 80 e 443 (se usar Nginx)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Bloquear porta 3210 externamente
sudo ufw deny 3210/tcp
```

---

### Rate Limiting (Nginx)

```nginx
# Adicionar no nginx.conf
limit_req_zone $binary_remote_addr zone=lobechat:10m rate=10r/s;

# Adicionar no location /
location / {
    limit_req zone=lobechat burst=20 nodelay;
    # ... resto da config
}
```

---

## 📝 Backup

### Dados do Usuário

**Importante:** No modo client-side (padrão), os dados ficam no navegador do usuário!

- ✅ Agentes → Salvos no navegador (PGLite)
- ✅ Conversas → Salvas no navegador (PGLite)
- ⚠️ Se limpar cache do navegador, perde os dados!

**Para backup server-side, precisa configurar PostgreSQL** (veja seção abaixo)

---

### Backup da Aplicação

```bash
# Backup do código
cd ~/chat-ui
git add .
git commit -m "backup: production config"
git push

# Backup da imagem Docker
docker save lobechat-custom:production | gzip > lobechat-backup.tar.gz

# Restaurar imagem
gunzip -c lobechat-backup.tar.gz | docker load
```

---

## 🗄️ PostgreSQL (Opcional - Multi-Dispositivo)

Se precisar sincronizar dados entre dispositivos:

### 1. Adicionar PostgreSQL ao docker-compose.prod.yml

```yaml
services:
  lobechat:
    # ... configuração existente
    
    environment:
      # Adicionar:
      - DATABASE_URL=postgresql://lobechat:${POSTGRES_PASSWORD}@postgres:5432/lobechat
      - DATABASE_DRIVER=node
      - NEXT_PUBLIC_SERVICE_MODE=server
    
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    container_name: lobechat-postgres
    environment:
      POSTGRES_DB: lobechat
      POSTGRES_USER: lobechat
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### 2. Adicionar ao .env.docker.prod

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env.docker.prod
```

### 3. Rebuild

```bash
./docker-prod.sh stop
./docker-prod.sh build
./docker-prod.sh start
```

---

## 📈 Escalabilidade

### Recursos Necessários por Usuários

| Usuários | CPU | RAM | Disco |
|----------|-----|-----|-------|
| 10-20 | 0.5 vCPU | 1.5 GB | 1 GB |
| 20-50 | 1 vCPU | 2.5 GB | 2 GB |
| 50-100 | 1.5 vCPU | 4 GB | 5 GB |
| 100+ | 2+ vCPU | 6+ GB | 10+ GB |

**Seu servidor (4vCPU, 16GB):** Suporta **50-100 usuários** tranquilo!

---

## 🆘 Suporte

### Logs Importantes

```bash
# Logs da aplicação
./docker-prod.sh logs

# Logs do Docker
journalctl -u docker -f

# Logs do sistema
dmesg | tail -50
```

---

### Informações para Debug

```bash
# Versões
docker --version
docker-compose --version
node --version

# Recursos do servidor
free -h
df -h
top -bn1 | head -20

# Status do container
docker inspect lobechat-production
```

---

## ✅ Checklist de Deploy

- [ ] Servidor com Docker instalado
- [ ] Código clonado no servidor
- [ ] `.env.docker.prod` configurado
- [ ] `KEY_VAULTS_SECRET` gerado
- [ ] Backend acessível em http://34.42.168.19:8001/
- [ ] Build executado com sucesso
- [ ] Aplicação iniciada
- [ ] Porta 3210 acessível
- [ ] Login funcionando
- [ ] Chat funcionando
- [ ] Nginx configurado (opcional)
- [ ] SSL configurado (opcional)
- [ ] Firewall configurado
- [ ] Monitoramento ativo

---

## 🎉 Deploy Concluído!

Sua aplicação está rodando em:
- **Local:** http://localhost:3210
- **Servidor:** http://SEU-IP:3210
- **Domínio:** https://chat.seudominio.com (se configurou)

---

**Última atualização:** Novembro 15, 2025  
**Backend:** http://34.42.168.19:8001/  
**Versão:** Production Ready ✅

