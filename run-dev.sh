#!/bin/bash

# Script para rodar o LobeChat sem Docker
# Este script configura o ambiente e inicia o servidor de desenvolvimento

# Navegar para o diretório do projeto
cd "$(dirname "$0")"

# Carregar nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Usar Node.js LTS Krypton (Node 24)
echo "📦 Configurando Node.js..."
nvm use 24 || nvm install lts/Krypton && nvm use 24

# Verificar se pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "📦 Instalando pnpm..."
    npm install -g pnpm@10.20.0
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    pnpm install
fi

# Corrigir permissões do diretório .next (pode ter sido criado pelo Docker como root)
if [ -d ".next" ]; then
    echo "🔧 Verificando permissões do diretório .next..."
    NEXT_OWNER=$(stat -c '%U' .next 2>/dev/null || stat -f '%Su' .next 2>/dev/null || echo "")
    if [ ! -w ".next" ] || ([ -n "$NEXT_OWNER" ] && [ "$NEXT_OWNER" != "$USER" ]); then
        echo "⚠️  Diretório .next possui permissões incorretas (criado pelo Docker como root?)"
        echo "🗑️  Tentando remover diretório .next..."
        
        # Tentar remover sem sudo primeiro
        if rm -rf .next 2>/dev/null; then
            echo "✅ Diretório .next removido com sucesso"
        # Se falhar, tentar com sudo
        elif sudo rm -rf .next 2>/dev/null; then
            echo "✅ Diretório .next removido com sucesso (usando sudo)"
        else
            echo "❌ Não foi possível remover .next automaticamente."
            echo "   Por favor, execute manualmente: sudo rm -rf .next"
            exit 1
        fi
    fi
fi

# Iniciar o servidor de desenvolvimento
echo "🚀 Iniciando servidor de desenvolvimento..."
echo "📍 O servidor estará disponível em: http://localhost:3010"
echo ""
pnpm dev

