import { SendMessageServerParams, SendMessageServerResponse, StructureOutputParams } from '@lobechat/types';
import { cleanObject } from '@lobechat/utils';

import { lambdaClient } from '@/libs/trpc/client';
import { createXorKeyVaultsPayload } from '@/services/_auth';
import { customAuthService } from './customAuth';

// Check if custom auth is enabled
const enableCustomAuth =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1';

class AiChatService {
  /**
   * Build URL for custom API endpoint
   */
  private buildUrl(endpoint: string): string {
    const baseUrl =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL
        : process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL;

    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured!');
    }

    // Remove trailing slashes from base URL
    let base = baseUrl.replaceAll(/\/+$/g, '');
    // Remove leading slashes from endpoint
    let path = endpoint.replaceAll(/^\/+/g, '');
    
    // Check if base URL already ends with /api
    const baseEndsWithApi = base.endsWith('/api');
    
    // Check if path already starts with api/
    const pathStartsWithApi = path.startsWith('api/');
    
    // Build URL avoiding duplication
    if (baseEndsWithApi && pathStartsWithApi) {
      // Base ends with /api and path starts with api/ -> remove api/ from path
      path = path.replace(/^api\//, '');
      return `${base}/${path}`;
    } else if (!baseEndsWithApi && !pathStartsWithApi) {
      // Neither has /api -> add it
      return `${base}/api/${path}`;
    } else {
      // One has /api, the other doesn't -> just concatenate
      return `${base}/${path}`;
    }
  }

  /**
   * Make authenticated API request
   */
  private async authenticatedRequest<T>(
    endpoint: string,
    options: globalThis.RequestInit = {},
  ): Promise<T> {
    const token = customAuthService.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(this.buildUrl(endpoint), {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        customAuthService.logout();
        throw new Error('Authentication failed. Please login again.');
      }

      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail?.[0]?.msg || error.message || 'Request failed');
    }

    return response.json() as Promise<T>;
  }

  /**
   * Send message using session chat API (compatible with LobeChat)
   * This endpoint creates both user and assistant messages automatically
   */
  private async sendMessageViaSessionChat(
    params: SendMessageServerParams,
    abortController: AbortController,
  ): Promise<SendMessageServerResponse> {
    // Ensure we have a sessionId - create one if needed
    let sessionId = params.sessionId;
    
    if (!sessionId) {
      // Create a new session with default agent (ID 1)
      try {
        const { restApiService } = await import('./restApi');
        
        // Create session with default agent
        const newSession: any = await restApiService.createSession({
          type: 'agent',
          meta: {
            agentId: 1, // Default agent ID
          },
        });
        
        // Handle different response formats
        sessionId = newSession?.id || newSession?.session_id || newSession?.sessionId;
        
        if (!sessionId) {
          // If session creation doesn't return ID, try to get it from the response
          // or generate a temporary one (backend should handle this)
          console.warn('[AiChatService] Session created but no ID returned:', newSession);
          throw new Error('Failed to get session ID from response');
        }
      } catch (error) {
        console.error('[AiChatService] Failed to create session:', error);
        throw new Error('Failed to create session. Please try again.');
      }
    }

    // Call session chat endpoint (creates both messages automatically)
    const response = await this.authenticatedRequest<{
      user_message_id: string;
      assistant_message_id: string;
      session_id: string;
      topic_id: string | null;
      is_create_new_topic: boolean;
      messages: Array<{
        id: string | null;
        role: string;
        content: string;
        timestamp: string | null;
        createdAt: number | null;
        updatedAt: number | null;
        metadata: Record<string, any> | null;
        model: string | null;
        provider: string | null;
        parentId: string | null;
      }>;
      topics: Array<any>;
    }>(
      `api/conversations/sessions/${sessionId}/chat`,
      {
        body: JSON.stringify({
          message: params.newUserMessage.content,
          model: params.newAssistantMessage.model || null,
          provider: params.newAssistantMessage.provider || null,
          files: params.newUserMessage.files || null,
          parent_id: params.newUserMessage.parentId || null,
          topic_id: params.topicId || null,
          create_new_topic: false,
        }),
        method: 'POST',
        signal: abortController?.signal,
      },
    );

    // Convert backend response to LobeChat format
    const userMessage = response.messages.find((m) => m.role === 'user');
    const assistantMessage = response.messages.find((m) => m.role === 'assistant');

    if (!userMessage || !assistantMessage) {
      throw new Error('Invalid response from server');
    }

    return {
      assistantMessageId: response.assistant_message_id,
      isCreateNewTopic: response.is_create_new_topic,
      messages: response.messages.map((msg) => ({
        content: msg.content,
        createdAt: msg.createdAt || (msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now()),
        files: msg.metadata?.files || [],
        id: msg.id || `msg-${Date.now()}`,
        model: msg.model,
        parentId: msg.parentId,
        provider: msg.provider,
        role: msg.role as 'user' | 'assistant',
        updatedAt: msg.updatedAt || (msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now()),
      })) as any,
      topicId: response.topic_id || '',
      userMessageId: response.user_message_id,
    };
  }

  sendMessageInServer = async (
    params: SendMessageServerParams,
    abortController: AbortController,
  ): Promise<SendMessageServerResponse> => {
    // If custom auth is enabled, ALWAYS use custom API - never fallback to lambda
    if (enableCustomAuth) {
      // Check if we have authentication token
      const token = customAuthService.getAccessToken();
      if (!token) {
        throw new Error('Not authenticated. Please login again.');
      }

      // Always use session chat API when custom auth is enabled
      // This ensures we never call /trpc/lambda when custom auth is active
      // The session chat API creates both messages automatically and handles agent assignment
      return await this.sendMessageViaSessionChat(params, abortController);
    }

    // Only use lambda client when custom auth is NOT enabled
    return lambdaClient.aiChat.sendMessageInServer.mutate(cleanObject(params), {
      context: { showNotification: false },
      signal: abortController?.signal,
    });
  };

  generateJSON = async (
    params: Omit<StructureOutputParams, 'keyVaultsPayload'>,
    abortController: AbortController,
  ) => {
    // If custom auth is enabled, ALWAYS use custom API - never fallback to lambda
    if (enableCustomAuth) {
      const token = customAuthService.getAccessToken();
      if (!token) {
        throw new Error('Not authenticated. Please login again.');
      }

      const response = await fetch(this.buildUrl('api/openai/chat/completions'), {
        body: JSON.stringify({
          messages: params.messages,
          model: params.model,
          response_format: params.schema
            ? {
                json_schema: {
                  description: params.schema.description,
                  name: params.schema.name,
                  schema: params.schema.schema,
                  strict: params.schema.strict,
                },
                type: 'json_schema',
              }
            : undefined,
          stream: false,
          tools: params.tools,
        }),
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: abortController?.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          customAuthService.logout();
          throw new Error('Authentication failed. Please login again.');
        }

        const error = await response.json().catch(() => ({ detail: 'Failed to generate JSON' }));
        throw new Error(error.detail?.[0]?.msg || error.message || 'Failed to generate JSON');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    }

    // Only use lambda client when custom auth is NOT enabled
    return lambdaClient.aiChat.outputJSON.mutate(
      { ...params, keyVaultsPayload: createXorKeyVaultsPayload(params.provider) },
      {
        context: { showNotification: false },
        signal: abortController?.signal,
      },
    );
  };

  // sendGroupMessageInServer = async (params: SendMessageServerParams) => {
  //   return lambdaClient.aiChat.sendGroupMessageInServer.mutate(cleanObject(params));
  // };
}

export const aiChatService = new AiChatService();
