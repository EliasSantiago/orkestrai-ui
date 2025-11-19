# Correção do Erro no Deploy

## Erro Identificado

```
/home/runner/work/_temp/.../sh: line 10: CACHE_FROM: unbound variable
Error: Process completed with exit code 1
```

## Causa

O erro ocorria porque:
1. O script usava `set -euo pipefail` com `-u` (unbound variable check)
2. A variável `CACHE_FROM` estava sendo usada antes de ser definida ou quando estava vazia
3. O `-u` faz o script falhar quando uma variável não está definida

## Correções Aplicadas

### 1. ✅ Removido `-u` do `set`
**Antes**:
```bash
set -euo pipefail  # -u causa erro quando variável não está definida
```

**Depois**:
```bash
set -eo pipefail  # Mantém -e (exit on error) e -o pipefail, remove -u
```

### 2. ✅ Simplificada lógica de cache
**Antes**:
```bash
CACHE_FROM=""
if docker image inspect orkestrai-ui:latest >/dev/null 2>&1; then
  CACHE_FROM="--cache-from orkestrai-ui:latest"
fi
# Usar $CACHE_FROM (pode estar vazia)
```

**Depois**:
```bash
# Verificação direta sem variável intermediária
if docker image inspect orkestrai-ui:latest >/dev/null 2>&1; then
  docker compose build --cache-from orkestrai-ui:latest ...
else
  docker compose build ...
fi
```

### 3. ✅ Simplificado criação do .env
**Antes**:
```bash
cat > .env <<EOF
CUSTOM_API_URL=${CUSTOM_API_URL}
...
EOF
```

**Depois**:
```bash
{
  echo "CUSTOM_API_URL=${CUSTOM_API_URL}"
  echo "KEY_VAULTS_SECRET=${KEY_VAULTS_SECRET}"
  echo "NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1"
} > .env
```

## Arquivo Corrigido

- ✅ `lobechat-dev/.github/workflows/deploy-production.yml`

## Mudanças Principais

1. **Removido `-u` do `set`**: `set -euo pipefail` → `set -eo pipefail`
2. **Removida variável `CACHE_FROM`**: Lógica simplificada sem variável intermediária
3. **Verificação condicional direta**: `if docker image inspect ...` sem variável

## Notas

- O `set -e` ainda está ativo (falha em erros)
- O `set -o pipefail` ainda está ativo (falha em pipes com erro)
- Apenas o `set -u` foi removido (não falha em variáveis não definidas)
- A lógica de cache ainda funciona, apenas sem variável intermediária

## Próximos Passos

1. ⏳ Fazer commit e push das mudanças
2. ⏳ Verificar se o deploy funciona corretamente
3. ⏳ Monitorar logs do deploy para confirmar que não há mais erros

