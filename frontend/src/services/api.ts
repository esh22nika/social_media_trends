// src/services/api.ts
const API_BASE_URL = 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  limit?: number;
  offset?: number;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Fetch trends
  async fetchTrends(limit: number = 20, offset: number = 0, platform?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (platform && platform !== 'all') {
      params.append('platform', platform);
    }

    return this.request(`/trends?${params.toString()}`);
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(
    userId: string,
    interests: string[],
    limit: number = 20
  ) {
    return this.request('/recommendations', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        interests,
        limit,
      }),
    });
  }

  // Get trending topics
  async getTrendingTopics(limit: number = 20, days: number = 7) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      days: days.toString(),
    });

    return this.request(`/trending-topics?${params.toString()}`);
  }

  // Get association rules
  async getAssociationRules(limit: number = 50, minLift: number = 1.0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      min_lift: minLift.toString(),
    });

    return this.request(`/association-rules?${params.toString()}`);
  }

  // Get sequential patterns
  async getSequentialPatterns(limit: number = 50) {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    return this.request(`/sequential-patterns?${params.toString()}`);
  }

  // Get overall statistics
  async getTrendStats() {
    return this.request('/stats');
  }

  // Search trends
  async searchTrends(query: string, limit: number = 20) {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    return this.request(`/search?${params.toString()}`);
  }

  // Get trend lifecycle
  async getTrendLifecycle(keyword: string) {
    return this.request(`/trend-lifecycle/${encodeURIComponent(keyword)}`);
  }

  // Get similar items
  async getSimilarItems(itemId: string, limit: number = 10) {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    return this.request(`/similar/${encodeURIComponent(itemId)}?${params.toString()}`);
  }

  // Get platform statistics
  async getPlatformStats(platform: string) {
    return this.request(`/platform-stats/${platform}`);
  }
}

export const apiService = new ApiService();
export default apiService;