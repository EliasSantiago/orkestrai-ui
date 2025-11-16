# Status da Integração Backend

## ✅ O que está PRONTO

### 1. Autenticação Customizada
- ✅ Serviço de autenticação (`src/services/customAuth/index.ts`)
- ✅ Login customizado (`/login`)
- ✅ Registro customizado (`/signup`)
- ✅ Proteção de rotas via `CustomAuthProvider`
- ✅ Token JWT armazenado em localStorage
- ✅ Auto-logout em caso de token inválido

### 2. Sincronização de Agentes
- ✅ Store Zustand com slice `backendSync`
- ✅ Mapeamento `sessionId -> backendAgentId`
- ✅ Sincronização automática ao criar agente
- ✅ Helpers de mapeamento (Lobe ↔ Backend)
- ✅ Carregamento de agentes na inicialização (estrutura pronta)

### 3. Chat via Backend
- ✅ Serviço de chat customizado (`src/services/customChat/index.ts`)
- ✅ Interceptação de `sendMessage`
- ✅ Método `sendMessageWithCustomBackend`
- ✅ Detecção automática de agentes do backend
- ✅ Salvamento de mensagens localmente

### 4. API Service
- ✅ Cliente API completo (`src/services/customApi/index.ts`)
- ✅ Todas as rotas do backend mapeadas
- ✅ Autenticação via Bearer token
- ✅ Tratamento de erros

## 🔄 O que precisa de ATENÇÃO

### 1. Carregar Agentes Existentes do Backend
**Status:** Estrutura pronta, implementação parcial

**Arquivo:** `src/store/session/slices/backendSync/action.ts`

```typescript
loadAgentsFromBackend: async () => {
  // ...
  const backendAgents = await customApiService.listAgents();
  
  // TODO: Para cada backend agent, verificar se já existe uma sessão
  // Se não existir, criar uma nova sessão localmente
  // Isso será implementado no próximo passo
}
```

**O que falta:**
- Loop através dos agentes do backend
- Criar sessões locais para agentes que não existem
- Registrar mapeamento `sessionId -> backendAgentId`

### 2. Atualização de Agentes
**Status:** Não implementado

**O que falta:**
- Detectar quando um agente é atualizado no LobeChat
- Sincronizar mudanças com o backend via PUT `/api/agents/{id}`

### 3. Deleção de Agentes
**Status:** Não implementado

**O que falta:**
- Interceptar `removeSession`
- Deletar agente no backend via DELETE `/api/agents/{id}`

### 4. Streaming de Respostas
**Status:** Não implementado

**Situação atual:** 
- Backend retorna resposta completa
- LobeChat espera e depois exibe

**O que falta:**
- Implementar SSE (Server-Sent Events) no backend
- Adaptar `customChatService` para lidar com streaming
- Mostrar resposta incrementalmente

## 🎯 Upload de Arquivos para S3

### Recomendação: **Abordagem Híbrida (Melhor opção)**

#### Como funciona:

```
┌─────────────┐     1. Request    ┌─────────────┐
│             │  ─────────────────>│             │
│  LobeChat   │  presigned URL     │   Backend   │
│  (Frontend) │<─────────────────  │  (Python)   │
│             │                    │             │
└──────┬──────┘                    └─────────────┘
       │                                  
       │ 2. Upload direto                 
       │                                  
       v                                  
┌─────────────┐     3. Notifica   ┌─────────────┐
│     S3      │<─────────────────  │  LobeChat   │
│   Bucket    │   arquivo salvo    │             │
└─────────────┘                    └─────────────┘
```

**Fluxo:**
1. Frontend pede pre-signed URL ao backend
2. Backend gera URL assinada (válida por X minutos)
3. Frontend faz upload DIRETO para S3
4. Frontend notifica backend que arquivo foi enviado
5. Backend registra arquivo no banco de dados

**Vantagens:**
- ✅ Backend não lida com streaming de arquivos grandes
- ✅ Upload mais rápido (direto para S3)
- ✅ Backend mantém controle (gera URLs assinadas)
- ✅ Segurança (URLs expiram)
- ✅ Validação centralizada (tipo, tamanho)

**Implementação necessária:**

### No Backend Python:

```python
from boto3 import client
from datetime import timedelta

s3_client = client('s3')

@router.post("/api/files/upload-url")
async def get_upload_url(
    filename: str,
    content_type: str,
    current_user = Depends(get_current_user)
):
    # Gerar key único
    file_key = f"users/{current_user.id}/{uuid4()}/{filename}"
    
    # Gerar presigned URL
    url = s3_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': 'seu-bucket',
            'Key': file_key,
            'ContentType': content_type
        },
        ExpiresIn=300  # 5 minutos
    )
    
    return {
        "upload_url": url,
        "file_key": file_key,
        "expires_in": 300
    }

@router.post("/api/files/confirm")
async def confirm_upload(
    file_key: str,
    filename: str,
    current_user = Depends(get_current_user)
):
    # Verificar se arquivo existe no S3
    # Registrar no banco de dados
    file = await db.files.create({
        "user_id": current_user.id,
        "s3_key": file_key,
        "filename": filename,
        "url": f"https://seu-bucket.s3.amazonaws.com/{file_key}"
    })
    return file
```

### No LobeChat:

```typescript
// Adicionar em src/services/customApi/index.ts

async getUploadUrl(filename: string, contentType: string): Promise<{
  upload_url: string;
  file_key: string;
  expires_in: number;
}> {
  return this.request('/api/files/upload-url', {
    method: 'POST',
    body: JSON.stringify({ filename, content_type: contentType }),
  });
}

async confirmUpload(fileKey: string, filename: string): Promise<any> {
  return this.request('/api/files/confirm', {
    method: 'POST',
    body: JSON.stringify({ file_key: fileKey, filename }),
  });
}

async uploadFileToS3(file: File): Promise<string> {
  // 1. Obter URL assinada
  const { upload_url, file_key } = await this.getUploadUrl(
    file.name,
    file.type
  );
  
  // 2. Upload direto para S3
  await fetch(upload_url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  
  // 3. Confirmar no backend
  const fileData = await this.confirmUpload(file_key, file.name);
  
  return fileData.url;
}
```

## 🚫 Alternativas NÃO Recomendadas

### ❌ Opção 1: Upload via Backend (streaming)
```
Frontend → Backend → S3
```
**Problemas:**
- Backend Python precisa fazer streaming (memória RAM)
- Arquivos grandes consomem muita banda
- Latência adicional
- Complexidade maior

### ❌ Opção 2: Upload direto sem controle
```
Frontend → S3 (com credenciais no frontend)
```
**Problemas:**
- ⚠️ **INSEGURO** - Credenciais AWS expostas
- Sem validação
- Sem controle de quota
- Qualquer um pode fazer upload

## 📊 Checklist Final

### Antes de ir para produção:

- [x] Autenticação implementada
- [x] Agentes sincronizam ao criar
- [x] Chat funciona via backend
- [ ] Carregar agentes existentes do backend
- [ ] Atualizar agentes no backend
- [ ] Deletar agentes no backend
- [ ] **Implementar upload de arquivos (presigned URLs)**
- [ ] Configurar bucket S3
- [ ] Configurar variáveis de ambiente S3 no backend
- [ ] Implementar streaming de respostas (opcional, mas recomendado)
- [ ] Tratamento de erros robusto
- [ ] Testes end-to-end

## 🎬 Próximos Passos Recomendados

### 1. Implementar carregamento de agentes (15 min)
Completar o `loadAgentsFromBackend` para criar sessões locais

### 2. Implementar upload de arquivos (1-2 horas)
- Backend: endpoints de presigned URL
- Frontend: integração com file uploader do LobeChat

### 3. Implementar streaming (opcional, 2-3 horas)
- Backend: retornar SSE
- Frontend: processar chunks

### 4. Testes completos (30 min)
- Criar agente
- Conversar
- Upload de arquivo
- Logout/Login

