# Custom Authentication Setup Guide

Este guia explica como configurar e usar a autenticação customizada no LobeChat que consome sua API externa.

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente ao seu arquivo `.env.local` ou `.env`:

```bash
# Habilitar autenticação customizada
NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1

# URL base da sua API (opcional, padrão: http://localhost:8001/v1)
NEXT_PUBLIC_CUSTOM_API_BASE_URL=http://localhost:8001/v1
```

### Rotas da API

A autenticação customizada espera que sua API tenha as seguintes rotas:

#### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login e obter token de acesso
- `GET /api/auth/me` - Obter usuário atual (requer Bearer token)

#### Agentes
- `GET /api/agents` - Listar todos os agentes
- `GET /api/agents/{agent_id}` - Obter agente específico
- `POST /api/agents` - Criar novo agente
- `PUT /api/agents/{agent_id}` - Atualizar agente
- `DELETE /api/agents/{agent_id}` - Deletar agente
- `POST /api/agents/chat` - Chat com agente

#### Conversas
- `GET /api/conversations/sessions` - Listar sessões do usuário
- `GET /api/conversations/sessions/{session_id}` - Obter histórico da sessão
- `DELETE /api/conversations/sessions/{session_id}` - Deletar sessão
- `DELETE /api/conversations/sessions` - Deletar todas as sessões

## Uso

### Páginas de Autenticação

As páginas de login e registro estão disponíveis nas rotas padrão:
- Login: `/login`
- Registro: `/signup`

### Serviços Disponíveis

#### CustomAuthService

Serviço para gerenciar autenticação:

```typescript
import { customAuthService } from '@/services/customAuth';

// Login
await customAuthService.login({ email: 'user@example.com', password: 'password' });

// Registro
await customAuthService.register({
  name: 'User Name',
  email: 'user@example.com',
  password: 'password',
  password_confirm: 'password',
});

// Obter usuário atual
const user = await customAuthService.getCurrentUser();

// Verificar se está autenticado
const isAuth = customAuthService.isAuthenticated();

// Logout
customAuthService.logout();
```

#### CustomApiService

Serviço para fazer requisições à API com autenticação:

```typescript
import { customApiService } from '@/services/customApi';

// Listar agentes
const agents = await customApiService.getAgents();

// Criar agente
const agent = await customApiService.createAgent({
  name: 'My Agent',
  instruction: 'You are a helpful assistant',
  model: 'gpt-4',
});

// Chat com agente
const response = await customApiService.chat({
  message: 'Hello!',
  agent_id: 1,
});
```

### Integração com Store

O sistema de autenticação está integrado com o Zustand store:

```typescript
import { useUserStore } from '@/store/user';

const { logout, openLogin } = useUserStore();

// Abrir página de login
await openLogin();

// Fazer logout
await logout();
```

## Proteção de Rotas

O `CustomAuthProvider` automaticamente:
- Redireciona usuários não autenticados para `/login`
- Permite acesso às páginas `/login` e `/signup` sem autenticação
- Verifica a validade do token ao carregar a aplicação

## Armazenamento

Os tokens e informações do usuário são armazenados em `localStorage`:
- `custom_auth_token`: Token de acesso JWT
- `custom_auth_user`: Informações do usuário

## Notas Importantes

1. **Segurança**: Os tokens são armazenados em `localStorage`, que é acessível via JavaScript. Para maior segurança em produção, considere usar cookies HTTP-only.

2. **CORS**: Certifique-se de que sua API permite requisições do domínio do LobeChat. Configure os headers CORS apropriados.

3. **Token Expiration**: O serviço não gerencia automaticamente a expiração de tokens. Se sua API retornar 401, o token será limpo e o usuário será redirecionado para login.

4. **Compatibilidade**: Esta autenticação customizada funciona independentemente do Clerk e NextAuth. Certifique-se de não habilitar múltiplos sistemas de autenticação ao mesmo tempo.

## Exemplo de Integração Completa

```typescript
'use client';

import { useEffect, useState } from 'react';
import { customAuthService } from '@/services/customAuth';
import { customApiService } from '@/services/customApi';

export default function MyComponent() {
  const [agents, setAgents] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      // Verificar autenticação
      if (!customAuthService.isAuthenticated()) {
        return;
      }

      // Carregar usuário
      const currentUser = await customAuthService.getCurrentUser();
      setUser(currentUser);

      // Carregar agentes
      try {
        const agentList = await customApiService.getAgents();
        setAgents(agentList);
      } catch (error) {
        console.error('Failed to load agents:', error);
      }
    };

    loadData();
  }, []);

  // ... resto do componente
}
```

