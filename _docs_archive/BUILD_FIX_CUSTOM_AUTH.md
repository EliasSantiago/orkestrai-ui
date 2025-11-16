# 🔧 Build Fix: CustomAuthService

## 📋 Problema Identificado

### Erro durante o build:

```
Error occurred prerendering page "/en-US__1__dark/next-auth/error"
Error: NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured!
at new CustomAuthService (.next/server/chunks/22907.js:84049:19)
```

### Causa Raiz:

1. **Build Time vs Runtime**: O Next.js faz **pre-render** (SSG/SSR) de páginas durante o build
2. **Singleton Instantiation**: O `CustomAuthService` é criado como singleton durante a importação do módulo:
   ```typescript
   export const customAuthService = new CustomAuthService();
   ```
3. **Constructor Validation**: O constructor do `CustomAuthService` verificava se `NEXT_PUBLIC_CUSTOM_API_BASE_URL` estava definido e **jogava erro imediatamente** se não estivesse
4. **Build Time Context**: Durante o build (server-side), `window` não existe e a variável pode não estar disponível ainda

---

## ✅ Solução Implementada

### 1. **Placeholder durante Build Time**

```typescript
constructor(baseUrl?: string) {
  const envUrl =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL
      : process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL;
  
  // Durante build time, permite baseUrl vazio
  if (!baseUrl && !envUrl) {
    if (typeof window === 'undefined') {
      this.baseUrl = 'http://placeholder-for-build.local';
      console.warn('⚠️  CustomAuthService: NEXT_PUBLIC_CUSTOM_API_BASE_URL not set during build.');
      return;
    }
    
    throw new Error('NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured!');
  }
  
  this.baseUrl = baseUrl || envUrl!;
}
```

### 2. **Validação no Runtime**

Adicionado método privado que verifica se o baseUrl é válido **antes** de fazer requisições:

```typescript
private validateBaseUrl(): void {
  if (this.baseUrl === 'http://placeholder-for-build.local') {
    throw new Error(
      'NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured! Please set it in your .env file.'
    );
  }
}
```

### 3. **Validação nos Métodos HTTP**

Todos os métodos que fazem requisições agora chamam `validateBaseUrl()`:

```typescript
async login(credentials: LoginRequest): Promise<TokenResponse> {
  this.validateBaseUrl(); // ✅ Valida antes de usar
  const response = await fetch(`${this.baseUrl}/api/auth/login`, { ... });
  // ...
}

async register(data: RegisterRequest): Promise<UserResponse> {
  this.validateBaseUrl(); // ✅ Valida antes de usar
  // ...
}

async getCurrentUser(): Promise<UserResponse | null> {
  this.validateBaseUrl(); // ✅ Valida antes de usar
  // ...
}

async authenticatedFetch(...): Promise<Response> {
  this.validateBaseUrl(); // ✅ Valida antes de usar
  // ...
}
```

---

## 🎯 Benefícios

### ✅ Build Time:
- **Build passa sem erros** mesmo se `NEXT_PUBLIC_CUSTOM_API_BASE_URL` não estiver definido
- Permite que o Next.js faça pre-render de páginas estáticas
- Evita falhas no CI/CD

### ✅ Runtime:
- **Erro claro** se tentar usar o serviço sem configuração adequada
- Protege contra chamadas HTTP com URL inválida
- Mantém segurança e validação

### ✅ Developer Experience:
- Logs de aviso durante o build para debug
- Mensagens de erro claras e acionáveis
- Não quebra funcionalidade existente

---

## 🚀 Como Configurar Corretamente

### 1. **GitHub Secrets**

Adicione o secret no GitHub:

```bash
# Nome do secret no GitHub
CUSTOM_API_URL

# Valor (URL do seu backend)
http://34.42.168.19:8001
```

**Passos:**
1. Vá para: `Settings` → `Secrets and variables` → `Actions`
2. Clique em: `New repository secret`
3. Nome: `CUSTOM_API_URL`
4. Valor: `http://34.42.168.19:8001`
5. Clique em: `Add secret`

### 2. **Workflow já configurado**

O workflow `.github/workflows/deploy-production.yml` já está passando o secret como `build-arg`:

```yaml
build-args: |
  NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1
  NEXT_PUBLIC_CUSTOM_API_BASE_URL=${{ secrets.CUSTOM_API_URL }}
  KEY_VAULTS_SECRET=${{ secrets.KEY_VAULTS_SECRET }}
  DATABASE_URL=postgresql://fake:fake@localhost:5432/fake
```

### 3. **Dockerfile já configurado**

O `Dockerfile.local` já aceita o `build-arg`:

```dockerfile
ARG NEXT_PUBLIC_CUSTOM_API_BASE_URL
ENV NEXT_PUBLIC_CUSTOM_API_BASE_URL=${NEXT_PUBLIC_CUSTOM_API_BASE_URL}
```

---

## 📊 Comportamento Esperado

### Durante o Build (GitHub Actions):

```
⚠️  CustomAuthService: NEXT_PUBLIC_CUSTOM_API_BASE_URL not set during build. Using placeholder.
✅ Build completed successfully
✅ Pages pre-rendered
✅ Image pushed to registry
```

### Durante o Runtime (Produção):

Se o secret estiver configurado:
```
✅ CustomAuthService initialized with: http://34.42.168.19:8001
✅ Login working
✅ Register working
✅ Auth working
```

Se o secret **NÃO** estiver configurado:
```
❌ Error: NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured!
(Quando tentar fazer login/register)
```

---

## 🧪 Testando

### 1. **Verificar se o secret está configurado**

```bash
# No GitHub Actions, adicione este step temporário:
- name: Debug secrets
  run: |
    echo "CUSTOM_API_URL length: ${#CUSTOM_API_URL}"
    echo "First 10 chars: ${CUSTOM_API_URL:0:10}"
  env:
    CUSTOM_API_URL: ${{ secrets.CUSTOM_API_URL }}
```

### 2. **Verificar logs do build**

Procure por:
```
⚠️  CustomAuthService: NEXT_PUBLIC_CUSTOM_API_BASE_URL not set during build.
```

Se aparecer: o secret não está sendo passado corretamente.
Se **não** aparecer: está tudo certo! ✅

### 3. **Testar em produção**

```bash
# Verificar se a aplicação está rodando
curl http://34.42.168.19:3210

# Verificar se a API está acessível
curl http://34.42.168.19:3210/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 📝 Checklist Final

**Backend:**
- [x] API rodando em `http://34.42.168.19:8001`
- [x] Endpoint `/api/auth/login` funcionando
- [x] Endpoint `/api/auth/register` funcionando
- [x] Endpoint `/api/auth/me` funcionando

**Frontend (GitHub):**
- [ ] Secret `CUSTOM_API_URL` adicionado (valor: `http://34.42.168.19:8001`)
- [ ] Secret `KEY_VAULTS_SECRET` adicionado
- [x] Workflow configurado
- [x] Dockerfile configurado
- [x] CustomAuthService corrigido

**Deploy:**
- [x] Código commitado
- [x] Push para `main`
- [ ] Build no GitHub Actions passando
- [ ] Deploy automático concluído
- [ ] Aplicação funcionando em produção

---

## 🎉 Conclusão

O build agora passa mesmo se `NEXT_PUBLIC_CUSTOM_API_BASE_URL` não estiver definido durante o build time, mas ainda mantém validação rigorosa no runtime. Isso resolve o problema de pre-render do Next.js enquanto garante que a aplicação não funcione com configurações inválidas.

**Próximos passos:**
1. Adicionar secret `CUSTOM_API_URL` no GitHub
2. Fazer novo push (ou re-run do workflow)
3. Verificar se o build passa
4. Testar login/register em produção ✅

