import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:5000/api/business';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

class BusinessAnalyticsService {
  async getAnalyticsData(timeRange = 'week') {
    try {
      const response = await api.get(`/analytics`, {
        params: { timeRange }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch analytics data'
      };
    }
  }

  async generateReport(reportType, dateRange) {
    try {
      const response = await axios.post(`${API_URL}/reports/generate`, {
        reportType,
        dateRange
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error generating report:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to generate report'
      };
    }
  }

  async getPerformanceMetrics() {
    try {
      const response = await axios.get(`${API_URL}/metrics`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch performance metrics'
      };
    }
  }

  async getLocationAnalytics() {
    try {
      const response = await axios.get(`${API_URL}/analytics/locations`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching location analytics:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch location analytics'
      };
    }
  }

  async getCategoryDistribution() {
    try {
      const response = await axios.get(`${API_URL}/analytics/categories`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching category distribution:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch category distribution'
      };
    }
  }

  async getTimeAnalysis() {
    try {
      const response = await axios.get(`${API_URL}/analytics/time`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching time analysis:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch time analysis'
      };
    }
  }

  async exportReport(reportData, format = 'pdf') {
    try {
      const response = await axios.post(`${API_URL}/reports/export`, {
        reportData,
        format
      }, {
        responseType: 'blob'
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error exporting report:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to export report'
      };
    }
  }
}

export default new BusinessAnalyticsService();
