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

    const base = baseUrl.replace(/\/+$/g, '');
    const path = endpoint.replace(/^\/+/g, '');
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
    options: RequestInit = {},
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
    const messages: Array<{ role: string; content: string }> = [];

    // Add user message
    messages.push({
      role: 'user',
      content: params.newUserMessage.content,
    });

    // Call OpenAI compatible endpoint
    const response = await this.authenticatedRequest<{
      choices: Array<{
        message: { role: string; content: string };
      }>;
    }>(
      'api/openai/chat/completions',
      {
        method: 'POST',
        body: JSON.stringify({
          model: params.newAssistantMessage.model || 'gpt-4o-mini',
          messages,
          stream: false,
        }),
        signal: abortController?.signal,
      },
    );

    // Extract response
    const assistantContent = response.choices[0]?.message?.content || '';

    // For now, return a simplified response
    // In a full implementation, you'd need to create messages in your backend
    // and return proper IDs
    return {
      assistantMessageId: `temp-${Date.now()}`,
      isCreateNewTopic: false,
      messages: [
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: params.newUserMessage.content,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantContent,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ] as any,
      topicId: params.topicId || '',
      userMessageId: `user-${Date.now()}`,
    };
  }

  sendMessageInServer = async (
    params: SendMessageServerParams,
    abortController: AbortController,
  ): Promise<SendMessageServerResponse> {
    // If custom auth is enabled, use custom API
    if (enableCustomAuth) {
      // Try to get backendAgentId from session
      // For now, we'll use OpenAI compatible API as fallback
      // In a full implementation, you'd get the agentId from the session
      try {
        return await this.sendMessageViaOpenAI(params, abortController);
      } catch (error) {
        console.error('[AiChatService] Failed to use custom API, falling back to lambda:', error);
        // Fallback to lambda if custom API fails
      }
    }

    // Use lambda client as before
    return lambdaClient.aiChat.sendMessageInServer.mutate(cleanObject(params), {
      context: { showNotification: false },
      signal: abortController?.signal,
    });
  };

  generateJSON = async (
    params: Omit<StructureOutputParams, 'keyVaultsPayload'>,
    abortController: AbortController,
  ) => {
    // If custom auth is enabled, use OpenAI compatible API with structured output
    if (enableCustomAuth) {
      try {
        const token = customAuthService.getAccessToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(this.buildUrl('api/openai/chat/completions'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: params.model,
            messages: params.messages,
            tools: params.tools,
            response_format: params.schema
              ? {
                  type: 'json_schema',
                  json_schema: {
                    name: params.schema.name,
                    description: params.schema.description,
                    schema: params.schema.schema,
                    strict: params.schema.strict,
                  },
                }
              : undefined,
            stream: false,
          }),
          signal: abortController?.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to generate JSON');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('[AiChatService] Failed to use custom API for JSON, falling back to lambda:', error);
        // Fallback to lambda
      }
    }

    // Use lambda client as before
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
