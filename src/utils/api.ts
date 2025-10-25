import axios, { AxiosInstance } from 'axios';
import { getToken, getApiUrl } from './config';

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

class GitiziAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: getApiUrl(),
      headers: {
        'Content-Type': 'application/json',
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

  async authenticate(token: string): Promise<{ success: boolean; username: string }> {
    try {
      const response = await this.client.post('/auth/verify', { token });
      return {
        success: true,
        username: response.data.username,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Authentication failed');
    }
  }

  async searchPrompts(query: string, limit: number = 10): Promise<SearchResult> {
    try {
      const response = await this.client.get('/prompts/search', {
        params: { q: query, limit },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Search failed');
    }
  }

  async getPrompt(id: string): Promise<Prompt> {
    try {
      const response = await this.client.get(`/prompts/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch prompt');
    }
  }

  async createPrompt(data: {
    name: string;
    description: string;
    content: string;
    tags: string[];
  }): Promise<Prompt> {
    try {
      const response = await this.client.post('/prompts', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create prompt');
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
      throw new Error(error.response?.data?.message || 'Failed to update prompt');
    }
  }
}

export default new GitiziAPI();
