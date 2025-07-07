import { apiClient } from './api';

export interface Content {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;  // Changed from 'body' to 'content'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  type: 'POST' | 'PAGE' | 'ARTICLE' | 'NEWSLETTER';
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  views: number;
  likes: number;
  shares: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ContentFilters {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContentListResponse {
  content: Content[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContentStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  recentContent: Content[];
}

export interface CreateContentData {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;  // Changed from 'body' to 'content'
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  type?: 'POST' | 'PAGE' | 'ARTICLE' | 'NEWSLETTER';
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
}

export const contentService = {
  // Get content list with filters and pagination
  async getContent(filters: ContentFilters = {}): Promise<ContentListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/content?${params}`);
    return response.data.data;
  },

  // Get single content item
  async getContentById(id: string): Promise<Content> {
    const response = await apiClient.get(`/content/${id}`);
    return response.data.data;
  },

  // Create new content
  async createContent(data: CreateContentData): Promise<Content> {
    const response = await apiClient.post('/content', data);
    return response.data.data;
  },

  // Update content
  async updateContent(id: string, data: Partial<CreateContentData>): Promise<Content> {
    const response = await apiClient.put(`/content/${id}`, data);
    return response.data.data;
  },

  // Delete content
  async deleteContent(id: string): Promise<void> {
    await apiClient.delete(`/content/${id}`);
  },

  // Publish content
  async publishContent(id: string): Promise<Content> {
    const response = await apiClient.post(`/content/${id}/publish`);
    return response.data.data;
  },

  // Unpublish content
  async unpublishContent(id: string): Promise<Content> {
    const response = await apiClient.post(`/content/${id}/unpublish`);
    return response.data.data;
  },

  // Get content statistics
  async getContentStats(): Promise<ContentStats> {
    const response = await apiClient.get('/content/analytics/stats');
    return response.data.data;
  },

  // Helper functions for display
  getStatusColor(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'text-green-600 bg-green-100';
      case 'DRAFT':
        return 'text-yellow-600 bg-yellow-100';
      case 'ARCHIVED':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },

  getTypeColor(type: string): string {
    switch (type) {
      case 'POST':
      case 'BLOG_POST':
        return 'text-blue-600 bg-blue-100';
      case 'PAGE':
        return 'text-purple-600 bg-purple-100';
      case 'ARTICLE':
        return 'text-indigo-600 bg-indigo-100';
      case 'NEWSLETTER':
      case 'CUSTOM':
        return 'text-pink-600 bg-pink-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  truncateText(text: string, length: number = 150): string {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  },

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
};