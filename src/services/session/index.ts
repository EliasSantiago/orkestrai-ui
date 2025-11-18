/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PartialDeep } from 'type-fest';

import { lambdaClient } from '@/libs/trpc/client';
import { LobeAgentChatConfig, LobeAgentConfig } from '@/types/agent';
import { MetaData } from '@/types/meta';
import {
  ChatSessionList,
  LobeAgentSession,
  LobeSessionType,
  LobeSessions,
  SessionGroupItem,
  SessionRankItem,
  UpdateSessionParams,
} from '@/types/session';
import { customSessionService } from '../customSession';

// Check if custom auth is enabled
const enableCustomAuth =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1';

export class SessionService {
  hasSessions = async (): Promise<boolean> => {
    const result = await this.countSessions();
    return result === 0;
  };

  createSession = async (
    type: LobeSessionType,
    data: Partial<LobeAgentSession>,
  ): Promise<string> => {
    // If custom auth is enabled, sessions are created automatically by the backend
    // when sending messages, so we can return a temporary ID
    if (enableCustomAuth) {
      // Return a temporary ID - the real session will be created when first message is sent
      return `temp-session-${Date.now()}`;
    }

    const { config, group, meta, ...session } = data;
    return lambdaClient.session.createSession.mutate({
      config: { ...config, ...meta } as any,
      session: { ...session, groupId: group },
      type,
    });
  };

  cloneSession = (id: string, newTitle: string): Promise<string | undefined> => {
    // Cloning not supported in custom backend mode
    if (enableCustomAuth) {
      return Promise.resolve(undefined);
    }
    return lambdaClient.session.cloneSession.mutate({ id, newTitle });
  };

  getGroupedSessions = async (): Promise<ChatSessionList> => {
    // If custom auth is enabled, ALWAYS use custom API - never fallback to lambda
    if (enableCustomAuth) {
      const sessionIds = await customSessionService.getSessions();
      
      // Convert to ChatSessionList format
      // Group by date (simplified - you might want to enhance this)
      const sessions = await Promise.all(
        sessionIds.map(async (sessionId) => {
          try {
            const info = await customSessionService.getSessionInfo(sessionId);
            return {
              id: sessionId,
              type: 'agent' as const,
              createdAt: info.last_activity ? new Date(info.last_activity).getTime() : Date.now(),
              updatedAt: info.last_activity ? new Date(info.last_activity).getTime() : Date.now(),
              meta: {
                title: `Session ${sessionId.substring(0, 8)}`,
              },
            };
          } catch {
            return {
              id: sessionId,
              type: 'agent' as const,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              meta: {
                title: `Session ${sessionId.substring(0, 8)}`,
              },
            };
          }
        }),
      );

      // Group by date
      const grouped: ChatSessionList = {
        sessionGroups: [],
        sessions: sessions.sort((a, b) => b.updatedAt - a.updatedAt),
      };

      return grouped;
    }

    // Only use lambda client when custom auth is NOT enabled
    return lambdaClient.session.getGroupedSessions.query();
  };

  countSessions = async (params?: {
    endDate?: string;
    range?: [string, string];
    startDate?: string;
  }): Promise<number> => {
    return lambdaClient.session.countSessions.query(params);
  };

  rankSessions = async (limit?: number): Promise<SessionRankItem[]> => {
    return lambdaClient.session.rankSessions.query(limit);
  };

  updateSession = (id: string, data: Partial<UpdateSessionParams>) => {
    // Session updates not fully supported in custom backend mode
    // Metadata updates could be stored in session metadata if backend supports it
    if (enableCustomAuth) {
      // For now, just return success
      return Promise.resolve();
    }

    const { group, pinned, meta, updatedAt } = data;
    return lambdaClient.session.updateSession.mutate({
      id,
      value: { groupId: group === 'default' ? null : group, pinned, ...meta, updatedAt },
    });
  };

  // TODO: Need to be fixed
  getSessionConfig = async (id: string): Promise<LobeAgentConfig> => {
    // @ts-ignore
    return lambdaClient.agent.getAgentConfig.query({ sessionId: id });
  };

  updateSessionConfig = (
    id: string,
    config: PartialDeep<LobeAgentConfig>,
    signal?: AbortSignal,
  ) => {
    return lambdaClient.session.updateSessionConfig.mutate(
      { id, value: config },
      {
        context: { showNotification: false },
        signal,
      },
    );
  };

  updateSessionMeta = (id: string, meta: Partial<MetaData>, signal?: AbortSignal) => {
    return lambdaClient.session.updateSessionConfig.mutate({ id, value: meta }, { signal });
  };

  updateSessionChatConfig = (
    id: string,
    value: Partial<LobeAgentChatConfig>,
    signal?: AbortSignal,
  ) => {
    return lambdaClient.session.updateSessionChatConfig.mutate({ id, value }, { signal });
  };

  searchSessions = (keywords: string): Promise<LobeSessions> => {
    // Search not supported in custom backend mode
    if (enableCustomAuth) {
      return Promise.resolve([]);
    }
    return lambdaClient.session.searchSessions.query({ keywords });
  };

  removeSession = (id: string) => {
    // If custom auth is enabled, use custom API
    if (enableCustomAuth) {
      return customSessionService.deleteSession(id);
    }
    return lambdaClient.session.removeSession.mutate({ id });
  };

  removeAllSessions = () => {
    // If custom auth is enabled, use custom API
    if (enableCustomAuth) {
      return customSessionService.deleteAllSessions();
    }
    return lambdaClient.session.removeAllSessions.mutate();
  };

  // ************************************** //
  // ***********  SessionGroup  *********** //
  // ************************************** //

  createSessionGroup = (name: string, sort?: number): Promise<string> => {
    return lambdaClient.sessionGroup.createSessionGroup.mutate({ name, sort });
  };

  removeSessionGroup = (id: string, removeChildren?: boolean) => {
    return lambdaClient.sessionGroup.removeSessionGroup.mutate({ id, removeChildren });
  };

  removeSessionGroups = () => {
    return lambdaClient.sessionGroup.removeAllSessionGroups.mutate();
  };

  updateSessionGroup = (id: string, value: Partial<SessionGroupItem>) => {
    return lambdaClient.sessionGroup.updateSessionGroup.mutate({ id, value });
  };

  updateSessionGroupOrder = (sortMap: { id: string; sort: number }[]) => {
    return lambdaClient.sessionGroup.updateSessionGroupOrder.mutate({ sortMap });
  };
}

export const sessionService = new SessionService();
