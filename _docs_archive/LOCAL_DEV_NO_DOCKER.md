# 🚀 Executar LobeChat Localmente (SEM Docker)

## ✅ Recomendação Oficial da Documentação

A documentação oficial recomenda:

```bash
pnpm dev
```

Este comando inicia o servidor de desenvolvimento em **http://localhost:3010**

---

## 🎯 Opção 1: Comando Direto (Mais Simples)

### 1. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` (ou crie se não existir):

```bash
# Navegue até o diretório do projeto
cd /home/ignitor/projects/lobechat-dev

# Crie/edite o .env.local
nano .env.local
```

**Conteúdo do `.env.local`:**

```env
# =========================================
# AUTENTICAÇÃO CUSTOMIZADA
# =========================================
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://localhost:8001/api

# =========================================
# DESABILITAR MODELOS LOCAIS (IMPORTANTE!)
# =========================================
DISABLE_MODEL_DOWNLOAD=1
OLLAMA_DISABLED=1
ENABLE_OLLAMA_PROXY=0
ENABLE_OLLAMA=0

# =========================================
# OUTROS
# =========================================
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=development
```

### 2. Instalar Dependências (primeira vez)

```bash
pnpm install
```

### 3. Iniciar Servidor de Desenvolvimento

```bash
pnpm dev
```

**Pronto!** Acesse: **http://localhost:3010**

---

## 🎯 Opção 2: Script Automatizado (Recomendado)

O projeto já inclui um script que facilita o processo:

```bash
./run-dev.sh
```

**O que o script faz:**
- ✅ Configura Node.js 24 (LTS Krypton)
- ✅ Instala pnpm se não estiver instalado
- ✅ Instala dependências se necessário
- ✅ Corrige permissões do `.next` (se houver problemas do Docker)
- ✅ Inicia o servidor em http://localhost:3010

---

## 📋 Comandos Disponíveis

### Desenvolvimento

```bash
# Servidor de desenvolvimento (porta 3010)
pnpm dev

# Servidor de desenvolvimento para Desktop (porta 3015)
pnpm dev:desktop

# Servidor de desenvolvimento para Mobile (porta 3018)
pnpm dev:mobile
```

### Build de Produção (Local)

```bash
# Build completo (com lint e type-check)
pnpm build

# Iniciar servidor de produção (porta 3210)
pnpm start
```

### Testes e Qualidade

```bash
# Rodar testes
pnpm test

# Type checking
pnpm type-check

# Lint
pnpm lint

# Apenas lint TypeScript
pnpm lint:ts

# Apenas lint de estilos
pnpm lint:style
```

### Limpeza

```bash
# Reinstalar todas as dependências
pnpm reinstall

# Limpar node_modules completamente
pnpm clean:node_modules
```

---

## 🛡️ Garantia: Nenhum Modelo LLM Será Baixado

### Por Quê?

Com as variáveis de ambiente no `.env.local`:

```env
DISABLE_MODEL_DOWNLOAD=1
OLLAMA_DISABLED=1
ENABLE_OLLAMA_PROXY=0
ENABLE_OLLAMA=0
```

**O LobeChat não vai:**
- ❌ Baixar Ollama
- ❌ Baixar modelos LLM
- ❌ Tentar conectar a Ollama local
- ❌ Usar modelos locais

**O LobeChat vai apenas:**
- ✅ Usar sua API customizada: `http://localhost:8001/api`
- ✅ Funcionar como frontend/UI pura
- ✅ Enviar todas as requisições para seu backend Python

---

## 🔄 Fluxo Completo

### 1. Iniciar Backend (Terminal 1)

```bash
cd /path/to/seu/backend
python main.py
# ou
uvicorn main:app --reload --port 8001
```

Verifique se está rodando:
```bash
curl http://localhost:8001/api/health
# Esperado: {"status": "ok"}
```

### 2. Iniciar LobeChat (Terminal 2)

```bash
cd /home/ignitor/projects/lobechat-dev
pnpm dev
```

### 3. Acessar

- **Frontend:** http://localhost:3010
- **Backend:** http://localhost:8001/api

---

## 🐛 Troubleshooting

### Problema: Porta 3010 já está em uso

```bash
# Descobrir o que está usando a porta
lsof -i :3010

# Matar o processo
kill -9 <PID>

# Ou usar porta diferente
pnpm dev -- -p 3015
```

### Problema: Permissões no diretório `.next`

Se o Docker criou o `.next` como root:

```bash
# Remover o diretório
sudo rm -rf .next

# Ou mudar permissões
sudo chown -R $USER:$USER .next
```

### Problema: `pnpm: command not found`

```bash
# Instalar pnpm
npm install -g pnpm@10.20.0

# Ou usar o script que faz isso automaticamente
./run-dev.sh
```

### Problema: Módulos não encontrados

```bash
# Reinstalar dependências
rm -rf node_modules
pnpm install
```

### Problema: Erro de memória durante build

```bash
# Aumentar memória do Node.js
NODE_OPTIONS=--max-old-space-size=6144 pnpm dev
```

---

## 📊 Comparação: Docker vs Local

| Aspecto | Docker | Local (pnpm dev) |
|---------|--------|------------------|
| **Tempo de Inicialização** | 15-20 min (build) + 30s | 5-10s |
| **Hot Reload** | ❌ Não | ✅ Sim (instantâneo) |
| **Uso de Memória** | ~2GB | ~500MB |
| **Facilidade de Debug** | Médio | ✅ Fácil |
| **Isolamento** | ✅ Total | Compartilha ambiente |
| **Recomendado para** | Produção, testes | **Desenvolvimento** |

---

## 🎯 Modo de Desenvolvimento Recomendado

Para **desenvolvimento rápido e iterativo**:

```bash
# 1. Backend (Terminal 1)
cd ~/backend && uvicorn main:app --reload --port 8001

# 2. LobeChat (Terminal 2)
cd ~/projects/lobechat-dev && pnpm dev

# 3. Abrir navegador
# http://localhost:3010
```

**Vantagens:**
- ⚡ Hot reload instantâneo (React Fast Refresh)
- 🐛 DevTools funcionam perfeitamente
- 💻 Menos uso de CPU/memória
- 🔄 Mudanças aparecem em segundos

---

## 📝 Estrutura de Arquivos Importante

```
lobechat-dev/
├── .env.local           # ← Suas variáveis de ambiente (não commitado)
├── package.json         # Scripts npm/pnpm
├── next.config.ts       # Configuração Next.js
├── src/                 # Código fonte
│   ├── app/             # Rotas Next.js 13+
│   ├── components/      # Componentes React
│   ├── services/        # API services
│   └── store/           # Zustand stores
├── public/              # Assets estáticos
└── run-dev.sh           # Script automatizado ✅
```

---

## 🚀 Próximos Passos

### 1. Iniciar Desenvolvimento

```bash
# Se não tiver .env.local configurado ainda
echo "NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1" > .env.local
echo "NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://localhost:8001/api" >> .env.local
echo "DISABLE_MODEL_DOWNLOAD=1" >> .env.local
echo "OLLAMA_DISABLED=1" >> .env.local
echo "ENABLE_OLLAMA_PROXY=0" >> .env.local
echo "ENABLE_OLLAMA=0" >> .env.local
echo "NEXT_TELEMETRY_DISABLED=1" >> .env.local

# Instalar dependências (primeira vez)
pnpm install

# Rodar servidor
pnpm dev
```

### 2. Verificar

- ✅ Backend rodando: `curl http://localhost:8001/api/health`
- ✅ Frontend rodando: `curl http://localhost:3010`
- ✅ Abrir navegador: http://localhost:3010

### 3. Desenvolver

- Edite arquivos em `src/`
- Mudanças aparecem automaticamente (Fast Refresh)
- Console do navegador mostra logs úteis

---

## 🎉 Pronto!

Agora você pode desenvolver no LobeChat sem Docker, com hot reload instantâneo e **zero downloads de modelos LLM**!

**Comando mais simples:**

```bash
pnpm dev
```

**Ou use o script automatizado:**

```bash
./run-dev.sh
```

Ambos funcionam perfeitamente e **não baixam modelos LLM**! ✅

---

**Última atualização:** Novembro 14, 2025  
**Status:** ✅ Pronto para desenvolvimento local



