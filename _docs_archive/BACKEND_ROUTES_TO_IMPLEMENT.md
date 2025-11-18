# 📋 Rotas Necessárias no Backend - Implementação Futura

Este documento lista **todas as rotas que você precisa implementar no seu backend** para que o LobeChat funcione completamente em modo custom backend (`NEXT_PUBLIC_ENABLE_CUSTOM_AUTH=1`).

---

## 🔴 **CRÍTICAS** (Já parcialmente implementadas, mas precisam melhorias)

### 1. **Chat com OpenAI Compatible API**

#### **POST `/api/openai/chat/completions`**

**Descrição**: Endpoint compatível com OpenAI para chat. Usado quando custom auth está ativo mas não há `backendAgentId` específico.

**Headers**:
- `Authorization: Bearer <token>` (obrigatório)
- `Content-Type: application/json`

**Request Body**:
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "Olá, como você está?"
    }
  ],
  "stream": false,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "function_name",
        "description": "Function description",
        "parameters": {
          "type": "object",
          "properties": {
            "param": {
              "type": "string"
            }
          }
        }
      }
    }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "schema_name",
      "description": "Schema description",
      "schema": {
        "type": "object",
        "properties": {
          "field": {
            "type": "string"
          }
        }
      },
      "strict": true
    }
  }
}
```

**Response 200**:
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Olá! Estou bem, obrigado por perguntar."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

**Notas**:
- Deve suportar `stream: false` (não streaming por enquanto)
- Deve suportar `tools` para function calling
- Deve suportar `response_format` para structured output (JSON schema)
- O frontend usa este endpoint quando não há `backendAgentId` específico

---

### 2. **Sessões Agrupadas (Melhorado)**

#### **GET `/api/sessions/grouped`**

**Descrição**: Retorna sessões agrupadas por data. Compatível com `session.getGroupedSessions` do tRPC.

**Headers**:
- `Authorization: Bearer <token>` (obrigatório)

**Response 200**:
```json
[
  {
    "date": "2025-01-15",
    "sessions": [
      {
        "session_id": "uuid-session-id",
        "title": "Conversa sobre IA",
        "message_count": 10,
        "last_activity": "2025-01-15T14:30:00Z",
        "ttl": 3600,
        "meta": {
          "avatar": "https://example.com/avatar.png",
          "description": "Descrição da sessão"
        }
      }
    ]
  },
  {
    "date": "2025-01-14",
    "sessions": [
      {
        "session_id": "uuid-session-id-2",
        "title": "Outra conversa",
        "message_count": 5,
        "last_activity": "2025-01-14T10:00:00Z",
        "ttl": null
      }
    ]
  }
]
```

**Notas**:
- Deve agrupar sessões por data (formato `YYYY-MM-DD`)
- Deve incluir metadados como `title`, `avatar`, `description` se disponíveis
- Ordenar por data (mais recente primeiro) e dentro de cada data, por `last_activity` (mais recente primeiro)

---

### 3. **Mensagens (Compatibilidade)**

#### **GET `/api/messages?session_id={id}&limit=100`**

**Descrição**: Retorna mensagens de uma sessão. Compatível com `message.getMessages` do tRPC.

**Headers**:
- `Authorization: Bearer <token>` (obrigatório)

**Query Parameters**:
- `session_id` (obrigatório): ID da sessão
- `limit` (opcional): máximo de mensagens a retornar (padrão: 100)

**Response 200**:
```json
[
  {
    "id": "msg-uuid-1",
    "role": "user",
    "content": "Olá",
    "timestamp": "2025-01-15T14:30:00Z",
    "metadata": {
      "files": ["file-id-1"],
      "parentId": null
    },
    "createdAt": 1705327800000,
    "updatedAt": 1705327800000
  },
  {
    "id": "msg-uuid-2",
    "role": "assistant",
    "content": "Olá! Como posso ajudar?",
    "timestamp": "2025-01-15T14:30:05Z",
    "metadata": {},
    "createdAt": 1705327805000,
    "updatedAt": 1705327805000,
    "model": "gpt-4o-mini",
    "provider": "openai"
  }
]
```

**Notas**:
- Deve retornar mensagens ordenadas por timestamp (mais antigas primeiro)
- Deve incluir `id`, `role`, `content`, `timestamp`
- `metadata` pode conter informações extras como `files`, `parentId`, etc.

---

## 🟡 **IMPORTANTES** (Para funcionalidades completas)

### 4. **Criar Mensagem com Resposta Completa**

#### **POST `/api/conversations/sessions/{session_id}/chat`** (NOVO)

**Descrição**: Envia uma mensagem e recebe resposta completa com IDs de mensagens criadas. Similar ao que `aiChat.sendMessageInServer` faz.

**Headers**:
- `Authorization: Bearer <token>` (obrigatório)
- `Content-Type: application/json`

**Request Body**:
```json
{
  "message": "Olá, como você está?",
  "model": "gpt-4o-mini",
  "provider": "openai",
  "files": ["file-id-1", "file-id-2"],
  "parent_id": "msg-uuid-parent",
  "topic_id": "topic-uuid-optional",
  "create_new_topic": false
}
```

**Response 200**:
```json
{
  "user_message_id": "msg-uuid-user",
  "assistant_message_id": "msg-uuid-assistant",
  "session_id": "uuid-session-id",
  "topic_id": "topic-uuid-or-empty",
  "is_create_new_topic": false,
  "messages": [
    {
      "id": "msg-uuid-user",
      "role": "user",
      "content": "Olá, como você está?",
      "timestamp": "2025-01-15T14:30:00Z",
      "metadata": {
        "files": ["file-id-1", "file-id-2"]
      }
    },
    {
      "id": "msg-uuid-assistant",
      "role": "assistant",
      "content": "Olá! Estou bem, obrigado.",
      "timestamp": "2025-01-15T14:30:05Z",
      "metadata": {},
      "model": "gpt-4o-mini",
      "provider": "openai"
    }
  ],
  "topics": [
    {
      "id": "topic-uuid",
      "title": "Título do Tópico",
      "session_id": "uuid-session-id",
      "created_at": "2025-01-15T14:30:00Z"
    }
  ]
}
```

**Notas**:
- Deve criar mensagem do usuário e mensagem do assistente
- Deve retornar ambas as mensagens no array `messages`
- Se `create_new_topic` for `true`, deve criar um novo tópico e retornar em `topics`
- Deve suportar streaming no futuro (por enquanto `stream: false`)

---

### 5. **Atualizar Informações da Sessão**

#### **PUT `/api/conversations/sessions/{session_id}`** (NOVO)

**Descrição**: Atualiza metadados de uma sessão (título, descrição, avatar, etc.).

**Headers**:
- `Authorization: Bearer <token>` (obrigatório)
- `Content-Type: application/json`

**Request Body**:
```json
{
  "title": "Novo Título",
  "description": "Nova descrição",
  "avatar": "https://example.com/avatar.png",
  "pinned": false,
  "metadata": {
    "custom_field": "custom_value"
  }
}
```

**Response 200**:
```json
{
  "session_id": "uuid-session-id",
  "title": "Novo Título",
  "description": "Nova descrição",
  "avatar": "https://example.com/avatar.png",
  "pinned": false,
  "updated_at": "2025-01-15T14:30:00Z"
}
```

---

### 6. **Buscar Sessões**

#### **GET `/api/conversations/sessions/search?keywords={query}`** (NOVO)

**Descrição**: Busca sessões por palavras-chave (título, descrição, conteúdo de mensagens).

**Headers**:
- `Authorization: Bearer <token>` (obrigatório)

**Query Parameters**:
- `keywords` (obrigatório): Termo de busca

**Response 200**:
```json
[
  {
    "session_id": "uuid-session-id",
    "title": "Conversa sobre IA",
    "description": "Discussão sobre inteligência artificial",
    "last_activity": "2025-01-15T14:30:00Z",
    "message_count": 10
  }
]
```

---

## 🟢 **OPCIONAIS** (Para features avançadas)

### 7. **Estatísticas de Mensagens**

#### **GET `/api/messages/stats?start_date={date}&end_date={date}`** (NOVO)

**Descrição**: Retorna estatísticas de mensagens (contagem, palavras, etc.).

**Headers**:
- `Authorization: Bearer <token>` (obrigatório)

**Query Parameters**:
- `start_date` (opcional): Data inicial (formato `YYYY-MM-DD`)
- `end_date` (opcional): Data final (formato `YYYY-MM-DD`)

**Response 200**:
```json
{
  "total_messages": 150,
  "total_words": 5000,
  "messages_today": 10,
  "words_today": 300
}
```

---

### 8. **Ranking de Modelos**

#### **GET `/api/messages/models/rank`** (NOVO)

**Descrição**: Retorna ranking de modelos mais usados.

**Headers**:
- `Authorization: Bearer <token>` (obrigatório)

**Response 200**:
```json
[
  {
    "model": "gpt-4o-mini",
    "count": 50,
    "rank": 1
  },
  {
    "model": "gpt-4o",
    "count": 30,
    "rank": 2
  }
]
```

---

### 9. **Heatmap de Mensagens**

#### **GET `/api/messages/heatmap`** (NOVO)

**Descrição**: Retorna dados para heatmap de atividade de mensagens.

**Headers**:
- `Authorization: Bearer <token>` (obrigatório)

**Response 200**:
```json
[
  {
    "date": "2025-01-15",
    "count": 10
  },
  {
    "date": "2025-01-14",
    "count": 5
  }
]
```

---

### 10. **Atualizar Mensagem**

#### **PUT `/api/conversations/sessions/{session_id}/messages/{message_id}`** (NOVO)

**Descrição**: Atualiza uma mensagem existente (conteúdo, metadata, etc.).

**Headers**:
- `Authorization: Bearer <token>` (obrigatório)
- `Content-Type: application/json`

**Request Body**:
```json
{
  "content": "Conteúdo atualizado",
  "metadata": {
    "updated_field": "updated_value"
  }
}
```

**Response 200**:
```json
{
  "id": "msg-uuid",
  "content": "Conteúdo atualizado",
  "updated_at": "2025-01-15T14:30:00Z"
}
```

---

### 11. **Deletar Mensagem**

#### **DELETE `/api/conversations/sessions/{session_id}/messages/{message_id}`** (NOVO)

**Descrição**: Deleta uma mensagem específica.

**Headers**:
- `Authorization: Bearer <token>` (obrigatório)

**Response 204**: Sem corpo

---

### 12. **Deletar Múltiplas Mensagens**

#### **DELETE `/api/conversations/sessions/{session_id}/messages`** (NOVO)

**Descrição**: Deleta múltiplas mensagens de uma sessão.

**Headers**:
- `Authorization: Bearer <token>` (obrigatório)
- `Content-Type: application/json`

**Request Body**:
```json
{
  "message_ids": ["msg-uuid-1", "msg-uuid-2"],
  "delete_assistant_only": false
}
```

**Response 204**: Sem corpo

---

## 📊 **Resumo de Prioridades**

| Prioridade | Rota | Status Atual | Descrição |
|------------|------|--------------|-----------|
| 🔴 **CRÍTICA** | `POST /api/openai/chat/completions` | ⚠️ Parcial | Chat OpenAI compatible - precisa suportar tools e structured output |
| 🔴 **CRÍTICA** | `GET /api/sessions/grouped` | ✅ Existe | Melhorar para incluir metadados completos |
| 🔴 **CRÍTICA** | `GET /api/messages?session_id={id}` | ✅ Existe | Melhorar formato de resposta |
| 🟡 **IMPORTANTE** | `POST /api/conversations/sessions/{id}/chat` | ❌ Não existe | Criar mensagem + resposta completa |
| 🟡 **IMPORTANTE** | `PUT /api/conversations/sessions/{id}` | ❌ Não existe | Atualizar metadados da sessão |
| 🟡 **IMPORTANTE** | `GET /api/conversations/sessions/search` | ❌ Não existe | Buscar sessões |
| 🟢 **OPCIONAL** | `GET /api/messages/stats` | ❌ Não existe | Estatísticas |
| 🟢 **OPCIONAL** | `GET /api/messages/models/rank` | ❌ Não existe | Ranking de modelos |
| 🟢 **OPCIONAL** | `GET /api/messages/heatmap` | ❌ Não existe | Heatmap |
| 🟢 **OPCIONAL** | `PUT /api/conversations/sessions/{id}/messages/{msg_id}` | ❌ Não existe | Atualizar mensagem |
| 🟢 **OPCIONAL** | `DELETE /api/conversations/sessions/{id}/messages/{msg_id}` | ❌ Não existe | Deletar mensagem |
| 🟢 **OPCIONAL** | `DELETE /api/conversations/sessions/{id}/messages` | ❌ Não existe | Deletar múltiplas mensagens |

---

## 🔧 **Notas de Implementação**

1. **Autenticação**: Todas as rotas (exceto as públicas) requerem `Authorization: Bearer <token>`

2. **Formato de Erro**: Sempre retornar:
   ```json
   {
     "detail": [
       {
         "msg": "Mensagem de erro legível"
       }
     ],
     "message": "Mensagem de erro legível"
   }
   ```

3. **IDs**: Usar UUIDs v4 para `session_id`, `message_id`, etc.

4. **Datas**: Sempre usar formato ISO 8601 (`2025-01-15T14:30:00Z`)

5. **Paginação**: Para endpoints que retornam listas, considerar adicionar paginação:
   - `?page=1&page_size=20`
   - Response incluir `total`, `page`, `page_size`

6. **Streaming**: No futuro, suportar streaming para `/api/openai/chat/completions` com `stream: true`

---

## 📝 **Checklist de Implementação**

- [ ] Implementar `POST /api/openai/chat/completions` com suporte a tools e structured output
- [ ] Melhorar `GET /api/sessions/grouped` para incluir metadados completos
- [ ] Melhorar `GET /api/messages` para retornar formato completo
- [ ] Implementar `POST /api/conversations/sessions/{id}/chat`
- [ ] Implementar `PUT /api/conversations/sessions/{id}`
- [ ] Implementar `GET /api/conversations/sessions/search`
- [ ] (Opcional) Implementar endpoints de estatísticas
- [ ] (Opcional) Implementar endpoints de atualização/deleção de mensagens
- [ ] Testar todas as rotas com o frontend
- [ ] Documentar no Swagger/ReDoc

---

**Última atualização**: 2025-01-15

