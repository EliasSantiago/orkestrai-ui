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

    const base = baseUrl.replaceAll(/\/+$/g, '');
    const path = endpoint.replaceAll(/^\/+/g, '');
    if (!path.startsWith('api/')) {
      return `${base}/api/${path}`;
    }
    return `${base}/${path}`;
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
   * Send message using OpenAI compatible API
   */
  private async sendMessageViaOpenAI(
    params: SendMessageServerParams,
    abortController: AbortController,
  ): Promise<SendMessageServerResponse> {
    // Convert to OpenAI format
    const messages: Array<{ content: string, role: string; }> = [];

    // If we have a sessionId, try to get message history to include context
    if (params.sessionId) {
      try {
        const { customSessionService } = await import('./customSession');
        const history = await customSessionService.getSessionHistory(params.sessionId, 10); // Get last 10 messages
        
        // Add previous messages to context (excluding the current one)
        history.messages.forEach((msg) => {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              content: msg.content,
              role: msg.role,
            });
          }
        });
      } catch (error) {
        // If we can't get history, continue with just the new message
        console.warn('[AiChatService] Could not fetch message history:', error);
      }
    }

    // Add the new user message
    messages.push({
      content: params.newUserMessage.content,
      role: 'user',
    });

    // Call OpenAI compatible endpoint
    const response = await this.authenticatedRequest<{
      choices: Array<{
        finish_reason?: string;
        message: { content: string, role: string; };
      }>;
      id?: string;
      usage?: {
        completion_tokens?: number;
        prompt_tokens?: number;
        total_tokens?: number;
      };
    }>(
      'api/openai/chat/completions',
      {
        body: JSON.stringify({
          messages,
          model: params.newAssistantMessage.model || 'gpt-4o-mini',
          stream: false,
        }),
        method: 'POST',
        signal: abortController?.signal,
      },
    );

    // Extract response
    const assistantContent = response.choices[0]?.message?.content || '';
    const timestamp = Date.now();

    // Generate consistent IDs
    const userMessageId = `user-${timestamp}`;
    const assistantMessageId = `assistant-${timestamp}`;

    // Return response in the expected format
    return {
      assistantMessageId,
      isCreateNewTopic: false,
      messages: [
        {
          content: params.newUserMessage.content,
          createdAt: timestamp,
          files: params.newUserMessage.files,
          id: userMessageId,
          parentId: params.newUserMessage.parentId,
          role: 'user',
          updatedAt: timestamp,
        },
        {
          content: assistantContent,
          createdAt: timestamp + 1,
          id: assistantMessageId,
          model: params.newAssistantMessage.model,
          provider: params.newAssistantMessage.provider,
          role: 'assistant',
          updatedAt: timestamp + 1,
        },
      ] as any,
      topicId: params.topicId || '',
      userMessageId,
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

      // Always use OpenAI compatible API when custom auth is enabled
      // This ensures we never call /trpc/lambda when custom auth is active
      return await this.sendMessageViaOpenAI(params, abortController);
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
