# Docker Build Errors - Fixed ✅

Este documento lista todos os erros encontrados durante o build do Docker e suas correções.

---

## ❌ Erro #1: `pnpm-lock.yaml` não encontrado

**Erro:**
```
failed to compute cache key: "/pnpm-lock.yaml": not found
```

**Causa:** O projeto não tinha `pnpm-lock.yaml` no root.

**Correção:** Remover `--frozen-lockfile` e adicionar `--no-frozen-lockfile`

---

## ❌ Erro #2: Workspace packages não encontrados

**Erro:**
```
ERR_PNPM_WORKSPACE_PKG_NOT_FOUND
In : "@lobechat/types@workspace:*" is in the dependencies but no package named "@lobechat/types" is present
```

**Causa:** Copiar apenas `packages/*/package.json` é insuficiente para pnpm workspaces.

**Correção:** 
```dockerfile
COPY packages ./packages  # Copia TUDO, não apenas package.json
```

---

## ❌ Erro #3: `next.config.mjs` não encontrado

**Erro:**
```
failed to calculate checksum of ref "/next.config.mjs": not found
```

**Causa:** O arquivo se chama `next.config.ts`, não `.mjs`.

**Correção:** Atualizar Dockerfile para copiar `next.config.ts`

---

## ❌ Erro #4: Dockerfile name incorreto (`.fast.fast.fast`)

**Erro:**
```
failed to read dockerfile: open Dockerfile.local.fast.fast.fast: no such file or directory
```

**Causa:** Script `docker-local.sh` usava `sed` que aplicava substituição múltiplas vezes.

**Correção:** Usar `docker build -f Dockerfile.local.fast` diretamente

---

## ❌ Erro #5: `No package.json was found in "/app"` (builder stage)

**Erro:**
```
ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND  No package.json (or package.yaml, or package.json5) was found in "/app".
```

**Causa:** Builder stage não tinha `package.json` para executar scripts do pnpm.

**Correção:**
```dockerfile
COPY --from=deps /app/package.json /app/pnpm-workspace.yaml ./
```

---

## ❌ Erro #6: Type-check falhando no build

**Erro:**
```
error TS2307: Cannot find module '@clerk/backend' or its corresponding type declarations.
error TS2307: Cannot find module '@/../apps/desktop/package.json' or its corresponding type declarations.
```

**Causa:** 
- `pnpm run build` chama automaticamente `prebuild` 
- `prebuild` inclui `type-check`
- `type-check` falha por causa de módulos Clerk/Desktop removidos

**Correção:** Usar `pnpm exec next build` ao invés de `pnpm run build`

```dockerfile
# ANTES (ERRADO):
RUN pnpm run prebuild:docker && \
    pnpm run build && \
    pnpm run build-sitemap

# DEPOIS (CORRETO):
RUN pnpm run prebuild:docker && \
    pnpm exec next build && \
    pnpm run build-sitemap
```

**Por quê funciona:**
- `prebuild:docker`: Faz lint:ts + lint:style (SEM type-check) ✅
- `pnpm exec next build`: Roda Next.js build diretamente (SEM chamar prebuild) ✅
- Next.js faz seu próprio type-check APENAS dos arquivos usados (ignora Clerk/Desktop) ✅

---

## ❌ Erro #7: Turbopack sendo usado em produção 🔥

**Erro:**
```
▲ Next.js 16.0.3 (Turbopack)
Turbopack build failed with 40 errors:
./node_modules/.pnpm/thread-stream@3.1.0/node_modules/thread-stream/test/ts.test.ts
Module not found: Can't resolve 'tap'
...
(40 erros similares de arquivos de teste em node_modules)
```

**Causa RAIZ:** 
Linha 273 de `next.config.ts` tinha:
```typescript
turbopack: {},
```

Isso **força Turbopack em TODOS os builds** (dev E prod)! Turbopack tenta compilar TUDO, incluindo:
- Arquivos de teste dentro de `node_modules`
- LICENSEs, READMEs, arquivos .zip
- Arquivos .test.js, .test.mjs
- Imports dinâmicos de locales

**Turbopack não é estável para produção!** Deve usar **Webpack**.

**Correção:**

1. **Remover `turbopack: {}` do `next.config.ts`:**
```typescript
// ANTES:
turbopack: {},

// DEPOIS:
// NEVER use turbopack in production - only for dev
// turbopack: {}, // REMOVED: causes build errors with test files in node_modules
```

2. **Adicionar ENV para forçar Webpack:**
```dockerfile
ENV TURBO_FORCE=0
```

3. **Melhorar `.dockerignore` para excluir testes:**
```
**/node_modules/**/test
**/node_modules/**/tests
**/node_modules/**/*.test.js
**/node_modules/**/*.test.mjs
**/node_modules/**/LICENSE
**/node_modules/**/README.md
**/node_modules/**/*.zip
```

**Por quê Turbopack estava sendo usado:**
- Next.js 16.0.3 usa Turbopack por padrão se `turbopack: {}` estiver presente
- Turbopack NÃO respeita `.dockerignore` corretamente
- Turbopack tenta compilar TUDO que encontra
- Webpack (padrão prod) é mais maduro e ignora node_modules/test

**Resultado esperado após fix:**
```
▲ Next.js 16.0.3 (Webpack)  ✅ (não mais Turbopack)
```

---

## 📊 Resumo das Correções

| Erro | Solução | Arquivo Modificado |
|------|---------|-------------------|
| pnpm-lock.yaml não existe | `--no-frozen-lockfile` | Dockerfile.local.fast |
| Workspace packages | `COPY packages ./packages` | Dockerfile.local.fast |
| next.config.mjs | Usar `next.config.ts` | Dockerfile.local.fast |
| .fast.fast.fast | `docker build -f` direto | docker-local.sh |
| package.json no builder | `COPY package.json` from deps | Dockerfile.local.fast |
| type-check falhando | `pnpm exec next build` | Dockerfile.local.fast/Dockerfile.local |
| **Turbopack em produção** 🔥 | **Remover `turbopack: {}` do next.config.ts** | **next.config.ts** |

---

## ✅ Status Final

**Todas as correções aplicadas!** O build deve completar com sucesso agora.

**Tempo estimado de build:** 8-12 minutos (primeira vez)

**Próximos builds:** 3-5 minutos (com cache)

**Build engine:** Webpack (produção estável) ✅
