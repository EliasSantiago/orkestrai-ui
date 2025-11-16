# 🔧 Correções de Lint para Docker Build

## Erros Encontrados e Corrigidos

### 1. ❌ CustomLogin.tsx - Linha 137
**Erro:** `'` não escapado em JSX
```tsx
// ANTES:
Don't have an account?

// DEPOIS:
Don&apos;t have an account?
```
**Motivo:** Apóstrofos devem ser escapados em JSX usando `&apos;`, `&lsquo;`, `&#39;` ou `&rsquo;`

---

### 2. ❌ CustomAuth/index.tsx - Linha 72
**Erro:** Fragment desnecessário
```tsx
// ANTES:
return <>{children}</>;

// DEPOIS:
return children;
```
**Motivo:** Fragments só são necessários quando há mais de um filho. Um único elemento não precisa de Fragment.

---

### 3. ❌ StoreInitialization.tsx - Linhas 43, 46
**Erro:** `isLoginOnInit` usado antes de ser definido
```tsx
// ANTES:
const loadAgentsFromBackend = useSessionStore((s) => s.loadAgentsFromBackend);
const isSynced = useSessionStore((s) => s.isSynced);

useEffect(() => {
  if (enableCustomAuth && isLoginOnInit && !isSynced) {
    // ↑ usado aqui
    loadAgentsFromBackend();
  }
}, [enableCustomAuth, isLoginOnInit, isSynced]);
// definido depois ↓
const isLoginOnInit = useUserStore((s) => s.isLoginOnInit);

// DEPOIS:
const loadAgentsFromBackend = useSessionStore((s) => s.loadAgentsFromBackend);
const isSynced = useSessionStore((s) => s.isSynced);
const isLoginOnInit = useUserStore((s) => s.isLoginOnInit);  // ← Movido para cima

useEffect(() => {
  if (enableCustomAuth && isLoginOnInit && !isSynced) {
    loadAgentsFromBackend();
  }
}, [enableCustomAuth, isLoginOnInit, isSynced]);
```
**Motivo:** Variáveis devem ser declaradas antes de serem usadas (no-use-before-define)

---

### 4. ❌ customApi/index.ts - Linha 114
**Erro:** `RequestInit` não está definido
```tsx
// ANTES:
private async request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {

// DEPOIS:
private async request<T>(
  endpoint: string,
  options: globalThis.RequestInit = {},
): Promise<T> {
```
**Motivo:** `RequestInit` é um tipo global do browser, precisa ser acessado via `globalThis.RequestInit` em ambientes Node.js

---

### 5. ❌ customAuth/index.ts - Linha 199
**Erro:** `RequestInit` não está definido
```tsx
// ANTES:
async authenticatedFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {

// DEPOIS:
async authenticatedFetch(
  endpoint: string,
  options: globalThis.RequestInit = {},
): Promise<Response> {
```
**Motivo:** Mesmo caso anterior - tipo global do browser

---

### 6. ❌ conversationLifecycle.ts - Linha 409
**Erro:** `userMessageId` atribuído mas nunca usado
```tsx
// ANTES:
const userMessageId = await get().addUserMessage({
  message,
  fileList: fileIdList,
});

// DEPOIS:
await get().addUserMessage({
  message,
  fileList: fileIdList,
});
```
**Motivo:** Variáveis não utilizadas devem ser removidas ou prefixadas com `_` (unused-imports/no-unused-vars)

---

## Regras de Lint Aplicadas

### ESLint Rules
- `react/no-unescaped-entities` - Entidades HTML devem ser escapadas
- `react/jsx-no-useless-fragment` - Fragments desnecessários devem ser removidos
- `@typescript-eslint/no-use-before-define` - Variáveis devem ser definidas antes do uso
- `no-undef` - Variáveis devem ser definidas
- `unused-imports/no-unused-vars` - Variáveis não usadas devem ser removidas
- `@typescript-eslint/no-unused-vars` - Variáveis TypeScript não usadas

### Configuração do Projeto
O LobeChat usa:
- ESLint 8.57.1
- TypeScript strict mode
- React best practices

---

## Como Evitar Esses Erros

### 1. Escapar Caracteres Especiais em JSX
```tsx
// ✅ BOM
<p>Don&apos;t worry</p>
<p>It&apos;s fine</p>

// ❌ RUIM
<p>Don't worry</p>
<p>It's fine</p>
```

### 2. Usar Fragments Apenas Quando Necessário
```tsx
// ✅ BOM - múltiplos filhos
<>
  <Header />
  <Content />
</>

// ✅ BOM - único filho
return children;

// ❌ RUIM - único filho com Fragment
return <>{children}</>;
```

### 3. Declarar Antes de Usar
```tsx
// ✅ BOM
const isReady = useStore(s => s.isReady);
useEffect(() => {
  if (isReady) doSomething();
}, [isReady]);

// ❌ RUIM
useEffect(() => {
  if (isReady) doSomething();  // isReady ainda não foi declarado
}, [isReady]);
const isReady = useStore(s => s.isReady);
```

### 4. Tipos Globais do Browser
```tsx
// ✅ BOM - em ambiente Node.js/Docker
options: globalThis.RequestInit
options: globalThis.Response

// ✅ BOM - em ambiente browser apenas
options: RequestInit
options: Response
```

### 5. Remover Variáveis Não Usadas
```tsx
// ✅ BOM - se vai usar
const id = await createItem();
console.log('Created:', id);

// ✅ BOM - se não vai usar
await createItem();

// ❌ RUIM - declarou mas não usou
const id = await createItem();
```

---

## Comandos para Verificar Lint

### Localmente (antes de commit)
```bash
# Verificar erros
npm run lint

# Verificar apenas TypeScript
npm run lint:ts

# Verificar estilos
npm run lint:style

# Type check
npm run type-check
```

### No Docker Build
O lint é executado automaticamente no `prebuild`:
```bash
# Em Dockerfile.local
RUN pnpm run build:docker
  # → npm run prebuild
  #   → tsx scripts/prebuild.mts
  #   → npm run lint
```

---

## Status das Correções

✅ Todos os 7 erros de lint foram corrigidos:
- ✅ CustomLogin.tsx - Apóstrofo escapado
- ✅ CustomAuth/index.tsx - Fragment removido
- ✅ StoreInitialization.tsx - Ordem de declaração corrigida
- ✅ customApi/index.ts - Tipo RequestInit corrigido
- ✅ customAuth/index.ts - Tipo RequestInit corrigido
- ✅ conversationLifecycle.ts - Variável não usada removida

🔨 Build limpo iniciado sem cache para aplicar as correções.

---

## Próximos Passos

1. ⏳ Aguardar build completar (10-15 min)
2. ✅ Verificar se lint passa
3. ✅ Verificar se build completa
4. 🚀 Iniciar container
5. 🧪 Testar aplicação

**Build em progresso:** `/tmp/lobechat-build-clean.log`

