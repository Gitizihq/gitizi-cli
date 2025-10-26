import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { getToken, getApiUrl } from './config';
import { LIMITS } from './constants';

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
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: getApiUrl(),
      timeout: LIMITS.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries: LIMITS.RETRY_ATTEMPTS,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // Retry on network errors or 5xx status codes
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status !== undefined && error.response.status >= 500)
        );
      },
    });

    // Add auth token to requests if available
    this.client.interceptors.request.use((config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Formats error messages from API responses
   */
  private formatError(error: any, defaultMessage: string): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message;

      if (status === 429) {
        return 'Rate limit exceeded. Please try again later.';
      }

      if (status && message) {
        return `${defaultMessage} (${status}): ${message}`;
      }

      if (message) {
        return message;
      }

      if (axiosError.code === 'ECONNABORTED') {
        return 'Request timeout. Please check your connection and try again.';
      }

      if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
        return 'Cannot connect to server. Please check your internet connection.';
      }
    }

    return error.message || defaultMessage;
  }

  async authenticate(token: string): Promise<{ success: boolean; username: string }> {
    try {
      const response = await this.client.post('/auth/verify', { token });
      return {
        success: true,
        username: response.data.username,
      };
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Authentication failed'));
    }
  }

  async searchPrompts(query: string, limit: number = 10): Promise<SearchResult> {
    try {
      const response = await this.client.post('/api-search-prompts', {
        query,
        limit,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Search failed'));
    }
  }

  async getPrompt(id: string): Promise<Prompt> {
    try {
      const response = await this.client.post('/api-get-prompt', {
        id,
      });
      return response.data;
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
      const response = await this.client.post('/api-create-prompt', data);
      return response.data;
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
      const response = await this.client.put(`/prompts/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Failed to update prompt'));
    }
  }

  async listUserPrompts(): Promise<Prompt[]> {
    try {
      const response = await this.client.get('/prompts/me');
      return response.data;
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Failed to list prompts'));
    }
  }

  async getCurrentUser(): Promise<{ username: string; email?: string }> {
    try {
      const response = await this.client.get('/auth/me');
      return response.data;
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Failed to get user info'));
    }
  }
}

export default new GitiziAPI();
