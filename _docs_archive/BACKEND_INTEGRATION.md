# Backend Integration Guide

Este documento descreve a integração completa entre o LobeChat e o backend customizado.

## 🎯 Visão Geral

A integração permite que o LobeChat use seu backend Python (LiteLLM + ADK Google) para:
- **Autenticação**: Login e registro de usuários
- **Gerenciamento de Agentes**: Criação e sincronização de agentes
- **Chat**: Processamento de mensagens via backend customizado

## 🔧 Arquitetura

### 1. Autenticação (`enableCustomAuth`)

Quando `NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1`:
- Login/Signup redirecionam para as páginas customizadas
- Token JWT é armazenado em `localStorage`
- Todas as requisições ao backend incluem `Authorization: Bearer <token>`

**Arquivos principais:**
- `src/services/customAuth/index.ts` - Serviço de autenticação
- `src/layout/AuthProvider/CustomAuth/index.tsx` - Provider de autenticação
- `src/app/[variants]/(auth)/login/[[...login]]/CustomLogin.tsx` - Página de login
- `src/app/[variants]/(auth)/signup/[[...signup]]/CustomSignup.tsx` - Página de registro

### 2. Sincronização de Agentes

**Fluxo de criação:**
1. Usuário cria agente no LobeChat
2. `createSession` é chamado
3. Agente é salvo localmente no PGLite
4. `syncAgentToBackend` envia o agente para o backend
5. Mapeamento `sessionId -> backendAgentId` é armazenado

**Fluxo de carregamento:**
1. Ao fazer login, `loadAgentsFromBackend` é chamado
2. Agentes do backend são carregados (implementação futura)
3. Agentes são criados localmente e mapeados

**Arquivos principais:**
- `src/store/session/slices/backendSync/action.ts` - Lógica de sincronização
- `src/services/customApi/index.ts` - API de comunicação com backend
- `src/layout/GlobalProvider/StoreInitialization.tsx` - Inicialização

### 3. Chat via Backend

**Fluxo de mensagem:**
1. Usuário envia mensagem
2. `sendMessage` verifica se a sessão tem `backendAgentId`
3. Se sim, usa `sendMessageWithCustomBackend`
4. Mensagem do usuário é salva localmente
5. Requisição é enviada para `/api/agents/chat`
6. Resposta é salva como mensagem do assistente
7. UI é atualizada

**Arquivos principais:**
- `src/store/chat/slices/aiChat/actions/conversationLifecycle.ts` - Lógica de chat
- `src/services/customChat/index.ts` - Serviço de chat customizado

## 🚀 Como Usar

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local`:

```bash
# Habilitar autenticação customizada
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1

# URL do backend (opcional, padrão: http://localhost:8001/v1)
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://localhost:8001/v1
```

### 2. Iniciar o Backend

Certifique-se de que seu backend Python está rodando em `http://localhost:8001`.

### 3. Iniciar o LobeChat

```bash
bun run dev
```

### 4. Fazer Login

1. Acesse `http://localhost:3210/login`
2. Faça login ou crie uma conta
3. Você será redirecionado para a página principal

### 5. Criar Agente

1. Crie um novo agente no LobeChat
2. O agente será automaticamente sincronizado com o backend
3. Verifique os logs do console: `[BackendSync] Agent synced to backend`

### 6. Conversar

1. Selecione o agente criado
2. Envie uma mensagem
3. A mensagem será processada pelo backend
4. Verifique os logs: `[CustomChat] Using custom backend for agent`

## 🔍 Mapeamento de Tipos

### LobeChat → Backend

```typescript
// LobeChat Session
{
  id: string,              // UUID gerado localmente
  meta: {
    title: string,         // → name
    description: string    // → description
  },
  config: {
    systemRole: string,    // → instruction
    model: string,         // → model
    plugins: string[],     // → tools
    knowledgeBases: []     // → use_file_search (boolean)
  }
}

// Backend Agent
{
  id: number,              // ID do banco de dados
  name: string,
  description: string,
  instruction: string,
  model: string,
  tools: string[],
  use_file_search: boolean
}
```

### Mapeamento de Sessões

O `backendAgentMap` mantém o relacionamento:

```typescript
{
  [lobeSessionId: string]: backendAgentId: number
}
```

Exemplo:
```typescript
{
  "sess_abc123": 42,
  "sess_def456": 43
}
```

## 🧪 Debugging

### Verificar Autenticação

```javascript
// No console do navegador
localStorage.getItem('custom_auth_access_token')
```

### Verificar Mapeamento de Agentes

```javascript
// No console do navegador
useSessionStore.getState().backendAgentMap
```

### Logs Importantes

- `[BackendSync]` - Sincronização de agentes
- `[CustomChat]` - Envio de mensagens
- `[CustomAuth]` - Autenticação

## 📝 Próximos Passos

1. ✅ Autenticação customizada
2. ✅ Sincronização de agentes (criação)
3. ✅ Chat via backend
4. 🔄 Carregar agentes existentes do backend
5. 🔄 Atualizar agentes no backend quando modificados
6. 🔄 Deletar agentes no backend quando removidos
7. 🔄 Suporte para streaming de respostas (SSE)
8. 🔄 Tratamento de erros e retry logic
9. 🔄 Suporte para arquivos/imagens

## 🐛 Troubleshooting

### Erro: "Not authenticated"
- Verifique se o token está presente no localStorage
- Refaça o login

### Erro: "Backend agent not found"
- O agente pode não ter sido sincronizado
- Verifique os logs de sincronização
- Tente criar um novo agente

### Chat não usa o backend
- Verifique se `NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1`
- Verifique se o agente tem um `backendAgentId` mapeado
- Consulte os logs do console

## 📚 Referências

- [Custom Auth Setup](./CUSTOM_AUTH_SETUP.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [API Documentation](./API_DOCS.md) (se disponível)


