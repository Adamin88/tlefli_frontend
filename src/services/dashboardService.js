import axios from 'axios';
import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

class DashboardService {
  constructor() {
    // Add response interceptor to handle errors
    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          authService.clearUserData();
        }
        return Promise.reject(error);
      }
    );
  }

  async getStats(userType) {
    try {
      console.log('DashboardService: Fetching stats for user type:', userType);
      const userId = authService.getUserId();
      
      try {
        const response = await api.get('/dashboard/stats', {
          params: { 
            userType,
            userId 
          }
        });
        
        return {
          success: true,
          data: response.data.data || response.data
        };
      } catch (apiError) {
        console.warn('Dashboard API endpoint not available, using fallback data');
        
        // Provide fallback data when the endpoint doesn't exist
        return {
          success: true,
          data: {
            totalLost: 0,
            totalFound: 0,
            totalReturned: 0,
            activeUsers: 0,
            // Add some dummy data for development
            itemsByStatus: {
              posted: 0,
              authenticating: 0,
              authenticated: 0,
              returning: 0,
              returned: 0
            }
          }
        };
      }
    } catch (error) {
      console.error('DashboardService: Stats error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch dashboard statistics'
      };
    }
  }

  async getRecentItems(userType) {
    try {
      console.log('DashboardService: Fetching recent items for user type:', userType);
      const userId = authService.getUserId();
      
      // Different approach based on user type
      const params = { limit: 10, sort: '-createdAt' };
      
      // Individual users should only see their own items
      if (userType === 'individual') {
        params.userId = userId;
      }
      
      const response = await api.get('/items', { params });
      
      const items = Array.isArray(response.data) ? response.data : 
                    response.data.data || [];
      
      return {
        success: true,
        data: items
      };
    } catch (error) {
      console.error('DashboardService: Recent items error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch recent items'
      };
    }
  }
}

export default new DashboardService();
