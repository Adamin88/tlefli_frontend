import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

// Provide a default empty context value
const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  register: async () => ({ success: false }),
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshAuth: async () => {},
  googleAuth: async () => ({ success: false }),
  handleGoogleAuthCallback: async () => ({ success: false })
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use refs for better state tracking
  const initialized = useRef(false);
  const authCheckInProgress = useRef(false);
  const lastCheckTime = useRef(0);
  const checkCounter = useRef(0);
  const minCheckInterval = 5000; // Minimum 5 seconds between checks
  
  // Add tracking for forced refreshes
  const forcedRefreshCount = useRef(0);
  const lastForcedRefreshTime = useRef(0);
  const MAX_FORCED_REFRESHES = 3; // Maximum allowed in 60 seconds
  const FORCED_REFRESH_WINDOW = 60000; // 60 seconds
  
  // Determine if current route is a public route - add memoization
  const isPublicRoute = useCallback(() => {
    const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/pro'];
    return publicRoutes.includes(location.pathname);
  }, [location.pathname]);
  
  // Improve checkAuthStatus to handle auth failures better
  const checkAuthStatus = useCallback(async (force = false) => {
    // Skip if already in progress
    if (authCheckInProgress.current && !force) {
      console.log('Auth check already in progress, skipping');
      return;
    }
    
    // Don't check too frequently
    const now = Date.now();
    if (!force && (now - lastCheckTime.current < minCheckInterval)) {
      console.log('Auth check too frequent, skipping');
      return;
    }
    
    // Record check time
    lastCheckTime.current = now;
    
    // Track progress
    authCheckInProgress.current = true;
    
    try {
      console.log('Checking auth status...');
      
      // Use auth service to validate session
      const sessionValid = await authService.validateSession(force);
      console.log('Session validation result:', sessionValid);
      
      if (sessionValid) {
        // Get fresh user data
        const freshUser = authService.getStoredUser();
        if (freshUser) {
          setUser(freshUser);
        }
      } else if (!isPublicRoute()) {
        // Only clear user if not on public route - avoid clearing during page refresh
        if (force) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
      initialized.current = true;
      authCheckInProgress.current = false;
    }
  }, [isPublicRoute]);

  // Initialize auth state - simplify to prevent excessive checks
  useEffect(() => {
    if (!initialized.current) {
      console.log('Initializing authentication state');
      checkAuthStatus(false);
    }
    
    // Set up a reduced frequency check - only every 5 minutes
    const intervalId = setInterval(() => {
      if (user && !isPublicRoute()) {
        checkAuthStatus(false);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes instead of more frequently
    
    return () => clearInterval(intervalId);
  }, [checkAuthStatus, user, isPublicRoute]);

  // Improve first load auth detection
  useEffect(() => {
    // Run this only once on first component mount
    if (!initialized.current) {
      // Initial state check without forcing logout during refreshes
      const storedUser = authService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        console.log('Restored auth state from memory');
      }
      
      // Always verify with server regardless of stored state
      checkAuthStatus(false);
    }
  }, [checkAuthStatus]);

  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      console.log('AuthContext: Registering user with data:', userData);
      const response = await authService.register(userData);
      console.log('AuthContext: Registration response:', response);
      
      if (response.success) {
        setUser(authService.getStoredUser());
        return { success: true };
      }
      
      const errorMessage = response.error || 'Registration failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred during registration';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Enhanced login function with more detailed error handling
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('AuthContext: Attempting login with:', email);
      
      if (!email || !password) {
        setError('Email and password are required');
        setLoading(false);
        return { success: false, error: 'Email and password are required' };
      }
      
      const result = await authService.login(email, password);
      console.log('AuthContext: Login result:', result);
      
      if (result.success) {
        setUser(result.user);
        console.log('AuthContext: User set after login:', result.user);
        return { success: true };
      }
      
      // Handle specific error cases based on status codes
      if (result.status === 401) {
        setError('Invalid email or password');
        return { success: false, error: 'Invalid email or password' };
      } else if (result.status === 404) {
        setError('User not found');
        return { success: false, error: 'User not found' };
      } else {
        setError(result.error || 'Login failed');
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (err) {
      console.error('AuthContext: Unexpected login error:', err);
      setError('An unexpected error occurred');
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // Logout with improved cleanup
  const logout = async () => {
    console.log('AuthContext: Logging out user');
    try {
      // First clear local state
      setUser(null);
      
      // Then communicate with server
      await authService.logout();
      
      // Navigate after state is cleared
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure user data is cleared even if API fails
      setUser(null);
      authService.clearUserData();
      navigate('/login');
    }
  };

  // Provide proper refreshAuth implementation
  const refreshAuth = useCallback(async (silentFail = true) => {
    console.log('Manually refreshing auth state');
    
    // Only check if not already checking
    if (!authCheckInProgress.current) {
      try {
        authCheckInProgress.current = true;
        const result = await authService.validateSession(true);
        
        // If validation successful, update user data
        if (result) {
          const freshUser = authService.getStoredUser();
          if (freshUser) {
            console.log('Setting fresh user data from refresh:', freshUser);
            setUser(freshUser);
          }
          return true;
        } else if (!silentFail) {
          setUser(null);
        }
        return result;
      } catch (error) {
        console.error('Error refreshing auth:', error);
        return false;
      } finally {
        // Always release the lock
        authCheckInProgress.current = false;
      }
    } else {
      console.log('Auth refresh skipped - check already in progress');
      return false;
    }
  }, []);

  // Google Authentication
  const googleAuth = useCallback(async (userType = 'individual') => {
    setError(null);
    try {
      // This function will trigger the Google OAuth flow
      // The actual redirect will be handled by the backend
      console.log('AuthContext: Initiating Google authentication flow');
      
      // Redirect to Google auth endpoint
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      window.location.href = `${apiUrl}/auth/google?userType=${userType}`;
      
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Google auth error:', error);
      setError('Failed to start Google authentication');
      return {
        success: false,
        error: 'Failed to start Google authentication'
      };
    }
  }, []);

  // Handle Google Auth Callback
  const handleGoogleAuthCallback = useCallback(async (token) => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('AuthContext: Processing Google auth callback');
      
      if (!token) {
        setError('No authentication token received');
        return { success: false, error: 'No authentication token received' };
      }
      
      // Verify token with backend
      const result = await authService.verifyGoogleToken(token);
      
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        setError(result.error || 'Google authentication failed');
        return { 
          success: false, 
          error: result.error || 'Google authentication failed' 
        };
      }
    } catch (err) {
      console.error('AuthContext: Google callback error:', err);
      setError('Failed to complete Google authentication');
      return { 
        success: false, 
        error: 'Failed to complete Google authentication' 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a stable value object using Object.freeze to prevent unnecessary re-renders
  const value = Object.freeze({
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    refreshAuth,
    googleAuth,
    handleGoogleAuthCallback
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
