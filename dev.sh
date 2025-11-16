#!/bin/bash

# =========================================
# Script Ultra-Simples para Dev Local
# =========================================

cd "$(dirname "$0")"

echo ""
echo "🚀 LobeChat - Modo Desenvolvimento Local"
echo ""

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo "📝 Criando .env.local com configurações padrão..."
    cat > .env.local << 'EOF'
# Autenticação Customizada
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://localhost:8001/api

# Desabilitar Modelos Locais
DISABLE_MODEL_DOWNLOAD=1
OLLAMA_DISABLED=1
ENABLE_OLLAMA_PROXY=0
ENABLE_OLLAMA=0

# Outros
NEXT_TELEMETRY_DISABLED=1
EOF
    echo "✅ .env.local criado!"
    echo ""
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências (primeira vez)..."
    pnpm install || npm install
    echo ""
fi

# Verificar se backend está rodando
if ! curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
    echo "⚠️  AVISO: Seu backend não está rodando em http://localhost:8001/api"
    echo "   Inicie o backend antes em outro terminal:"
    echo "   cd ~/backend && python main.py"
    echo ""
    read -p "Pressione Enter para continuar mesmo assim ou Ctrl+C para cancelar..."
    echo ""
fi

echo "🚀 Iniciando servidor de desenvolvimento..."
echo "📍 URL: http://localhost:3010"
echo ""
echo "💡 Dica: Use Ctrl+C para parar"
echo ""

pnpm dev



