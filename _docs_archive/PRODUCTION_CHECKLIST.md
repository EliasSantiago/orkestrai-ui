# Checklist de Configuração para Produção

Este documento lista todas as variáveis de ambiente necessárias e opcionais para fazer o deploy do LobeChat em produção com autenticação customizada.

## 📋 Status do Projeto

### ✅ Implementado
- [x] Autenticação customizada (login/registro)
- [x] Integração com API externa
- [x] Páginas de login e registro
- [x] Gerenciamento de tokens JWT
- [x] Proteção de rotas

### ⚠️ Pendências (Opcional)
- [ ] Integração do `customApiService` com o sistema de chat/agentes do LobeChat
- [ ] Refresh automático de tokens (se sua API suportar)
- [ ] Tratamento de expiração de sessão

---

## 🔴 OBRIGATÓRIO - Variáveis Essenciais

### 1. Autenticação Customizada

```bash
# Habilitar autenticação customizada
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1

# URL base da sua API de autenticação
NEXT_PUBLIC_CUSTOM_API_BASE_URL=https://api.seudominio.com/v1
```

**Nota:** Se não configurar `NEXT_PUBLIC_CUSTOM_API_BASE_URL`, o padrão será `http://localhost:8001/v1` (não funciona em produção).

### 2. Configuração da Aplicação

```bash
# URL pública da aplicação (obrigatório em produção)
APP_URL=https://lobechat.seudominio.com

# URL interna para comunicação servidor-servidor (opcional, mas recomendado)
# Use se tiver CDN/proxy na frente
INTERNAL_APP_URL=http://localhost:3210
```

### 3. Banco de Dados (PostgreSQL)

```bash
# URL de conexão do PostgreSQL
DATABASE_URL=postgresql://usuario:senha@host:5432/nome_do_banco

# Secret para criptografar dados sensíveis (gerar com: openssl rand -base64 32)
KEY_VAULTS_SECRET=seu_secret_aqui_de_32_caracteres

# Driver do banco (node ou neon)
DATABASE_DRIVER=node
```

**Como gerar KEY_VAULTS_SECRET:**
```bash
openssl rand -base64 32
```

---

## 🟡 RECOMENDADO - Para Funcionalidades Completas

### 4. Armazenamento S3 (Para Upload de Arquivos/Imagens)

```bash
# Credenciais S3
S3_ACCESS_KEY_ID=sua_access_key_id
S3_SECRET_ACCESS_KEY=sua_secret_access_key

# Configuração do Bucket
S3_BUCKET=nome-do-seu-bucket
S3_ENDPOINT=https://s3.seudominio.com
S3_PUBLIC_DOMAIN=https://files.seudominio.com

# Opcionais
S3_REGION=us-east-1
S3_ENABLE_PATH_STYLE=0
S3_SET_ACL=1
```

**Provedores S3 compatíveis:**
- AWS S3
- Cloudflare R2
- DigitalOcean Spaces
- MinIO (self-hosted)
- Tencent Cloud COS
- Outros compatíveis com S3

**Importante:** Se você não configurar S3, funcionalidades de upload de imagens e arquivos não funcionarão.

### 5. Modo de Servidor

```bash
# Habilitar modo servidor (necessário para usar banco de dados)
NEXT_PUBLIC_SERVICE_MODE=server
```

---

## 🟢 OPCIONAL - Funcionalidades Adicionais

### 6. Proteção de Acesso

```bash
# Código de acesso (senha para acessar a aplicação)
# Se não configurar, qualquer um pode acessar (se não usar autenticação)
ACCESS_CODE=seu_codigo_secreto

# Habilitar proteção de autenticação (redireciona para login)
ENABLE_AUTH_PROTECTION=1
```

### 7. Configurações de Proxy/CDN

```bash
# Se usar proxy reverso (Nginx, Cloudflare, etc.)
MIDDLEWARE_REWRITE_THROUGH_LOCAL=1

# Proxy HTTP (se necessário)
HTTP_PROXY=http://proxy:porta
HTTPS_PROXY=http://proxy:porta
```

### 8. Configurações de Modelos LLM (Opcional)

Se você quiser usar modelos LLM diretamente no LobeChat (além da sua API):

```bash
# OpenAI
OPENAI_API_KEY=sk-xxxxx
OPENAI_PROXY_URL=https://api.openai.com/v1

# Outros provedores (veja src/envs/llm.ts para lista completa)
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_API_KEY=xxxxx
# ... etc
```

**Nota:** Como você está usando sua própria API, essas variáveis podem não ser necessárias.

### 9. Configurações Avançadas

```bash
# Configuração padrão do agente
DEFAULT_AGENT_CONFIG=model=gpt-4;params.max_tokens=300

# Agente do sistema
SYSTEM_AGENT=seu_agente_sistema

# Modo de seleção de API Key (se tiver múltiplas)
API_KEY_SELECT_MODE=random  # ou 'turn'

# Feature flags
FEATURE_FLAGS=feature1,feature2

# URL do mercado de agentes (se usar)
MARKET_BASE_URL=https://market.lobehub.com
```

### 10. Segurança e SSRF

```bash
# Permitir IPs privados (cuidado em produção!)
SSRF_ALLOW_PRIVATE_IP_ADDRESS=0

# Lista de IPs permitidos
SSRF_ALLOW_IP_ADDRESS_LIST=192.168.1.1,10.0.0.1
```

### 11. Monitoramento e Analytics

```bash
# Sentry (para tracking de erros)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_ENABLE_SENTRY=1

# Plausible Analytics
PLAUSIBLE_SCRIPT_BASE_URL=https://plausible.io
```

---

## 📝 Exemplo Completo de .env para Produção

```bash
# ============================================
# AUTENTICAÇÃO CUSTOMIZADA (OBRIGATÓRIO)
# ============================================
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
NEXT_PUBLIC_CUSTOM_API_BASE_URL=https://api.seudominio.com/v1

# ============================================
# APLICAÇÃO (OBRIGATÓRIO)
# ============================================
APP_URL=https://lobechat.seudominio.com
INTERNAL_APP_URL=http://localhost:3210
NEXT_PUBLIC_SERVICE_MODE=server

# ============================================
# BANCO DE DADOS (OBRIGATÓRIO)
# ============================================
DATABASE_URL=postgresql://usuario:senha@host:5432/lobechat
KEY_VAULTS_SECRET=gerar_com_openssl_rand_base64_32
DATABASE_DRIVER=node

# ============================================
# S3 STORAGE (RECOMENDADO)
# ============================================
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=lobechat-files
S3_ENDPOINT=https://s3.seudominio.com
S3_PUBLIC_DOMAIN=https://files.seudominio.com
S3_REGION=us-east-1
S3_ENABLE_PATH_STYLE=0
S3_SET_ACL=1

# ============================================
# SEGURANÇA (RECOMENDADO)
# ============================================
ENABLE_AUTH_PROTECTION=1
# ACCESS_CODE=opcional_se_nao_usar_auth

# ============================================
# PROXY/CDN (SE NECESSÁRIO)
# ============================================
MIDDLEWARE_REWRITE_THROUGH_LOCAL=1

# ============================================
# OPCIONAL - MONITORAMENTO
# ============================================
# NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
# PLAUSIBLE_SCRIPT_BASE_URL=https://plausible.io
```

---

## 🔍 Checklist de Deploy

### Antes do Deploy

- [ ] **Autenticação Customizada**
  - [ ] `NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1` configurado
  - [ ] `NEXT_PUBLIC_CUSTOM_API_BASE_URL` aponta para sua API em produção
  - [ ] Sua API está acessível e com CORS configurado corretamente

- [ ] **Banco de Dados**
  - [ ] PostgreSQL configurado e acessível
  - [ ] `DATABASE_URL` configurado corretamente
  - [ ] `KEY_VAULTS_SECRET` gerado e configurado
  - [ ] Migrações do banco executadas (se necessário)

- [ ] **Aplicação**
  - [ ] `APP_URL` configurado com o domínio de produção
  - [ ] `NEXT_PUBLIC_SERVICE_MODE=server` configurado
  - [ ] `INTERNAL_APP_URL` configurado (se usar proxy/CDN)

- [ ] **S3 Storage** (se usar upload de arquivos)
  - [ ] Bucket S3 criado
  - [ ] Credenciais S3 configuradas
  - [ ] `S3_PUBLIC_DOMAIN` configurado e acessível
  - [ ] CORS configurado no bucket S3

- [ ] **Segurança**
  - [ ] `ENABLE_AUTH_PROTECTION=1` (se quiser forçar autenticação)
  - [ ] `ACCESS_CODE` removido ou configurado (se não usar auth customizada)
  - [ ] HTTPS configurado no servidor/proxy

- [ ] **CORS na sua API**
  - [ ] Sua API permite requisições do domínio do LobeChat
  - [ ] Headers CORS configurados corretamente

### Após o Deploy

- [ ] Testar login
- [ ] Testar registro
- [ ] Testar logout
- [ ] Testar upload de arquivos (se S3 configurado)
- [ ] Verificar se tokens são armazenados corretamente
- [ ] Verificar se requisições autenticadas funcionam

---

## 🚨 Problemas Comuns

### 1. "Not authenticated" mesmo após login
- Verificar se `NEXT_PUBLIC_CUSTOM_API_BASE_URL` está correto
- Verificar CORS na sua API
- Verificar se o token está sendo retornado corretamente pela API

### 2. Erro ao fazer upload de arquivos
- Verificar se todas as variáveis S3 estão configuradas
- Verificar se o bucket existe e tem permissões corretas
- Verificar CORS no bucket S3

### 3. Erro de conexão com banco de dados
- Verificar se `DATABASE_URL` está correto
- Verificar se o PostgreSQL está acessível
- Verificar firewall/security groups

### 4. Redirecionamento infinito para login
- Verificar se `APP_URL` está correto
- Verificar se `INTERNAL_APP_URL` está configurado (se usar proxy)
- Verificar logs do navegador para erros de CORS

---

## 📚 Referências

- [Documentação S3 do LobeChat](https://lobehub.com/docs/self-hosting/environment-variables/s3)
- [Documentação de Deploy](https://lobehub.com/docs/self-hosting/server-database)
- [Guia de Autenticação Customizada](./CUSTOM_AUTH_SETUP.md)

---

## 💡 Dicas

1. **Use variáveis de ambiente seguras**: Nunca commite arquivos `.env` no git
2. **Teste em staging primeiro**: Configure um ambiente de staging antes de produção
3. **Monitore logs**: Configure Sentry ou outro serviço de monitoramento
4. **Backup do banco**: Configure backups automáticos do PostgreSQL
5. **HTTPS obrigatório**: Use HTTPS em produção, nunca HTTP
6. **Rate limiting**: Configure rate limiting na sua API para evitar abusos

