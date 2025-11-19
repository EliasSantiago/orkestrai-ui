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
import { restApiService } from '../restApi';

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
    // If custom auth is enabled, ALWAYS use custom API - never fallback to lambda
    if (enableCustomAuth && sessionId) {
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
    }

    // Only use lambda client when custom auth is NOT enabled
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
    // If custom auth is enabled, ALWAYS use custom API - never fallback to lambda
    if (enableCustomAuth && sessionId && !groupId) {
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
    }

    // Only use lambda client when custom auth is NOT enabled
    const data = await lambdaClient.message.getMessages.query({
      groupId,
      sessionId: this.toDbSessionId(sessionId),
      topicId,
    });

    return data as unknown as UIChatMessage[];
  };

  getGroupMessages = async (groupId: string, topicId?: string): Promise<UIChatMessage[]> => {
    if (enableCustomAuth) {
      const data = await restApiService.getMessages({ groupId, topicId });
      return data as unknown as UIChatMessage[];
    }
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
    if (enableCustomAuth) {
      return restApiService.countMessages(params);
    }
    return lambdaClient.message.count.query(params);
  };

  countWords = async (params?: {
    endDate?: string;
    range?: [string, string];
    startDate?: string;
  }): Promise<number> => {
    if (enableCustomAuth) {
      return restApiService.countWords(params);
    }
    return lambdaClient.message.countWords.query(params);
  };

  rankModels = async (): Promise<ModelRankItem[]> => {
    if (enableCustomAuth) {
      return restApiService.rankModels();
    }
    return lambdaClient.message.rankModels.query();
  };

  getHeatmaps = async (): Promise<HeatmapsProps['data']> => {
    if (enableCustomAuth) {
      return restApiService.getHeatmaps();
    }
    return lambdaClient.message.getHeatmaps.query();
  };

  updateMessageError = async (id: string, value: ChatMessageError) => {
    const error = value.type ? value : { body: value, message: value.message, type: 'ApplicationRuntimeError' };

    if (enableCustomAuth) {
      return restApiService.updateMessage(id, { error });
    }
    return lambdaClient.message.update.mutate({ id, value: { error } });
  };

  updateMessagePluginArguments = async (id: string, value: string | Record<string, any>) => {
    const args = typeof value === 'string' ? value : JSON.stringify(value);
    if (enableCustomAuth) {
      return restApiService.updateMessagePluginState(id, { arguments: args });
    }
    return lambdaClient.message.updateMessagePlugin.mutate({ id, value: { arguments: args } });
  };

  updateMessage = async (
    id: string,
    value: Partial<UpdateMessageParams>,
    options?: { sessionId?: string | null; topicId?: string | null },
  ): Promise<UpdateMessageResult> => {
    if (enableCustomAuth) {
      return restApiService.updateMessage(id, value, options);
    }
    return lambdaClient.message.update.mutate({
      id,
      sessionId: options?.sessionId,
      topicId: options?.topicId,
      value,
    });
  };

  updateMessageTranslate = async (id: string, translate: Partial<ChatTranslate> | false) => {
    if (enableCustomAuth) {
      return restApiService.updateMessageTranslate(id, translate);
    }
    return lambdaClient.message.updateTranslate.mutate({ id, value: translate as ChatTranslate });
  };

  updateMessageTTS = async (id: string, tts: Partial<ChatTTS> | false) => {
    if (enableCustomAuth) {
      return restApiService.updateMessageTTS(id, tts);
    }
    return lambdaClient.message.updateTTS.mutate({ id, value: tts });
  };

  updateMessageMetadata = async (
    id: string,
    value: Partial<MessageMetadata>,
    options?: { sessionId?: string | null; topicId?: string | null },
  ): Promise<UpdateMessageResult> => {
    if (enableCustomAuth) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return abortableRequest.execute(`message-metadata-${id}`, (_signal) =>
        restApiService.updateMessageMetadata(id, value, options)
      );
    }
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
    if (enableCustomAuth) {
      return restApiService.updateMessagePluginState(id, value, options);
    }
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
    if (enableCustomAuth) {
      return restApiService.updateMessagePluginError(id, error, options);
    }
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
    if (enableCustomAuth) {
      return restApiService.updateMessageRAG(id, data, options);
    }
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
    if (enableCustomAuth) {
      return restApiService.removeMessage(id, options);
    }
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
    if (enableCustomAuth) {
      return restApiService.removeMessages(ids, options);
    }
    return lambdaClient.message.removeMessages.mutate({
      ids,
      sessionId: options?.sessionId,
      topicId: options?.topicId,
    });
  };

  removeMessagesByAssistant = async (sessionId: string, topicId?: string) => {
    if (enableCustomAuth) {
      return restApiService.removeMessagesByAssistant(sessionId, topicId);
    }
    return lambdaClient.message.removeMessagesByAssistant.mutate({
      sessionId: this.toDbSessionId(sessionId),
      topicId,
    });
  };

  removeMessagesByGroup = async (groupId: string, topicId?: string) => {
    if (enableCustomAuth) {
      return restApiService.removeMessagesByGroup(groupId, topicId);
    }
    return lambdaClient.message.removeMessagesByGroup.mutate({
      groupId,
      topicId,
    });
  };

  removeAllMessages = async () => {
    if (enableCustomAuth) {
      return restApiService.removeAllMessages();
    }
    return lambdaClient.message.removeAllMessages.mutate();
  };

  private toDbSessionId = (sessionId: string | undefined) => {
    return sessionId === INBOX_SESSION_ID ? null : sessionId;
  };
}

export const messageService = new MessageService();
