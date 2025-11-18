import {
  ChatMessageError,
  ChatMessagePluginError,
  ChatTTS,
  ChatTranslate,
  CreateMessageParams,
  CreateMessageResult,
  MessageMetadata,
  ModelRankItem,
  UIChatMessage,
  UpdateMessageParams,
  UpdateMessageRAGParams,
  UpdateMessageResult,
} from '@lobechat/types';
import type { HeatmapsProps } from '@lobehub/charts';

import { INBOX_SESSION_ID } from '@/const/session';
import { lambdaClient } from '@/libs/trpc/client';
import { customMessageService } from '../customMessage';
import { customSessionService } from '../customSession';

import { abortableRequest } from '../utils/abortableRequest';

// Check if custom auth is enabled
const enableCustomAuth =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1';

export class MessageService {
  createMessage = async ({
    sessionId,
    ...params
  }: CreateMessageParams): Promise<CreateMessageResult> => {
    // If custom auth is enabled, use custom API
    if (enableCustomAuth && sessionId) {
      try {
        // Add message to session via custom API
        await customMessageService.addMessage(
          sessionId,
          params.content || '',
          params.metadata,
        );
        // Return a simplified result
        return {
          id: `msg-${Date.now()}`,
          sessionId,
        } as CreateMessageResult;
      } catch (error) {
        console.error('[MessageService] Failed to create message via custom API:', error);
        // Fallback to lambda
      }
    }

    return lambdaClient.message.createMessage.mutate({
      ...params,
      sessionId: sessionId ? this.toDbSessionId(sessionId) : undefined,
    });
  };

  getMessages = async (
    sessionId: string,
    topicId?: string,
    groupId?: string,
  ): Promise<UIChatMessage[]> => {
    // If custom auth is enabled, use custom API
    if (enableCustomAuth && sessionId && !groupId) {
      try {
        const history = await customSessionService.getSessionHistory(sessionId);
        // Convert backend format to UIChatMessage format
        return history.messages.map((msg, index) => ({
          id: `msg-${sessionId}-${index}`,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          createdAt: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
          updatedAt: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
          meta: msg.metadata || {},
        })) as UIChatMessage[];
      } catch (error) {
        console.error('[MessageService] Failed to get messages via custom API:', error);
        // Fallback to lambda
      }
    }

    const data = await lambdaClient.message.getMessages.query({
      groupId,
      sessionId: this.toDbSessionId(sessionId),
      topicId,
    });

    return data as unknown as UIChatMessage[];
  };

  getGroupMessages = async (groupId: string, topicId?: string): Promise<UIChatMessage[]> => {
    const data = await lambdaClient.message.getMessages.query({
      groupId,
      topicId,
    });
    return data as unknown as UIChatMessage[];
  };

  countMessages = async (params?: {
    endDate?: string;
    range?: [string, string];
    startDate?: string;
  }): Promise<number> => {
    return lambdaClient.message.count.query(params);
  };

  countWords = async (params?: {
    endDate?: string;
    range?: [string, string];
    startDate?: string;
  }): Promise<number> => {
    return lambdaClient.message.countWords.query(params);
  };

  rankModels = async (): Promise<ModelRankItem[]> => {
    return lambdaClient.message.rankModels.query();
  };

  getHeatmaps = async (): Promise<HeatmapsProps['data']> => {
    return lambdaClient.message.getHeatmaps.query();
  };

  updateMessageError = async (id: string, value: ChatMessageError) => {
    const error = value.type ? value : { body: value, message: value.message, type: 'ApplicationRuntimeError' };


    return lambdaClient.message.update.mutate({ id, value: { error } });
  };

  updateMessagePluginArguments = async (id: string, value: string | Record<string, any>) => {
    const args = typeof value === 'string' ? value : JSON.stringify(value);
    return lambdaClient.message.updateMessagePlugin.mutate({ id, value: { arguments: args } });
  };

  updateMessage = async (
    id: string,
    value: Partial<UpdateMessageParams>,
    options?: { sessionId?: string | null; topicId?: string | null },
  ): Promise<UpdateMessageResult> => {
    return lambdaClient.message.update.mutate({
      id,
      sessionId: options?.sessionId,
      topicId: options?.topicId,
      value,
    });
  };

  updateMessageTranslate = async (id: string, translate: Partial<ChatTranslate> | false) => {
    return lambdaClient.message.updateTranslate.mutate({ id, value: translate as ChatTranslate });
  };

  updateMessageTTS = async (id: string, tts: Partial<ChatTTS> | false) => {
    return lambdaClient.message.updateTTS.mutate({ id, value: tts });
  };

  updateMessageMetadata = async (
    id: string,
    value: Partial<MessageMetadata>,
    options?: { sessionId?: string | null; topicId?: string | null },
  ): Promise<UpdateMessageResult> => {
    return abortableRequest.execute(`message-metadata-${id}`, (signal) =>
      lambdaClient.message.updateMetadata.mutate(
        {
          id,
          sessionId: options?.sessionId,
          topicId: options?.topicId,
          value,
        },
        { signal },
      ),
    );
  };

  updateMessagePluginState = async (
    id: string,
    value: Record<string, any>,
    options?: { sessionId?: string | null; topicId?: string | null },
  ): Promise<UpdateMessageResult> => {
    return lambdaClient.message.updatePluginState.mutate({
      id,
      sessionId: options?.sessionId,
      topicId: options?.topicId,
      value,
    });
  };

  updateMessagePluginError = async (
    id: string,
    error: ChatMessagePluginError | null,
    options?: { sessionId?: string | null; topicId?: string | null },
  ): Promise<UpdateMessageResult> => {
    return lambdaClient.message.updatePluginError.mutate({
      id,
      sessionId: options?.sessionId,
      topicId: options?.topicId,
      value: error as any,
    });
  };

  updateMessageRAG = async (
    id: string,
    data: UpdateMessageRAGParams,
    options?: { sessionId?: string | null; topicId?: string | null },
  ): Promise<UpdateMessageResult> => {
    return lambdaClient.message.updateMessageRAG.mutate({
      id,
      sessionId: options?.sessionId,
      topicId: options?.topicId,
      value: data,
    });
  };

  removeMessage = async (
    id: string,
    options?: { sessionId?: string | null; topicId?: string | null },
  ): Promise<UpdateMessageResult> => {
    return lambdaClient.message.removeMessage.mutate({
      id,
      sessionId: options?.sessionId,
      topicId: options?.topicId,
    });
  };

  removeMessages = async (
    ids: string[],
    options?: { sessionId?: string | null; topicId?: string | null },
  ): Promise<UpdateMessageResult> => {
    return lambdaClient.message.removeMessages.mutate({
      ids,
      sessionId: options?.sessionId,
      topicId: options?.topicId,
    });
  };

  removeMessagesByAssistant = async (sessionId: string, topicId?: string) => {
    return lambdaClient.message.removeMessagesByAssistant.mutate({
      sessionId: this.toDbSessionId(sessionId),
      topicId,
    });
  };

  removeMessagesByGroup = async (groupId: string, topicId?: string) => {
    return lambdaClient.message.removeMessagesByGroup.mutate({
      groupId,
      topicId,
    });
  };

  removeAllMessages = async () => {
    return lambdaClient.message.removeAllMessages.mutate();
  };

  private toDbSessionId = (sessionId: string | undefined) => {
    return sessionId === INBOX_SESSION_ID ? null : sessionId;
  };
}

export const messageService = new MessageService();
