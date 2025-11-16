# 🎯 COMECE AQUI - Desenvolvimento Local

## 🚀 3 Formas de Rodar (escolha uma)

### 1️⃣ Ultra-Simples (RECOMENDADO) ⭐

```bash
./dev.sh
```

**O que faz:**
- ✅ Cria `.env.local` se não existir
- ✅ Instala dependências se necessário
- ✅ Verifica se backend está rodando
- ✅ Inicia servidor em http://localhost:3010

---

### 2️⃣ Automatizado (Completo)

```bash
./run-dev.sh
```

**O que faz:**
- ✅ Configura Node.js 24
- ✅ Instala pnpm
- ✅ Instala dependências
- ✅ Corrige permissões
- ✅ Inicia servidor

---

### 3️⃣ Direto (Minimalista)

```bash
pnpm dev
```

**Apenas inicia o servidor** (mais rápido se tudo já estiver configurado)

---

## 🎯 Fluxo Completo de Desenvolvimento

### Terminal 1: Backend

```bash
cd ~/seu-backend
python main.py
```

### Terminal 2: LobeChat

```bash
cd /home/ignitor/projects/lobechat-dev
./dev.sh
```

### Navegador

```
http://localhost:3010
```

---

## 🛡️ Garantia: ZERO Modelos LLM Locais

Seu `.env.local` já está configurado com:

```env
DISABLE_MODEL_DOWNLOAD=1
OLLAMA_DISABLED=1
ENABLE_OLLAMA_PROXY=0
ENABLE_OLLAMA=0
```

**Nenhum modelo será baixado!** ✅

---

## 📊 Comparação Rápida

| Comando | Velocidade | Setup Automático | Melhor Para |
|---------|-----------|------------------|-------------|
| `./dev.sh` | ⚡⚡⚡ | ✅ Sim | **Desenvolvimento rápido** |
| `./run-dev.sh` | ⚡⚡ | ✅ Sim (completo) | Primeira vez |
| `pnpm dev` | ⚡⚡⚡⚡ | ❌ Não | Usuários experientes |

---

## 🔧 Comandos Úteis

```bash
# Iniciar desenvolvimento
./dev.sh                    # ← MAIS FÁCIL

# Rodar testes
pnpm test

# Verificar erros
pnpm type-check

# Limpar e reinstalar
pnpm reinstall

# Build de produção local
pnpm build
pnpm start                  # Porta 3210
```

---

## 🐛 Problemas Comuns

### Backend não está rodando

```bash
# Verificar
curl http://localhost:8001/api/health

# Se não funcionar, inicie o backend:
cd ~/seu-backend && python main.py
```

### Porta 3010 ocupada

```bash
# Usar porta diferente
pnpm dev -- -p 3015
```

### Permissões do .next

```bash
# Se Docker criou como root
sudo rm -rf .next
```

---

## 📚 Documentação Completa

- **Local Dev (sem Docker):** `LOCAL_DEV_NO_DOCKER.md`
- **Docker Build:** `BUILD_READY.md`
- **Guia Rápido:** `QUICK_START.md`

---

## 🎉 Pronto para Começar!

**Comando mais simples:**

```bash
./dev.sh
```

**Acesse:**
- Frontend: http://localhost:3010
- Backend: http://localhost:8001/api

**Divirta-se codificando!** 🚀

---

**Status:** ✅ Tudo configurado e pronto!  
**Modelos LLM:** ❌ Desabilitados (não serão baixados)  
**Hot Reload:** ✅ Ativo (mudanças instantâneas)



