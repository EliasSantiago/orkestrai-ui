/**
 * Custom Message Service
 * Handles message operations with the custom backend API
 */

import { customAuthService } from '../customAuth';

export interface ChatRequest {
  message: string;
  agent_id: number;
  session_id?: string | null;
  model?: string | null;
}

export interface ChatResponse {
  response: string;
  agent_id: number;
  agent_name: string;
  session_id: string | null;
  model_used: string | null;
}

export interface MessageMetadata {
  [key: string]: any;
}

export class CustomMessageService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Check both client-side and server-side env vars
    const envUrl =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL
        : process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL;

    // During build time (SSG/SSR), allow empty baseUrl
    if (!baseUrl && !envUrl) {
      if (typeof window === 'undefined') {
        this.baseUrl = 'http://placeholder-for-build.local';
        console.warn('⚠️  CustomMessageService: NEXT_PUBLIC_CUSTOM_API_BASE_URL not set during build. Using placeholder.');
        return;
      }

      throw new Error(
        'NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured! Please set it in your .env file.',
      );
    }

    this.baseUrl = baseUrl || envUrl!;
  }

  /**
   * Validate that baseUrl is properly configured (not a placeholder)
   */
  private validateBaseUrl(): void {
    if (this.baseUrl === 'http://placeholder-for-build.local') {
      throw new Error(
        'NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured! Please set it in your .env file.'
      );
    }
  }

  /**
   * Build full URL for an endpoint.
   * Base URL is the root (e.g., http://localhost:8001), so endpoints should include /api prefix.
   * @example buildUrl('api/agents/chat') -> 'http://localhost:8001/api/agents/chat'
   */
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
  private async request<T>(
    endpoint: string,
    options: globalThis.RequestInit = {},
  ): Promise<T> {
    this.validateBaseUrl();
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

  /**
   * Send a chat message to an agent
   * This is the main method for chatting with agents
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('api/agents/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Add a message to a session manually
   * This is useful for storing messages without getting a response
   */
  async addMessage(
    sessionId: string,
    content: string,
    metadata?: MessageMetadata,
  ): Promise<void> {
    return this.request<void>(`api/conversations/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        metadata,
      }),
    });
  }

  /**
   * Get messages for a specific session
   */
  async getMessages(sessionId: string, limit?: number): Promise<any> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`api/conversations/sessions/${sessionId}${params}`);
  }
}

// Export singleton instance
export const customMessageService = new CustomMessageService();

