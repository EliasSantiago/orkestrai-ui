/**
 * Custom Session Service
 * Handles session/conversation management with the custom backend API
 */

import { customAuthService } from '../customAuth';

export interface SessionMessage {
  role: string;
  content: string;
  timestamp?: string | null;
  metadata?: Record<string, any> | null;
}

export interface ConversationHistory {
  session_id: string;
  messages: SessionMessage[];
}

export interface SessionInfo {
  session_id: string;
  message_count: number;
  last_activity: string | null;
  ttl: number | null;
}

export interface MessageCreate {
  content: string;
  metadata?: Record<string, any> | null;
}

export class CustomSessionService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    const envUrl =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL
        : undefined;

    if (!baseUrl && !envUrl) {
      throw new Error(
        'NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured! Please set it in your .env file.',
      );
    }

    this.baseUrl = baseUrl || envUrl!;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
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

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
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

  /**
   * Get all session IDs for the current user
   */
  async getSessions(): Promise<string[]> {
    return this.request<string[]>('/api/conversations/sessions');
  }

  /**
   * Get conversation history for a specific session
   */
  async getSessionHistory(sessionId: string, limit?: number): Promise<ConversationHistory> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<ConversationHistory>(
      `/api/conversations/sessions/${sessionId}${params}`,
    );
  }

  /**
   * Get session information
   */
  async getSessionInfo(sessionId: string): Promise<SessionInfo> {
    return this.request<SessionInfo>(`/api/conversations/sessions/${sessionId}/info`);
  }

  /**
   * Delete a specific session
   */
  async deleteSession(sessionId: string): Promise<void> {
    return this.request<void>(`/api/conversations/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Delete all sessions for the current user
   */
  async deleteAllSessions(): Promise<void> {
    return this.request<void>('/api/conversations/sessions', {
      method: 'DELETE',
    });
  }

  /**
   * Add a message to a session
   */
  async addMessage(sessionId: string, message: MessageCreate): Promise<void> {
    return this.request<void>(`/api/conversations/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  /**
   * Associate a session with the current user (usually done automatically)
   */
  async associateSession(sessionId: string): Promise<void> {
    return this.request<void>(`/api/adk/sessions/${sessionId}/associate`, {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const customSessionService = new CustomSessionService();

