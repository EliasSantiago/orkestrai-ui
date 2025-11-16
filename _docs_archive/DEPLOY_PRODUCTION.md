# 🚀 Deploy de Produção (Sem Docker)

## ✅ Pré-requisitos

- ✅ Backend Python rodando e acessível via HTTPS
- ✅ Node.js 20+ instalado no servidor
- ✅ pnpm instalado (`npm install -g pnpm`)
- ✅ Servidor com pelo menos 2GB RAM

---

## 📝 Passo 1: Configurar Variáveis de Ambiente

### No seu servidor de produção:

```bash
cd /home/ignitor/projects/lobechat-dev

# Copiar exemplo
cp .env.production.example .env.production

# Editar com suas URLs reais
nano .env.production
```

**Configuração obrigatória:**

```env
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
NEXT_PUBLIC_CUSTOM_API_BASE_URL=https://api.seudominio.com/api
NODE_ENV=production
APP_URL=https://chat.seudominio.com
DISABLE_MODEL_DOWNLOAD=1
OLLAMA_DISABLED=1
ENABLE_OLLAMA_PROXY=0
ENABLE_OLLAMA=0
NEXT_TELEMETRY_DISABLED=1
```

⚠️ **Substitua:**
- `https://api.seudominio.com/api` → URL real do seu backend Python
- `https://chat.seudominio.com` → URL real do seu frontend

---

## 🔨 Passo 2: Build de Produção

```bash
# Instalar dependências
pnpm install --prod=false

# Build otimizado para produção
NODE_ENV=production pnpm build
```

**O que acontece:**
- ✅ Next.js compila tudo
- ✅ Otimiza JavaScript/CSS
- ✅ Gera páginas estáticas quando possível
- ✅ Cria output standalone em `.next/`

**Tempo:** 10-15 minutos

---

## ✅ Passo 3: Testar Build Localmente

```bash
# Testar antes de fazer deploy
pnpm start
```

Acesse: `http://localhost:3210`

**Verificar:**
- ✅ Login funciona
- ✅ Chat funciona
- ✅ Agentes aparecem corretamente
- ✅ Sem erros no console do navegador

---

## 🚀 Passo 4: Deploy com PM2 (Recomendado)

### Instalar PM2

```bash
npm install -g pm2
```

### Criar arquivo de configuração PM2

```bash
nano ecosystem.config.js
```

**Conteúdo:**

```javascript
module.exports = {
  apps: [{
    name: 'lobechat',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3210',
    cwd: '/home/ignitor/projects/lobechat-dev',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3210
    },
    env_file: '.env.production',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

### Iniciar aplicação

```bash
# Criar diretório de logs
mkdir -p logs

# Iniciar com PM2
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs lobechat

# Salvar configuração
pm2 save

# Auto-start no boot do sistema
pm2 startup
```

---

## 🌐 Passo 5: Configurar Nginx (Reverse Proxy)

### Instalar Nginx

```bash
sudo apt update
sudo apt install nginx
```

### Criar configuração

```bash
sudo nano /etc/nginx/sites-available/lobechat
```

**Conteúdo:**

```nginx
server {
    listen 80;
    server_name chat.seudominio.com;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name chat.seudominio.com;

    # SSL (configurar depois com Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/chat.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.seudominio.com/privkey.pem;

    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/lobechat-access.log;
    error_log /var/log/nginx/lobechat-error.log;

    # Compressão
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Proxy para Next.js
    location / {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache de arquivos estáticos
    location /_next/static/ {
        proxy_pass http://localhost:3210;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    location /images/ {
        proxy_pass http://localhost:3210;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Ativar configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/lobechat /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 🔒 Passo 6: Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Gerar certificado SSL
sudo certbot --nginx -d chat.seudominio.com

# Seguir instruções no terminal

# Renovação automática já está configurada
sudo certbot renew --dry-run
```

---

## 🔍 Passo 7: Verificar Deployment

### Verificar PM2

```bash
pm2 status
pm2 logs lobechat --lines 50
```

### Verificar Nginx

```bash
sudo nginx -t
sudo systemctl status nginx
```

### Testar no navegador

```
https://chat.seudominio.com
```

**Verificar:**
- ✅ HTTPS funcionando
- ✅ Login funcionando
- ✅ Chat funcionando
- ✅ Sem erros no console

---

## 📊 Comandos Úteis

### PM2

```bash
# Ver logs
pm2 logs lobechat

# Reiniciar
pm2 restart lobechat

# Parar
pm2 stop lobechat

# Ver métricas
pm2 monit

# Ver informações detalhadas
pm2 show lobechat
```

### Nginx

```bash
# Ver logs de acesso
sudo tail -f /var/log/nginx/lobechat-access.log

# Ver logs de erro
sudo tail -f /var/log/nginx/lobechat-error.log

# Recarregar configuração
sudo systemctl reload nginx

# Reiniciar
sudo systemctl restart nginx
```

### Sistema

```bash
# Ver uso de memória
free -h

# Ver uso de CPU
top

# Ver processos Node.js
ps aux | grep node
```

---

## 🔄 Atualizações

Quando precisar atualizar o código:

```bash
cd /home/ignitor/projects/lobechat-dev

# Pull das mudanças
git pull

# Reinstalar dependências (se houver mudanças)
pnpm install

# Rebuild
NODE_ENV=production pnpm build

# Reiniciar PM2
pm2 restart lobechat

# Ver logs
pm2 logs lobechat
```

---

## 🐛 Troubleshooting

### Erro: "NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured"

```bash
# Verificar se .env.production existe
cat .env.production

# Verificar se PM2 está carregando o arquivo
pm2 env lobechat
```

### Erro: 502 Bad Gateway (Nginx)

```bash
# Verificar se PM2 está rodando
pm2 status

# Verificar logs
pm2 logs lobechat
```

### Erro: Memória insuficiente

```bash
# Aumentar limite de memória no ecosystem.config.js
max_memory_restart: '2G'  # de 1G para 2G

# Reiniciar
pm2 restart lobechat
```

### Erro: CORS

Adicionar no seu backend Python (FastAPI):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://chat.seudominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🎯 Checklist Final

- [ ] `.env.production` configurado corretamente
- [ ] Build de produção executado com sucesso
- [ ] PM2 rodando e salvou configuração
- [ ] Nginx configurado e rodando
- [ ] SSL/HTTPS funcionando
- [ ] Login funciona
- [ ] Chat funciona
- [ ] Backend responde corretamente
- [ ] CORS configurado no backend
- [ ] Logs sendo salvos corretamente
- [ ] Auto-restart configurado (PM2 startup)
- [ ] Renovação SSL automática (certbot)

---

## ✅ Sucesso!

Sua aplicação está rodando em produção! 🎉

**URLs para compartilhar:**
- Frontend: `https://chat.seudominio.com`
- Backend: `https://api.seudominio.com/api`

**Próximos passos:**
- Monitorar logs regularmente
- Configurar backups (se estiver usando database)
- Considerar CDN para assets estáticos
- Implementar monitoramento (New Relic, Datadog, etc)

---

**Documentação criada em:** Novembro 15, 2025  
**Status:** ✅ Pronto para deploy

