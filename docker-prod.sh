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
NC='\033[0m' # No Color

echo ""
echo "🐳 Docker Deploy - Produção"
echo ""

# Verificar se .env existe
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Arquivo $ENV_FILE não encontrado!${NC}"
    echo ""
    echo "Crie o arquivo .env.docker.prod com:"
    echo "  CUSTOM_API_URL=http://34.42.168.19:8001/api"
    echo "  KEY_VAULTS_SECRET=\$(openssl rand -base64 32)"
    echo ""
    echo "Ou copie o exemplo:"
    echo "  cp .env.docker.prod.example .env.docker.prod"
    echo "  # Depois gere a chave secreta"
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

