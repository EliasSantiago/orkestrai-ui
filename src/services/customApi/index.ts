/**
 * Custom API Service
 * Handles API requests to the custom backend API with Bearer token authentication
 */

import { LobeAgentConfig } from '@/types/agent';
import { LobeAgentSession } from '@/types/session';

import { customAuthService } from '../customAuth';

export interface AgentResponse {
  id: number;
  name: string;
  description: string | null;
  instruction: string;
  model: string;
  tools: string[];
  use_file_search: boolean;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface AgentCreate {
  name: string;
  description?: string | null;
  instruction: string;
  model?: string;
  tools?: string[] | null;
  use_file_search?: boolean | null;
}

export interface AgentUpdate {
  name?: string | null;
  description?: string | null;
  instruction?: string | null;
  model?: string | null;
  tools?: string[] | null;
  use_file_search?: boolean | null;
}

/**
 * Map LobeChat Agent to Backend Agent format
 */
export function mapLobeAgentToBackend(session: LobeAgentSession): AgentCreate {
  const config = session.config;
  const meta = session.meta;

  return {
    name: meta.title || 'Untitled Agent',
    description: meta.description || null,
    instruction: config.systemRole || '',
    model: config.model || 'gpt-4o-mini',
    tools: config.plugins || [],
    use_file_search: (config.knowledgeBases?.length ?? 0) > 0,
  };
}

/**
 * Map Backend Agent to LobeChat format (partial)
 * This returns only the config and meta fields that can be updated
 */
export function mapBackendAgentToLobe(backendAgent: AgentResponse): {
  config: Partial<LobeAgentConfig>;
  meta: { title?: string; description?: string };
  backendAgentId: number;
} {
  return {
    backendAgentId: backendAgent.id,
    config: {
      model: backendAgent.model,
      plugins: backendAgent.tools,
      systemRole: backendAgent.instruction,
    },
    meta: {
      description: backendAgent.description || undefined,
      title: backendAgent.name,
    },
  };
}

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

export class CustomApiService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    const envUrl =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL
        : undefined;
    
    if (!baseUrl && !envUrl) {
      throw new Error(
        'NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured! Please set it in your .env file.'
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
        // Token is invalid, clear it
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
   * Get all agents (alias for getAgents)
   */
  async listAgents(): Promise<AgentResponse[]> {
    return this.getAgents();
  }

  /**
   * Get all agents
   */
  async getAgents(): Promise<AgentResponse[]> {
    return this.request<AgentResponse[]>('/api/agents');
  }

  /**
   * Map LobeChat Agent to Backend Agent format
   */
  mapLobeAgentToBackend(session: LobeAgentSession): AgentCreate {
    return mapLobeAgentToBackend(session);
  }

  /**
   * Map Backend Agent to LobeChat format
   */
  mapBackendAgentToLobe(backendAgent: AgentResponse) {
    return mapBackendAgentToLobe(backendAgent);
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId: number): Promise<AgentResponse> {
    return this.request<AgentResponse>(`/api/agents/${agentId}`);
  }

  /**
   * Create a new agent
   */
  async createAgent(agent: AgentCreate): Promise<AgentResponse> {
    return this.request<AgentResponse>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  /**
   * Update an agent
   */
  async updateAgent(agentId: number, agent: AgentUpdate): Promise<AgentResponse> {
    return this.request<AgentResponse>(`/api/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(agent),
    });
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: number): Promise<void> {
    return this.request<void>(`/api/agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Chat with an agent
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/agents/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get user sessions
   */
  async getSessions(): Promise<string[]> {
    return this.request<string[]>('/api/conversations/sessions');
  }

  /**
   * Get session history
   */
  async getSessionHistory(sessionId: string, limit?: number): Promise<any> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/api/conversations/sessions/${sessionId}${params}`);
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    return this.request<void>(`/api/conversations/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Delete all sessions
   */
  async deleteAllSessions(): Promise<void> {
    return this.request<void>('/api/conversations/sessions', {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const customApiService = new CustomApiService();

