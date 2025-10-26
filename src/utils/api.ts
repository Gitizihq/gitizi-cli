import { createClient, SupabaseClient, FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
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
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE.URL, SUPABASE.ANON_KEY);
  }

  /**
   * Invokes a Supabase Edge Function with optional user token
   * The Supabase client automatically sends the Authorization header with the anon key.
   * User tokens are sent in the x-user-token header for the Edge Function to verify.
   */
  private async invokeFunction<T = any>(functionName: string, body?: any): Promise<T> {
    const userToken = getToken();

    const { data, error } = await this.supabase.functions.invoke(functionName, {
      body,
      headers: userToken ? {
        'x-user-token': userToken,
      } : undefined,
    });

    if (error) {
      // Add debug info for development
      if (process.env.DEBUG) {
        console.log('Supabase function error:', {
          function: functionName,
          error: error,
          context: (error as any).context,
        });
      }
      throw error;
    }

    return data as T;
  }

  /**
   * Formats error messages from API responses
   */
  private formatError(error: any, defaultMessage: string): string {
    if (error instanceof FunctionsHttpError) {
      const context = error.context as any;
      return context?.message || `${defaultMessage}: HTTP error`;
    }

    if (error instanceof FunctionsRelayError) {
      return `${defaultMessage}: Relay error`;
    }

    if (error instanceof FunctionsFetchError) {
      return 'Cannot connect to server. Please check your internet connection.';
    }

    if (error?.message) {
      return error.message;
    }

    return defaultMessage;
  }

  async authenticate(token: string): Promise<{ success: boolean; username: string }> {
    try {
      const result = await this.invokeFunction<{ success: boolean; username: string }>('api-auth-verify', { token });
      return result;
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Authentication failed'));
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
      throw new Error(this.formatError(error, 'Search failed'));
    }
  }

  async getPrompt(id: string): Promise<Prompt> {
    try {
      const result = await this.invokeFunction<Prompt>('api-get-prompt', { id });
      return result;
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Failed to fetch prompt'));
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
      throw new Error(this.formatError(error, 'Failed to create prompt'));
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
      throw new Error(this.formatError(error, 'Failed to update prompt'));
    }
  }

  async listUserPrompts(): Promise<Prompt[]> {
    try {
      const result = await this.invokeFunction<Prompt[]>('api-list-user-prompts');
      return result;
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Failed to list prompts'));
    }
  }

  async getCurrentUser(): Promise<{ username: string; email?: string }> {
    try {
      const result = await this.invokeFunction<{ username: string; email?: string }>('api-get-current-user');
      return result;
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Failed to get user info'));
    }
  }
}

export default new GitiziAPI();
