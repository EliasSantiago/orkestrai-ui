# 🔧 Correção: Módulos Não Encontrados no Docker Build

## 📋 Problema Identificado

Durante o build com Webpack, ocorriam 3 erros críticos:

### Erro 1: `locales` não encontrado
```
Module not found: Can't resolve '@/../locales'
./src/locales/create.ts
```

**Causa:** A pasta `locales/` na raiz não estava sendo copiada no Dockerfile

**Import afetado:**
```typescript
// src/locales/create.ts linha 23
return import(`@/../locales/${normalizeLocale(lng)}/${ns}.json`);
```

---

### Erro 2: `apps/desktop/package.json` não encontrado
```
Module not found: Can't resolve '@/../apps/desktop/package.json'
./src/server/modules/ElectronIPCClient/index.ts
```

**Causa:** O arquivo `apps/desktop/package.json` não estava sendo copiado no Dockerfile

**Import afetado:**
```typescript
// src/server/modules/ElectronIPCClient/index.ts linha 3
import packageJSON from '@/../apps/desktop/package.json';
```

---

### Erro 3: `Unexpected token` (erro secundário)
```
Unexpected token (15:151)
./src/locales/create.ts + 1 modules
```

**Causa:** Erro de parsing causado pelos módulos não encontrados acima

---

## ✅ Solução Aplicada

### Modificações em `Dockerfile.local.fast`

Adicionadas linhas após `COPY scripts ./scripts`:

```dockerfile
# Copiar locales (necessário para i18n em runtime)
COPY locales ./locales

# Copiar apps/desktop/package.json (usado por ElectronIPCClient)
RUN mkdir -p apps/desktop
COPY apps/desktop/package.json ./apps/desktop/package.json
```

### Modificações em `Dockerfile.local`

Adicionadas linhas após `COPY . .`:

```dockerfile
# Garantir que locales e apps estão presentes (mesmo com COPY . .)
COPY locales ./locales
RUN mkdir -p apps/desktop
COPY apps/desktop/package.json ./apps/desktop/package.json
```

**Nota:** Mesmo com `COPY . .`, as cópias explícitas garantem que os arquivos estejam presentes após a cópia dos packages do stage anterior.

---

## 🎯 Arquivos Copiados

1. **`locales/`** (18 idiomas × 33 arquivos JSON)
   - ar, bg-BG, de-DE, en-US, es-ES, fa-IR, fr-FR
   - it-IT, ja-JP, ko-KR, nl-NL, pl-PL, pt-BR
   - ru-RU, tr-TR, vi-VN, zh-CN, zh-TW

2. **`apps/desktop/package.json`**
   - Nome do pacote usado pelo `ElectronIPCClient`
   - Necessário mesmo em builds não-Electron

---

## 🚀 Como Testar

Execute o build limpo:

```bash
./docker-local.sh build-clean
```

**Tempo estimado:** 15-20 minutos

---

## 📊 Impacto

- ✅ **Webpack build funcionará corretamente**
- ✅ **i18n (internacionalização) funcionará em todos os idiomas**
- ✅ **ElectronIPCClient poderá ser importado sem erros**
- ✅ **Código Electron estará presente mas não será executado em ambiente web**

---

## 🔍 Verificação Pós-Build

Após build bem-sucedido, você deve ver:

```
✓ Compiled successfully
✓ Creating an optimized production build
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

Sem erros de `Module not found`!

---

**Última atualização:** Novembro 14, 2025  
**Status:** ✅ Correção aplicada, pronto para build

