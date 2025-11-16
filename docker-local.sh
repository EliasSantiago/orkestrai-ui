#!/bin/bash

# Script para gerenciar LobeChat com Docker localmente

set -e

COMPOSE_FILE="docker-compose.local.yml"
CONTAINER_NAME="lobechat-local"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

case "$1" in
  build)
    echo -e "${GREEN}🔨 Build COMPLETO sem cache (15-20 min)...${NC}"
    docker system prune -f
    docker compose -f $COMPOSE_FILE build --no-cache
    echo ""
    echo -e "${GREEN}✅ Build concluído!${NC}"
    echo "Inicie com: ./docker-local.sh start"
    ;;
  
  build-fast)
    echo -e "${GREEN}🚀 Build RÁPIDO com cache (3-5 min)...${NC}"
    # Build direto com Dockerfile.local.fast
    docker build -f Dockerfile.local.fast \
      --build-arg NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1 \
      --build-arg NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://host.docker.internal:8001/api \
      -t lobechat-custom:local .
    echo ""
    echo -e "${GREEN}✅ Build rápido concluído!${NC}"
    echo "Inicie com: ./docker-local.sh start"
    ;;
  
  build-clean)
    echo -e "${GREEN}🧹 Build LIMPO sem nenhum cache (20-25 min)...${NC}"
    echo "Limpando cache do Docker..."
    docker system prune -af
    docker builder prune -af
    echo ""
    echo "Fazendo build limpo..."
    docker build -f Dockerfile.local.fast \
      --no-cache \
      --build-arg NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1 \
      --build-arg NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://host.docker.internal:8001/api \
      -t lobechat-custom:local .
    echo ""
    echo -e "${GREEN}✅ Build limpo concluído!${NC}"
    echo "Inicie com: ./docker-local.sh start"
    ;;
  
  build-optimized)
    echo -e "${GREEN}📦 Build OTIMIZADO baseado na imagem oficial (1-2 min)...${NC}"
    echo "Baixando imagem oficial..."
    docker pull lobehub/lobe-chat:latest
    # Build direto com Dockerfile.local.optimized
    docker build -f Dockerfile.local.optimized \
      --build-arg NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1 \
      --build-arg NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://host.docker.internal:8001/api \
      -t lobechat-custom:local .
    echo ""
    echo -e "${GREEN}✅ Build otimizado concluído!${NC}"
    echo "Inicie com: ./docker-local.sh start"
    ;;
  
  start)
    echo -e "${GREEN}🚀 Iniciando LobeChat...${NC}"
    docker compose -f $COMPOSE_FILE up -d
    echo ""
    echo -e "${GREEN}✅ LobeChat iniciado!${NC}"
    echo ""
    echo -e "${YELLOW}📍 URL: http://localhost:3210${NC}"
    echo -e "${YELLOW}🔗 Backend: http://localhost:8001/api${NC}"
    echo ""
    echo "Para ver logs: ./docker-local.sh logs"
    ;;
  
  rebuild)
    echo -e "${YELLOW}🔄 Rebuild COMPLETO e reiniciando...${NC}"
    docker compose -f $COMPOSE_FILE down
    docker compose -f $COMPOSE_FILE build
    docker compose -f $COMPOSE_FILE up -d
    echo ""
    echo -e "${GREEN}✅ LobeChat rebuilded e iniciado!${NC}"
    echo -e "${YELLOW}📍 URL: http://localhost:3210${NC}"
    ;;
  
  rebuild-fast)
    echo -e "${YELLOW}🚀 Rebuild RÁPIDO com cache e reiniciando...${NC}"
    docker compose -f $COMPOSE_FILE down
    # Build direto com Dockerfile.local.fast
    docker build -f Dockerfile.local.fast \
      --build-arg NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1 \
      --build-arg NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://host.docker.internal:8001/api \
      -t lobechat-custom:local .
    docker compose -f $COMPOSE_FILE up -d
    echo ""
    echo -e "${GREEN}✅ LobeChat rebuilded (rápido) e iniciado!${NC}"
    echo -e "${YELLOW}📍 URL: http://localhost:3210${NC}"
    ;;
    
  stop)
    echo -e "${YELLOW}⏹️  Parando LobeChat...${NC}"
    docker compose -f $COMPOSE_FILE down
    echo -e "${GREEN}✅ LobeChat parado!${NC}"
    ;;
    
  restart)
    echo -e "${YELLOW}🔄 Reiniciando LobeChat...${NC}"
    docker compose -f $COMPOSE_FILE restart
    echo -e "${GREEN}✅ LobeChat reiniciado!${NC}"
    ;;
    
  logs)
    docker compose -f $COMPOSE_FILE logs -f --tail=100
    ;;
    
  status)
    echo -e "${GREEN}📊 Status do LobeChat:${NC}"
    docker compose -f $COMPOSE_FILE ps
    echo ""
    
    if docker ps | grep -q $CONTAINER_NAME; then
      echo -e "${GREEN}✅ LobeChat está rodando${NC}"
      echo -e "${YELLOW}📍 URL: http://localhost:3210${NC}"
    else
      echo -e "${RED}❌ LobeChat não está rodando${NC}"
    fi
    ;;
    
  shell)
    echo -e "${GREEN}🐚 Abrindo shell no container...${NC}"
    docker exec -it $CONTAINER_NAME sh
    ;;
    
  clean)
    echo -e "${YELLOW}🧹 Limpando containers e volumes...${NC}"
    docker compose -f $COMPOSE_FILE down -v
    echo -e "${GREEN}✅ Limpeza concluída!${NC}"
    ;;
    
  update)
    echo -e "${YELLOW}⚠️  Você está usando build local.${NC}"
    echo "Para atualizar suas customizações:"
    echo "  1. Faça suas modificações no código"
    echo "  2. Execute: ./docker-local.sh rebuild"
    ;;
    
  *)
    echo "🐳 LobeChat Docker Manager (Local Build)"
    echo ""
    echo "Uso: ./docker-local.sh [comando]"
    echo ""
    echo "Comandos de Build:"
    echo "  build           - Build COMPLETO sem cache (15-20 min)"
    echo "  build-fast      - Build RÁPIDO com cache (3-5 min) ⚡ RECOMENDADO"
    echo "  build-clean     - Build LIMPO sem nenhum cache (20-25 min) 🧹 PARA RESOLVER CACHE"
    echo "  build-optimized - Build baseado em imagem oficial (1-2 min)"
    echo ""
    echo "Comandos de Rebuild:"
    echo "  rebuild         - Rebuild completo e restart"
    echo "  rebuild-fast    - Rebuild rápido com cache e restart (1-2 min) ⚡"
    echo ""
    echo "Comandos de Controle:"
    echo "  start    - Iniciar LobeChat"
    echo "  stop     - Parar LobeChat"
    echo "  restart  - Reiniciar LobeChat"
    echo "  logs     - Ver logs em tempo real"
    echo "  status   - Ver status do container"
    echo "  shell    - Abrir shell no container"
    echo "  clean    - Parar e remover volumes"
    echo "  update   - Info sobre atualização local"
    echo ""
    echo "Workflow Recomendado:"
    echo "  1ª vez:   ./docker-local.sh build-fast && ./docker-local.sh start"
    echo "  Mudanças: ./docker-local.sh rebuild-fast  # Rápido!"
    echo ""
    echo "Ver comparação completa: cat DOCKER_BUILD_OPTIONS.md"
    echo ""
    echo "Exemplo: ./docker-local.sh build-fast"
    ;;
esac

