#!/bin/bash

LOG_FILE="/tmp/lobechat-build-clean.log"
CHECK_INTERVAL=30

echo "🔍 Monitorando build do Docker..."
echo "📁 Log: $LOG_FILE"
echo ""

LAST_LINE=""
SAME_COUNT=0

while true; do
  if [ ! -f "$LOG_FILE" ]; then
    echo "⏳ Aguardando log file..."
    sleep $CHECK_INTERVAL
    continue
  fi
  
  CURRENT_LINE=$(tail -1 "$LOG_FILE" 2>/dev/null)
  
  if [ "$CURRENT_LINE" != "$LAST_LINE" ]; then
    echo "[$(date +%H:%M:%S)] $CURRENT_LINE"
    LAST_LINE="$CURRENT_LINE"
    SAME_COUNT=0
  else
    SAME_COUNT=$((SAME_COUNT + 1))
  fi
  
  # Verificar se completou com sucesso
  if echo "$CURRENT_LINE" | grep -q "Successfully built\|Successfully tagged"; then
    echo ""
    echo "✅ BUILD COMPLETADO COM SUCESSO!"
    echo ""
    echo "Execute: ./docker-local.sh start"
    exit 0
  fi
  
  # Verificar se teve erro
  if echo "$CURRENT_LINE" | grep -q "ERROR\|failed to solve"; then
    echo ""
    echo "❌ BUILD FALHOU!"
    echo ""
    echo "Últimas 30 linhas:"
    tail -30 "$LOG_FILE"
    exit 1
  fi
  
  # Se ficou muito tempo sem mudança, pode ter travado
  if [ $SAME_COUNT -gt 20 ]; then
    echo ""
    echo "⚠️  Build parece ter travado. Últimas 10 linhas:"
    tail -10 "$LOG_FILE"
    echo ""
    SAME_COUNT=0
  fi
  
  sleep $CHECK_INTERVAL
done

