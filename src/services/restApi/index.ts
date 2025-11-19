/**
 * REST API Service
 * Centralized service for all REST API calls when custom auth is enabled
 * Replaces tRPC calls with direct REST endpoints
 */

import { ChatSessionList } from '@/types/session';

import { customAuthService } from '../customAuth';

// Check if custom auth is enabled
const enableCustomAuth =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_ENABLE_CUSTOM_AUTH === '1';

export class RestApiService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    const envUrl =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL
        : process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL;

    if (!baseUrl && !envUrl) {
      if (typeof window === 'undefined') {
        this.baseUrl = 'http://placeholder-for-build.local';
        return;
      }
      throw new Error(
        'NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured! Please set it in your .env file.',
      );
    }

    this.baseUrl = baseUrl || envUrl!;
  }

  private validateBaseUrl(): void {
    if (this.baseUrl === 'http://placeholder-for-build.local') {
      throw new Error(
        'NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured! Please set it in your .env file.'
      );
    }
  }

  private buildUrl(endpoint: string): string {
    // Remove trailing slashes from base URL
    let base = this.baseUrl.replace(/\/+$/g, '');
    // Remove leading slashes from endpoint
    let path = endpoint.replace(/^\/+/g, '');
    
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
  async request<T>(
    endpoint: string,
    options: globalThis.RequestInit = {},
  ): Promise<T> {
    this.validateBaseUrl();
    
    if (!enableCustomAuth) {
      throw new Error('RestApiService can only be used when custom auth is enabled');
    }

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

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  // ============================================
  // Session Routes
  // ============================================

  async getGroupedSessions(): Promise<ChatSessionList> {
    // Backend now returns the correct format directly
    // { sessionGroups: [], sessions: LobeAgentSession[] }
    return this.request<ChatSessionList>('api/sessions/grouped');
  }

  async createSession(data: any) {
    return this.request('api/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cloneSession(id: string, newTitle: string) {
    return this.request(`api/sessions/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify({ newTitle }),
    });
  }

  async countSessions(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`api/sessions/count${query}`);
  }

  async rankSessions(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`api/sessions/rank${query}`);
  }

  async updateSession(id: string, data: any) {
    return this.request(`api/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateSessionConfig(id: string, config: any) {
    return this.request(`api/sessions/${id}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async updateSessionChatConfig(id: string, config: any) {
    return this.request(`api/sessions/${id}/chat-config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async searchSessions(keywords: string) {
    return this.request(`api/sessions/search?keywords=${encodeURIComponent(keywords)}`);
  }

  async removeSession(id: string) {
    return this.request(`api/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  async removeAllSessions() {
    return this.request('api/sessions', {
      method: 'DELETE',
    });
  }

  // Session Groups
  async createSessionGroup(name: string, sort?: number) {
    return this.request('api/session-groups', {
      method: 'POST',
      body: JSON.stringify({ name, sort }),
    });
  }

  async removeSessionGroup(id: string, removeChildren?: boolean) {
    const query = removeChildren ? '?removeChildren=true' : '';
    return this.request(`api/session-groups/${id}${query}`, {
      method: 'DELETE',
    });
  }

  async removeAllSessionGroups() {
    return this.request('api/session-groups', {
      method: 'DELETE',
    });
  }

  async updateSessionGroup(id: string, data: any) {
    return this.request(`api/session-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateSessionGroupOrder(sortMap: { id: string; sort: number }[]) {
    return this.request('api/session-groups/order', {
      method: 'PUT',
      body: JSON.stringify({ sortMap }),
    });
  }

  // ============================================
  // Message Routes
  // ============================================

  async getMessages(params: { sessionId?: string; topicId?: string; groupId?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params.sessionId) query.append('sessionId', params.sessionId);
    if (params.topicId) query.append('topicId', params.topicId);
    if (params.groupId) query.append('groupId', params.groupId);
    if (params.limit) query.append('limit', params.limit.toString());
    return this.request(`api/messages?${query.toString()}`);
  }

  async createMessage(data: any) {
    return this.request('api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async countMessages(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`api/messages/count${query}`);
  }

  async countWords(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`api/messages/words${query}`);
  }

  async rankModels() {
    return this.request('api/messages/rank-models');
  }

  async getHeatmaps() {
    return this.request('api/messages/heatmaps');
  }

  async updateMessage(id: string, data: any, options?: { sessionId?: string; topicId?: string }) {
    const query = new URLSearchParams();
    if (options?.sessionId) query.append('sessionId', options.sessionId);
    if (options?.topicId) query.append('topicId', options.topicId);
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.request(`api/messages/${id}${queryStr}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateMessageTranslate(id: string, translate: any) {
    return this.request(`api/messages/${id}/translate`, {
      method: 'PUT',
      body: JSON.stringify(translate),
    });
  }

  async updateMessageTTS(id: string, tts: any) {
    return this.request(`api/messages/${id}/tts`, {
      method: 'PUT',
      body: JSON.stringify(tts),
    });
  }

  async updateMessageMetadata(id: string, metadata: any, options?: { sessionId?: string; topicId?: string }) {
    const query = new URLSearchParams();
    if (options?.sessionId) query.append('sessionId', options.sessionId);
    if (options?.topicId) query.append('topicId', options.topicId);
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.request(`api/messages/${id}/metadata${queryStr}`, {
      method: 'PUT',
      body: JSON.stringify(metadata),
    });
  }

  async updateMessagePluginState(id: string, state: any, options?: { sessionId?: string; topicId?: string }) {
    const query = new URLSearchParams();
    if (options?.sessionId) query.append('sessionId', options.sessionId);
    if (options?.topicId) query.append('topicId', options.topicId);
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.request(`api/messages/${id}/plugin-state${queryStr}`, {
      method: 'PUT',
      body: JSON.stringify(state),
    });
  }

  async updateMessagePluginError(id: string, error: any, options?: { sessionId?: string; topicId?: string }) {
    const query = new URLSearchParams();
    if (options?.sessionId) query.append('sessionId', options.sessionId);
    if (options?.topicId) query.append('topicId', options.topicId);
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.request(`api/messages/${id}/plugin-error${queryStr}`, {
      method: 'PUT',
      body: JSON.stringify(error),
    });
  }

  async updateMessageRAG(id: string, rag: any, options?: { sessionId?: string; topicId?: string }) {
    const query = new URLSearchParams();
    if (options?.sessionId) query.append('sessionId', options.sessionId);
    if (options?.topicId) query.append('topicId', options.topicId);
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.request(`api/messages/${id}/rag${queryStr}`, {
      method: 'PUT',
      body: JSON.stringify(rag),
    });
  }

  async removeMessage(id: string, options?: { sessionId?: string; topicId?: string }) {
    const query = new URLSearchParams();
    if (options?.sessionId) query.append('sessionId', options.sessionId);
    if (options?.topicId) query.append('topicId', options.topicId);
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.request(`api/messages/${id}${queryStr}`, {
      method: 'DELETE',
    });
  }

  async removeMessages(ids: string[], options?: { sessionId?: string; topicId?: string }) {
    const query = new URLSearchParams();
    if (options?.sessionId) query.append('sessionId', options.sessionId);
    if (options?.topicId) query.append('topicId', options.topicId);
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return this.request(`api/messages/batch${queryStr}`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  }

  async removeMessagesByAssistant(sessionId: string, topicId?: string) {
    const query = topicId ? `?topicId=${topicId}` : '';
    return this.request(`api/messages/by-assistant/${sessionId}${query}`, {
      method: 'DELETE',
    });
  }

  async removeMessagesByGroup(groupId: string, topicId?: string) {
    const query = topicId ? `?topicId=${topicId}` : '';
    return this.request(`api/messages/by-group/${groupId}${query}`, {
      method: 'DELETE',
    });
  }

  async removeAllMessages() {
    return this.request('api/messages', {
      method: 'DELETE',
    });
  }

  async removeMessageQuery(id: string) {
    return this.request(`api/messages/${id}/query`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Topic Routes
  // ============================================

  async getTopics(sessionId?: string) {
    const query = sessionId ? `?sessionId=${sessionId}` : '';
    return this.request(`api/topics${query}`);
  }

  async createTopic(data: any) {
    return this.request('api/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async batchCreateTopics(topics: any[]) {
    return this.request('api/topics/batch', {
      method: 'POST',
      body: JSON.stringify({ topics }),
    });
  }

  async cloneTopic(id: string, newTitle: string) {
    return this.request(`api/topics/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify({ newTitle }),
    });
  }

  async getAllTopics() {
    return this.request('api/topics/all');
  }

  async countTopics(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`api/topics/count${query}`);
  }

  async rankTopics(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`api/topics/rank${query}`);
  }

  async searchTopics(params: { keywords: string; sessionId?: string }) {
    const query = new URLSearchParams({ keywords: params.keywords });
    if (params.sessionId) query.append('sessionId', params.sessionId);
    return this.request(`api/topics/search?${query.toString()}`);
  }

  async updateTopic(id: string, data: any) {
    return this.request(`api/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeTopic(id: string) {
    return this.request(`api/topics/${id}`, {
      method: 'DELETE',
    });
  }

  async batchDeleteBySessionId(sessionId: string) {
    return this.request(`api/topics/by-session/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async batchDeleteTopics(ids: string[]) {
    return this.request('api/topics/batch', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  }

  async removeAllTopics() {
    return this.request('api/topics', {
      method: 'DELETE',
    });
  }

  // ============================================
  // User Routes
  // ============================================

  async getUserRegistrationDuration() {
    return this.request('api/user/registration-duration');
  }

  async getUserState() {
    return this.request('api/user/state');
  }

  async getUserSSOProviders() {
    return this.request('api/user/sso-providers');
  }

  async unlinkSSOProvider(provider: string, providerAccountId: string) {
    return this.request('api/user/sso-providers', {
      method: 'DELETE',
      body: JSON.stringify({ provider, providerAccountId }),
    });
  }

  async makeUserOnboarded() {
    return this.request('api/user/onboarded', {
      method: 'POST',
    });
  }

  async updateAvatar(avatar: string) {
    return this.request('api/user/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatar }),
    });
  }

  async updatePreference(preference: any) {
    return this.request('api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preference),
    });
  }

  async updateGuide(guide: any) {
    return this.request('api/user/guide', {
      method: 'PUT',
      body: JSON.stringify(guide),
    });
  }

  async updateSettings(settings: any) {
    return this.request('api/user/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async resetSettings() {
    return this.request('api/user/settings', {
      method: 'DELETE',
    });
  }

  // ============================================
  // Agent Routes
  // ============================================

  async getAgentConfig(sessionId: string) {
    return this.request(`api/agents/config?sessionId=${sessionId}`);
  }

  // ============================================
  // Plugin Routes
  // ============================================

  async getPlugins() {
    return this.request('api/plugins');
  }

  async createOrInstallPlugin(plugin: any) {
    return this.request('api/plugins', {
      method: 'POST',
      body: JSON.stringify(plugin),
    });
  }

  async removePlugin(id: string) {
    return this.request(`api/plugins/${id}`, {
      method: 'DELETE',
    });
  }

  async createPlugin(plugin: any) {
    return this.request('api/plugins/custom', {
      method: 'POST',
      body: JSON.stringify(plugin),
    });
  }

  async updatePlugin(id: string, data: any) {
    return this.request(`api/plugins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeAllPlugins() {
    return this.request('api/plugins', {
      method: 'DELETE',
    });
  }

  // ============================================
  // Market Routes
  // ============================================

  async getPluginList(params?: { 
    category?: string; 
    locale?: string;
    page?: number;
    pageSize?: number;
    q?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const queryParams: Record<string, string> = {};
    if (params?.category) queryParams.category = params.category;
    if (params?.locale) queryParams.locale = params.locale;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.pageSize) queryParams.pageSize = params.pageSize.toString();
    if (params?.q) queryParams.q = params.q;
    if (params?.sort) queryParams.sort = params.sort;
    if (params?.order) queryParams.order = params.order;
    
    const query = Object.keys(queryParams).length > 0 
      ? '?' + new URLSearchParams(queryParams).toString() 
      : '';
    return this.request(`api/market${query}`);
  }

  // ============================================
  // Upload Routes
  // ============================================

  async createS3PreSignedUrl(pathname: string) {
    return this.request('api/upload/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ pathname }),
    });
  }

  // ============================================
  // Usage Routes
  // ============================================

  async findUsageByMonth(month: string) {
    return this.request(`api/usage/month?mo=${month}`);
  }

  async findUsageAndGroupByDay(month: string) {
    return this.request(`api/usage/day?mo=${month}`);
  }

  // ============================================
  // Thread Routes
  // ============================================

  async getThreads(topicId: string) {
    return this.request(`api/threads?topicId=${topicId}`);
  }

  async createThreadWithMessage(data: any) {
    return this.request('api/threads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateThread(id: string, data: any) {
    return this.request(`api/threads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeThread(id: string) {
    return this.request(`api/threads/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // File Routes
  // ============================================

  async removeFileAsyncTask(fileId: string) {
    return this.request(`api/files/${fileId}/async-task`, {
      method: 'DELETE',
    });
  }

  async getFileItemById(fileId: string) {
    return this.request(`api/files/${fileId}`);
  }

  async getFiles(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`api/files${query}`);
  }

  // ============================================
  // RAG Routes
  // ============================================

  async parseFileContent(fileId: string, skipExist?: boolean) {
    const query = skipExist ? '?skipExist=true' : '';
    return this.request(`api/rag/documents/${fileId}/parse${query}`, {
      method: 'POST',
    });
  }

  async createParseFileTask(fileId: string, skipExist?: boolean) {
    const query = skipExist ? '?skipExist=true' : '';
    return this.request(`api/rag/chunks/parse-task${query}`, {
      method: 'POST',
      body: JSON.stringify({ id: fileId }),
    });
  }

  async retryParseFileTask(fileId: string) {
    return this.request(`api/rag/chunks/parse-task/${fileId}/retry`, {
      method: 'POST',
    });
  }

  async createEmbeddingChunksTask(fileId: string) {
    return this.request(`api/rag/chunks/embedding-task`, {
      method: 'POST',
      body: JSON.stringify({ id: fileId }),
    });
  }

  async semanticSearch(fileIds: string[], query: string) {
    return this.request('api/rag/chunks/semantic-search', {
      method: 'POST',
      body: JSON.stringify({ fileIds, query }),
    });
  }

  async semanticSearchForChat(params: any) {
    return this.request('api/rag/chunks/semantic-search-chat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getChunksByFileId(fileId: string, params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`api/rag/chunks/file/${fileId}${query}`);
  }

  // RAG Eval Routes
  async createDataset(params: any) {
    return this.request('api/rag-eval/datasets', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getDatasets(knowledgeBaseId: string) {
    return this.request(`api/rag-eval/datasets?knowledgeBaseId=${knowledgeBaseId}`);
  }

  async removeDataset(id: string) {
    return this.request(`api/rag-eval/datasets/${id}`, {
      method: 'DELETE',
    });
  }

  async updateDataset(id: string, data: any) {
    return this.request(`api/rag-eval/datasets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getDatasetRecords(datasetId: string) {
    return this.request(`api/rag-eval/datasets/${datasetId}/records`);
  }

  async removeDatasetRecords(id: string) {
    return this.request(`api/rag-eval/datasets/records/${id}`, {
      method: 'DELETE',
    });
  }

  async importDatasetRecords(datasetId: string, pathname: string) {
    return this.request(`api/rag-eval/datasets/${datasetId}/import`, {
      method: 'POST',
      body: JSON.stringify({ pathname }),
    });
  }

  async createEvaluation(params: any) {
    return this.request('api/rag-eval/evaluations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getEvaluationList(knowledgeBaseId: string) {
    return this.request(`api/rag-eval/evaluations?knowledgeBaseId=${knowledgeBaseId}`);
  }

  async startEvaluationTask(id: string) {
    return this.request(`api/rag-eval/evaluations/${id}/start`, {
      method: 'POST',
    });
  }

  async removeEvaluation(id: string) {
    return this.request(`api/rag-eval/evaluations/${id}`, {
      method: 'DELETE',
    });
  }

  async checkEvaluationStatus(id: string) {
    return this.request(`api/rag-eval/evaluations/${id}/status`);
  }

  // ============================================
  // Image Generation Routes
  // ============================================

  async createImage(payload: any) {
    return this.request('api/images', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getGenerationStatus(generationId: string, asyncTaskId?: string) {
    const query = asyncTaskId ? `?asyncTaskId=${asyncTaskId}` : '';
    return this.request(`api/images/generations/${generationId}/status${query}`);
  }

  async deleteGeneration(generationId: string) {
    return this.request(`api/images/generations/${generationId}`, {
      method: 'DELETE',
    });
  }

  async getGenerationBatches(topicId: string) {
    return this.request(`api/images/batches?topicId=${topicId}`);
  }

  async deleteGenerationBatch(batchId: string) {
    return this.request(`api/images/batches/${batchId}`, {
      method: 'DELETE',
    });
  }

  async getAllGenerationTopics() {
    return this.request('api/images/topics');
  }

  async createGenerationTopic() {
    return this.request('api/images/topics', {
      method: 'POST',
    });
  }

  async updateGenerationTopic(id: string, data: any) {
    return this.request(`api/images/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateGenerationTopicCover(id: string, coverUrl: string) {
    return this.request(`api/images/topics/${id}/cover`, {
      method: 'PUT',
      body: JSON.stringify({ coverUrl }),
    });
  }

  async deleteGenerationTopic(id: string) {
    return this.request(`api/images/topics/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Import Routes
  // ============================================

  async importByPost(data: any) {
    return this.request('api/import/post', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async importPgByPost(data: any) {
    return this.request('api/import/pg', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async importByFile(pathname: string) {
    return this.request('api/import/file', {
      method: 'POST',
      body: JSON.stringify({ pathname }),
    });
  }

  // ============================================
  // Export Routes
  // ============================================

  async exportPdf(params: any) {
    return this.request('api/export/pdf', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============================================
  // Knowledge Base Routes
  // ============================================

  async getKnowledgeBases() {
    return this.request('api/knowledge-bases');
  }

  async createKnowledgeBase(data: any) {
    return this.request('api/knowledge-bases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateKnowledgeBase(id: string, data: any) {
    return this.request(`api/knowledge-bases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeKnowledgeBase(id: string) {
    return this.request(`api/knowledge-bases/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Config Routes
  // ============================================

  async getGlobalConfig() {
    return this.request('api/config/global');
  }

  async getDefaultAgentConfig() {
    return this.request('api/config/default-agent');
  }
}

// Export singleton instance
export const restApiService = new RestApiService();

