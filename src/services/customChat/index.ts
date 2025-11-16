/**
 * Custom Chat Service
 * Handles chat interactions with the custom backend
 */

import { customApiService } from '../customApi';

export interface CustomChatRequest {
  agentId: number;
  content: string;
  sessionId?: string;
}

export interface CustomChatResponse {
  content: string;
  sessionId: string | null;
}

class CustomChatService {
  /**
   * Send a message to the custom backend and get a response
   */
  async sendMessage(request: CustomChatRequest): Promise<CustomChatResponse> {
    const response = await customApiService.chat({
      agent_id: request.agentId,
      message: request.content,
      session_id: request.sessionId || null,
    });

    return {
      content: response.response,
      sessionId: response.session_id || null,
    };
  }
}

export const customChatService = new CustomChatService();


