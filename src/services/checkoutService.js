/**
 * Checkout.com Payment Service
 * Handles frontend payment operations using Checkout.com Web Components
 */
import axios from 'axios';
import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true  // Important for sending cookies with requests
});

// Add request interceptor to include auth header
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      hasAuth: !!config.headers.Authorization,
      baseURL: config.baseURL
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

// Create a payment session with Checkout.com Flow
export const createItemPayment = async (itemId, paymentData) => {
  try {
    console.log('Creating Checkout.com payment session for item:', itemId);
    console.log('Payment data:', paymentData);
    
    const requestBody = {
      amount: paymentData.amount,
      currency: paymentData.currency
    };
    
    // Include delivery option if provided
    if (paymentData.deliveryOption !== undefined) {
      requestBody.deliveryOption = paymentData.deliveryOption;
    }
    
    // Only add URLs if they exist (backwards compatibility)
    if (paymentData.successUrl) {
      requestBody.successUrl = paymentData.successUrl;
    }
    if (paymentData.failureUrl) {
      requestBody.failureUrl = paymentData.failureUrl;
    }
    
    console.log('Request body:', requestBody);
    
    const response = await api.post(`/payments/items/${itemId}/payment-sessions`, requestBody);
    
    console.log('Payment session creation response:', response.data);
    
    if (response.data.success) {
      return {
        success: true,
        paymentSession: response.data.paymentSession
      };
    } else {
      throw new Error(response.data?.message || 'Failed to create payment session');
    }
  } catch (error) {
    console.error('Error creating payment session:', error);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || 'Payment session creation failed';
      const errorCode = error.response.status;
      
      throw new Error(`${errorMessage} (${errorCode})`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error(error.message || 'Payment session creation failed');
    }
  }
};

// Verify a payment after completion
export const verifyItemPayment = async (paymentId) => {
  try {
    console.log('=== PAYMENT VERIFICATION START ===');
    console.log('Verifying payment:', paymentId);
    console.log('API Base URL:', API_URL);
    console.log('Request URL:', `/payments/verify/${paymentId}`);
    
    const response = await api.post(`/payments/verify/${paymentId}`);
    
    console.log('Payment verification response status:', response.status);
    console.log('Payment verification response:', response.data);
    console.log('=== PAYMENT VERIFICATION END ===');
    
    if (response.data.success) {
      return {
        success: true,
        payment: response.data.payment,
        item: response.data.item
      };
    } else {
      throw new Error(response.data.message || 'Payment verification failed');
    }
  } catch (error) {
    console.error('=== PAYMENT VERIFICATION ERROR ===');
    console.error('Error verifying payment:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error config:', error.config);
    console.error('=== END ERROR ===');
    
    if (error.response) {
      const errorMessage = error.response.data?.message || 'Payment verification failed';
      throw new Error(errorMessage);
    } else {
      throw new Error('Network error during payment verification');
    }
  }
};

// Get payment status for an item
export const getItemPaymentStatus = async (itemId) => {
  try {
    console.log('Getting payment status for item:', itemId);
    
    const response = await api.get(`/payments/items/${itemId}/payment-status`);
    
    console.log('Payment status response:', response.data);
    
    if (response.data.success) {
      return {
        success: true,
        paymentStatus: response.data.paymentStatus
      };
    } else {
      throw new Error(response.data.message || 'Failed to get payment status');
    }
  } catch (error) {
    console.error('Error getting payment status:', error);
    
    if (error.response) {
      const errorMessage = error.response.data?.message || 'Failed to get payment status';
      throw new Error(errorMessage);
    } else {
      throw new Error('Network error getting payment status');
    }
  }
};

// Get Checkout.com public key
export const getCheckoutPublicKey = () => {
  const publicKey = import.meta.env.VITE_CHECKOUT_PUBLIC_KEY;
  
  if (!publicKey) {
    console.warn('Checkout.com public key not found in environment variables');
    return null;
  }
  
  return publicKey;
};

// Utility function to format amount for display
export const formatPaymentAmount = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Utility function to validate payment data
export const validatePaymentData = (paymentData) => {
  const errors = [];
  
  if (!paymentData.amount || paymentData.amount <= 0) {
    errors.push('Valid amount is required');
  }
  
  if (!paymentData.currency) {
    errors.push('Currency is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  createItemPayment,
  verifyItemPayment,
  getItemPaymentStatus,
  getCheckoutPublicKey,
  formatPaymentAmount,
  validatePaymentData
};
