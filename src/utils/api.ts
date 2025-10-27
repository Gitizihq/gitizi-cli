import { getToken } from './config';
import { SUPABASE } from './constants';

export interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  prompts: Prompt[];
  total: number;
}

export interface ApiErrorResponse {
  message: string;
  code?: string;
  statusCode?: number;
}

class GitiziAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${SUPABASE.URL}/functions/v1`;
  }

  /**
   * Invokes a Supabase Edge Function with direct fetch
   * Sends user token in Authorization: Bearer header if authenticated
   * Otherwise uses anon key
   */
  private async invokeFunction<T = any>(functionName: string, body?: any): Promise<T> {
    const userToken = getToken();

    // Use user token if available, otherwise use anon key
    const authToken = userToken || SUPABASE.ANON_KEY;

    const response = await fetch(`${this.baseUrl}/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
    });

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json() as T;
  }

  /**
   * Formats error messages from API responses
   */
  private formatError(error: any, defaultMessage: string): string {
    if (error?.message) {
      return error.message;
    }

    return defaultMessage;
  }

  async authenticate(token: string): Promise<{ success: boolean; username: string }> {
    try {
      // For authentication, send the token being verified in Authorization header
      const response = await fetch(`${this.baseUrl}/api-auth-verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as { success: boolean; username: string };
    } catch (error: any) {
      const message = this.formatError(error, 'Authentication failed');
      throw new Error(message);
    }
  }

  async searchPrompts(query: string, limit: number = 10): Promise<SearchResult> {
    try {
      const result = await this.invokeFunction<SearchResult>('api-search-prompts', {
        query,
        limit,
      });
      return result;
    } catch (error: any) {
      const message = this.formatError(error, 'Search failed');
      throw new Error(message);
    }
  }

  async getPrompt(id: string): Promise<Prompt> {
    try {
      const result = await this.invokeFunction<Prompt>('api-get-prompt', { id });
      return result;
    } catch (error: any) {
      const message = this.formatError(error, 'Failed to fetch prompt');
      throw new Error(message);
    }
  }

  async createPrompt(data: {
    name: string;
    description: string;
    content: string;
    tags: string[];
  }): Promise<Prompt> {
    try {
      const result = await this.invokeFunction<Prompt>('api-create-prompt', data);
      return result;
    } catch (error: any) {
      const message = this.formatError(error, 'Failed to create prompt');
      throw new Error(message);
    }
  }

  async updatePrompt(
    id: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      tags?: string[];
    }
  ): Promise<Prompt> {
    try {
      const result = await this.invokeFunction<Prompt>('api-update-prompt', {
        id,
        ...data,
      });
      return result;
    } catch (error: any) {
      const message = this.formatError(error, 'Failed to update prompt');
      throw new Error(message);
    }
  }

  async listUserPrompts(): Promise<Prompt[]> {
    try {
      const result = await this.invokeFunction<Prompt[]>('api-list-user-prompts');
      return result;
    } catch (error: any) {
      const message = this.formatError(error, 'Failed to list prompts');
      throw new Error(message);
    }
  }

  async getCurrentUser(): Promise<{ username: string; email?: string }> {
    try {
      const result = await this.invokeFunction<{ username: string; email?: string }>('api-get-current-user');
      return result;
    } catch (error: any) {
      const message = this.formatError(error, 'Failed to get user info');
      throw new Error(message);
    }
  }
}

export default new GitiziAPI();
