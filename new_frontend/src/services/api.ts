// API Service Layer for Flask Backend Integration
// TypeScript interfaces and functions for communicating with the Flask API

// Base API configuration
const API_BASE_URL = '/api';

// TypeScript interfaces matching Flask API responses
export interface TrendData {
  id: string;
  topic: string;
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  trend: 'rising' | 'falling' | 'stable';
  relevanceScore: number;
  tags: string[];
  url: string;
  author: string;
  created_at: string;
}

export interface DashboardData {
  kpis: {
    trendsTracked: number;
    activeTopics: number;
    updatesToday: number;
    relevanceScore: number;
  };
  recommendations: TrendData[];
  trending: TrendData[];
  userInterests: Record<string, number>;
  currentInterests: string[];
}

export interface PatternMiningData {
  kpis: {
    rules: number;
    itemsets: number;
    patterns: number;
  };
  association_rules: Array<{
    antecedent: string[];
    consequent: string[];
    lift: number;
    platforms?: string[];
  }>;
  frequent_itemsets: Array<{
    items: string[];
    support: number;
  }>;
  sequential_patterns: Array<{
    sequence: string[];
    support: number;
    count: number;
    avg_duration: string;
  }>;
}

export interface TrendAnalysisData {
  kpis: {
    activeTrends: number;
    peakThisWeek: number;
    emergingTrends: number;
    declining: number;
  };
  timeline: Array<Record<string, any>>;
}

export interface TopicExplorerData {
  feed: TrendData[];
  relatedTopics: Record<string, number>;
  topContributors: Record<string, number>;
}

export interface NetworkData {
  nodes: Array<{
    id: string;
    size: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight: number;
  }>;
}

export interface InterestsData {
  currentUserInterests: string[];
  availableTopics: string[];
}

// API functions
export const fetchDashboardData = async (): Promise<DashboardData> => {
  const response = await fetch(`${API_BASE_URL}/dashboard`);
  if (!response.ok) {
    throw new Error(`Dashboard API error: ${response.status}`);
  }
  const data = await response.json();
  return data.data;
};

export const fetchPatternMiningData = async (): Promise<PatternMiningData> => {
  const response = await fetch(`${API_BASE_URL}/pattern-mining`);
  if (!response.ok) {
    throw new Error(`Pattern Mining API error: ${response.status}`);
  }
  const data = await response.json();
  return data.data;
};

export const fetchTrendAnalysis = async (): Promise<TrendAnalysisData> => {
  const response = await fetch(`${API_BASE_URL}/trend-analysis`);
  if (!response.ok) {
    throw new Error(`Trend Analysis API error: ${response.status}`);
  }
  const data = await response.json();
  return data.data;
};

export const fetchTopicExplorer = async (query: string): Promise<TopicExplorerData> => {
  const response = await fetch(`${API_BASE_URL}/explore?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`Topic Explorer API error: ${response.status}`);
  }
  const data = await response.json();
  return data.data;
};

export const fetchNetworkGraph = async (
  platform?: string,
  start?: string,
  end?: string
): Promise<NetworkData> => {
  const params = new URLSearchParams();
  if (platform) params.append('platform', platform);
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  
  const response = await fetch(`${API_BASE_URL}/network?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Network Graph API error: ${response.status}`);
  }
  const data = await response.json();
  return data.data;
};

export const getUserInterests = async (): Promise<InterestsData> => {
  const response = await fetch(`${API_BASE_URL}/interests`);
  if (!response.ok) {
    throw new Error(`Get Interests API error: ${response.status}`);
  }
  const data = await response.json();
  return data.data;
};

export const updateUserInterests = async (interests: string[]): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/interests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ interests }),
  });
  if (!response.ok) {
    throw new Error(`Update Interests API error: ${response.status}`);
  }
};

// Utility function to check API health
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
};

// Platform colors and icons mapping
export const PLATFORM_CONFIG = {
  reddit: {
    color: '#FF4500',
    name: 'Reddit',
    icon: '🔴'
  },
  youtube: {
    color: '#FF0000', 
    name: 'YouTube',
    icon: '📺'
  },
  bluesky: {
    color: '#0085ff',
    name: 'Bluesky',
    icon: '🦋'
  }
} as const;

export type Platform = keyof typeof PLATFORM_CONFIG;
