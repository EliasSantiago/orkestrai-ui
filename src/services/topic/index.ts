import { INBOX_SESSION_ID } from '@/const/session';
import { lambdaClient } from '@/libs/trpc/client';
import { BatchTaskResult } from '@/types/service';
import { ChatTopic, CreateTopicParams, QueryTopicParams, TopicRankItem } from '@/types/topic';
import { restApiService } from '../restApi';

// Check if custom auth is enabled
const enableCustomAuth =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1';

export class TopicService {
  createTopic = (params: CreateTopicParams): Promise<string> => {
    if (enableCustomAuth) {
      return restApiService.createTopic({
        ...params,
        sessionId: this.toDbSessionId(params.sessionId),
      });
    }
    return lambdaClient.topic.createTopic.mutate({
      ...params,
      sessionId: this.toDbSessionId(params.sessionId),
    });
  };

  batchCreateTopics = (importTopics: ChatTopic[]): Promise<BatchTaskResult> => {
    if (enableCustomAuth) {
      return restApiService.batchCreateTopics(importTopics);
    }
    return lambdaClient.topic.batchCreateTopics.mutate(importTopics);
  };

  cloneTopic = (id: string, newTitle?: string): Promise<string> => {
    if (enableCustomAuth) {
      return restApiService.cloneTopic(id, newTitle || '');
    }
    return lambdaClient.topic.cloneTopic.mutate({ id, newTitle });
  };

  getTopics = (params: QueryTopicParams): Promise<ChatTopic[]> => {
    if (enableCustomAuth) {
      return restApiService.getTopics(this.toDbSessionId(params.containerId));
    }
    return lambdaClient.topic.getTopics.query({
      ...params,
      containerId: this.toDbSessionId(params.containerId),
    }) as any;
  };

  getAllTopics = (): Promise<ChatTopic[]> => {
    if (enableCustomAuth) {
      return restApiService.getAllTopics();
    }
    return lambdaClient.topic.getAllTopics.query() as any;
  };

  countTopics = async (params?: {
    endDate?: string;
    range?: [string, string];
    startDate?: string;
  }): Promise<number> => {
    if (enableCustomAuth) {
      return restApiService.countTopics(params);
    }
    return lambdaClient.topic.countTopics.query(params);
  };

  rankTopics = async (limit?: number): Promise<TopicRankItem[]> => {
    if (enableCustomAuth) {
      return restApiService.rankTopics(limit);
    }
    return lambdaClient.topic.rankTopics.query(limit);
  };

  searchTopics = (keywords: string, sessionId?: string, groupId?: string): Promise<ChatTopic[]> => {
    if (enableCustomAuth) {
      return restApiService.searchTopics({
        keywords,
        sessionId: this.toDbSessionId(sessionId),
      });
    }
    return lambdaClient.topic.searchTopics.query({
      groupId,
      keywords,
      sessionId: this.toDbSessionId(sessionId),
    }) as any;
  };

  updateTopic = (id: string, data: Partial<ChatTopic>) => {
    if (enableCustomAuth) {
      return restApiService.updateTopic(id, data);
    }
    return lambdaClient.topic.updateTopic.mutate({ id, value: data });
  };

  removeTopic = (id: string) => {
    if (enableCustomAuth) {
      return restApiService.removeTopic(id);
    }
    return lambdaClient.topic.removeTopic.mutate({ id });
  };

  removeTopics = (sessionId: string) => {
    if (enableCustomAuth) {
      return restApiService.batchDeleteBySessionId(this.toDbSessionId(sessionId) || '');
    }
    return lambdaClient.topic.batchDeleteBySessionId.mutate({ id: this.toDbSessionId(sessionId) });
  };

  batchRemoveTopics = (topics: string[]) => {
    if (enableCustomAuth) {
      return restApiService.batchDeleteTopics(topics);
    }
    return lambdaClient.topic.batchDelete.mutate({ ids: topics });
  };

  removeAllTopic = () => {
    if (enableCustomAuth) {
      return restApiService.removeAllTopics();
    }
    return lambdaClient.topic.removeAllTopics.mutate();
  };

  private toDbSessionId = (sessionId?: string | null) =>
    sessionId === INBOX_SESSION_ID ? null : sessionId;
}

export const topicService = new TopicService();
