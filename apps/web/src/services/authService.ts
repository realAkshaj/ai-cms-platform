import { apiClient, tokenManager, ApiResponse } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export const authService = {
  // Register new user and organization
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    
    if (response.data.success && response.data.data) {
      const { user, accessToken } = response.data.data;
      tokenManager.setToken(accessToken);
      tokenManager.setUser(user);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Registration failed');
  },

  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    
    if (response.data.success && response.data.data) {
      const { user, accessToken } = response.data.data;
      tokenManager.setToken(accessToken);
      tokenManager.setUser(user);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenManager.removeToken();
    }
  },

  // Get current user from token
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me');
      
      if (response.data.success && response.data.data) {
        tokenManager.setUser(response.data.data);
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!tokenManager.getToken();
  },

  // Get user from localStorage
  getUser(): User | null {
    return tokenManager.getUser();
  },

  // Refresh token (if you implement refresh tokens)
  async refreshToken(): Promise<string | null> {
    try {
      const response = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
      
      if (response.data.success && response.data.data) {
        const { accessToken } = response.data.data;
        tokenManager.setToken(accessToken);
        return accessToken;
      }
      
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      tokenManager.removeToken();
      return null;
    }
  },

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>('/auth/profile', data);
    
    if (response.data.success && response.data.data) {
      tokenManager.setUser(response.data.data);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Profile update failed');
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.post<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Password change failed');
    }
  },

  // Verify email (if you implement email verification)
  async verifyEmail(token: string): Promise<void> {
    const response = await apiClient.post<ApiResponse>('/auth/verify-email', { token });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Email verification failed');
    }
  },

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    const response = await apiClient.post<ApiResponse>('/auth/forgot-password', { email });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Password reset request failed');
    }
  },

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await apiClient.post<ApiResponse>('/auth/reset-password', {
      token,
      newPassword
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Password reset failed');
    }
  }
};