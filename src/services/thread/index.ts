import { CreateMessageParams } from '@lobechat/types';

import { INBOX_SESSION_ID } from '@/const/session';
import { lambdaClient } from '@/libs/trpc/client';
import { CreateThreadParams, ThreadItem } from '@/types/topic';
import { restApiService } from '../restApi';

// Check if custom auth is enabled
const enableCustomAuth =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1';

interface CreateThreadWithMessageParams extends CreateThreadParams {
  message: CreateMessageParams;
}

export class ThreadService {
  getThreads = (topicId: string): Promise<ThreadItem[]> => {
    if (enableCustomAuth) {
      return restApiService.getThreads(topicId);
    }
    return lambdaClient.thread.getThreads.query({ topicId });
  };

  createThreadWithMessage = async ({
    message,
    ...params
  }: CreateThreadWithMessageParams): Promise<{ messageId: string; threadId: string }> => {
    if (enableCustomAuth) {
      return restApiService.createThreadWithMessage({
        ...params,
        message: { ...message, sessionId: this.toDbSessionId(message.sessionId) },
      });
    }
    return lambdaClient.thread.createThreadWithMessage.mutate({
      ...params,
      message: { ...message, sessionId: this.toDbSessionId(message.sessionId) },
    });
  };

  updateThread = async (id: string, data: Partial<ThreadItem>) => {
    if (enableCustomAuth) {
      return restApiService.updateThread(id, data);
    }
    return lambdaClient.thread.updateThread.mutate({ id, value: data });
  };

  removeThread = async (id: string) => {
    if (enableCustomAuth) {
      return restApiService.removeThread(id);
    }
    return lambdaClient.thread.removeThread.mutate({ id });
  };

  private toDbSessionId = (sessionId: string | undefined) => {
    return sessionId === INBOX_SESSION_ID ? null : sessionId;
  };
}

export const threadService = new ThreadService();
