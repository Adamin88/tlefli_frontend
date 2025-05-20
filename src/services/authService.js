import axios from 'axios';

// Simplified API URL detection that only uses environment variables
const determineApiUrl = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    console.log('Using API URL from environment:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Simple fallback with warning
  console.warn('VITE_API_URL environment variable not found, using default /api path');
  return '/api';
};

// Get API URL using the improved detection function
const API_URL = determineApiUrl();
console.log('API URL configured as:', API_URL);

// In-memory state only - no localStorage
let currentUser = null;
let isValidatingSession = false;
let validationAttempts = 0;
let isInitialized = false;
const MAX_VALIDATION_ATTEMPTS = 2;
const EXCLUDED_PATHS = ['/login', '/register', '/forgot-password', '/', '/home', '/pro']; // Added '/pro'

// Add a global variable to track recent validation attempts
let lastValidationAttempt = 0;
const MIN_VALIDATION_INTERVAL = 2000; // 2 seconds between validation attempts
const AUTH_REDIRECT_DELAY = 1000; // 1 second delay before redirecting to login

const authService = {
  setUser(user) {
    if (!user) return;
    
    try {
      // Check if user is already a JSON string
      let userData = user;
      if (typeof user === 'string') {
        try {
          userData = JSON.parse(user);
        } catch (parseError) {
          console.error('User data is a string but not valid JSON:', parseError);
        }
      }
      
      // Normalize user data
      const normalizedUser = this.normalizeUser(userData);
      currentUser = normalizedUser;
      validationAttempts = 0; // Reset attempts when setting a user
      
      console.log('User data stored in memory:', normalizedUser);
    } catch (e) {
      console.error('Failed to store user data:', e);
    }
  },

  getStoredUser() {
    // Only return the in-memory user (no localStorage)
    return currentUser;
  },

  getUserId() {
    const user = this.getStoredUser();
    if (!user) {
      console.warn('getUserId called but no user is stored');
      return null;
    }
    
    // Support both id and _id formats
    const userId = user._id || user.id;
    
    if (!userId) {
      console.warn('User object exists but has no id property:', user);
    }
    
    return userId;
  },

  getUserType() {
    const user = this.getStoredUser();
    return user?.userType || null;
  },

  clearUserData() {
    console.log('Clearing user data from memory');
    currentUser = null;
    delete axios.defaults.headers.common['Authorization'];
  },

  isLoggedIn() {
    return !!this.getStoredUser();
  },

  isOnPublicPage() {
    const path = window.location.pathname;
    
    // Special fast path for landing page
    if (path === '/' || path === '') {
      console.log('Landing page detected, marking as public');
      return true;
    }
    
    return EXCLUDED_PATHS.some(excludedPath => 
      path === excludedPath || path.startsWith(excludedPath + '/')
    );
  },

  isOnAuthPage() {
    const path = window.location.pathname;
    return ['/login', '/register', '/forgot-password'].some(
      excludedPath => path.includes(excludedPath)
    );
  },

  // Get auth token from user data
  getToken() {
    const user = this.getStoredUser();
    
    if (!user) {
      // Only log once to prevent console spam
      if (!this._loggedNoUser) {
        console.log('getToken called but no user is stored');
        this._loggedNoUser = true;
        
        // Reset log flag after a delay
        setTimeout(() => {
          this._loggedNoUser = false;
        }, 5000);
      }
      return null;
    }
    
    // Reset log flag when we have a user
    this._loggedNoUser = false;
    
    const token = user.token || user.authToken || user.accessToken;
    
    if (!token && user) {
      console.warn('User exists but no token found');
    }
    
    return token;
  },

  // Check if user session is valid and restore user data from HTTP-only cookies
  async initializeAuth() {
    // Skip if already initialized or validating
    if (isInitialized || isValidatingSession) {
      return !!this.getStoredUser();
    }

    try {
      isValidatingSession = true;
      console.log('Initializing authentication state');
      console.log('Using API URL:', API_URL);
      
      // Check basic API connectivity first
      try {
        console.log('Testing API connectivity');
        const connectivityUrl = `${API_URL.replace('/api', '')}/`;
        console.log('Connectivity test URL:', connectivityUrl);
        await axios.get(connectivityUrl);
        console.log('API connectivity check passed');
      } catch (connectError) {
        console.error('API connectivity error:', connectError.message);
        console.error('Failed connecting to:', connectError.config?.url);
      }
      
      // Try to get diagnostic info first
      try {
        console.log('Fetching raw profile data');
        const debugResponse = await axios.get(`${API_URL}/debug/raw-profile`, {
          withCredentials: true
        });
        console.log('Debug profile data:', debugResponse.data);
      } catch (debugError) {
        console.warn('Debug endpoint error:', debugError.message);
      }
      
      // Now attempt to get the actual profile
      try {
        console.log('Requesting authenticated profile');
        const response = await axios.get(`${API_URL}/auth/profile`, {
          withCredentials: true
        });
        
        console.log('Profile request successful:', response.status);
        console.log('Raw profile data:', JSON.stringify(response.data, null, 2));
        
        if (response.data?.success && response.data?.data?.user) {
          // Ensure address field is correctly preserved from response
          const userData = response.data.data.user;
          console.log('Profile address field received:', userData.address);
          
          this.setUser(userData);
          isInitialized = true;
          return true;
        } else {
          console.warn('Profile endpoint returned invalid user data');
        }
      } catch (error) {
        // This is expected for unauthenticated users
        console.log('Authentication required - user not logged in');
      }
      
      // Clear user data if authentication failed
      this.clearUserData();
      return false;
    } finally {
      isValidatingSession = false;
    }
  },

  async validateSession(force = false) {
    // Prevent excessive validations during page refreshes
    const now = Date.now();
    if (!force && now - lastValidationAttempt < MIN_VALIDATION_INTERVAL) {
      console.log('Auth validation too frequent, skipping');
      return !!currentUser; // Return current state for rapid requests
    }
    
    lastValidationAttempt = now;
    
    // Prevent validation during loading periods
    if (isValidatingSession && !force) {
      return !!currentUser;
    }
    
    try {
      isValidatingSession = true;
      console.log('Validating session...');
      
      const user = this.getStoredUser();
      
      // If we already have a user in memory during page reload, assume valid 
      // while we check with the server (prevents flashing login page)
      if (user && !force) {
        console.log('User exists in memory, optimistically returning true');
      }
      
      try {
        const response = await axios({
          method: 'get',
          url: `${API_URL}/auth/profile`,
          withCredentials: true,
          timeout: 8000 // 8 second timeout - increased for better reliability
        });
        
        if (response.data && response.data.success) {
          // Ensure we preserve the profileCompleted flag properly
          const updatedUser = response.data.data.user;
          
          // Log the profileCompleted status to help with debugging
          console.log('Profile validation - profileCompleted status:', 
                      updatedUser.profileCompleted !== undefined ? updatedUser.profileCompleted : 'undefined');
          
          // Store the updated user data
          this.setUser(updatedUser);
          validationAttempts = 0;
          return true;
        }
        
        // Failed validation but not a 401/403
        if (force) {
          console.warn('Session validation failed: Invalid response');
          this.clearUserData();
          return false;
        }
        
        // For page refreshes, maintain current state if not forced
        return !!this.getStoredUser();
      } catch (error) {
        console.error('Session validation error:', error.message);
        
        // Network error but we have a user - maintain session
        if (error.message === 'Network Error') {
          console.log('Network error during validation, maintaining session');
          return !!this.getStoredUser();
        }
        
        // Auth errors - clear user data only if forced
        if (error.response && [401, 403].includes(error.response.status)) {
          if (force) {
            console.log('Auth error during validation, clearing user data');
            this.clearUserData();
            return false;
          } else {
            // For page refreshes, don't clear on first auth error
            console.log('Auth error during page refresh, maintaining current state');
            return !!this.getStoredUser();
          }
        }
        
        // Timeout or other error - maintain session
        return !!this.getStoredUser();
      }
    } finally {
      // Release lock after a delay to prevent rapid attempts
      setTimeout(() => {
        isValidatingSession = false;
      }, 500);
    }
  },

  async register(userData) {
    try {
      console.log('AuthService: Registering with data:', userData);
      const { email, password, userType, ...rest } = userData;
      const response = await axios.post(`${API_URL}/auth/register`, { 
        email, password, userType, ...rest 
      }, { withCredentials: true });
      console.log('AuthService: Registration response:', response.data);

      if (response.data.success && response.data.data.user) {
        this.setUser(response.data.data.user);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('AuthService: Registration error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  },

  async login(email, password) {
    try {
      console.log('AuthService: Attempting login for:', email);
      
      // Make direct request with full configuration
      const response = await axios({
        method: 'post',
        url: `${API_URL}/auth/login`,
        data: { email, password },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('AuthService: Raw login response:', response);
      
      if (response.data && response.data.success) {
        console.log('Login successful, storing user data');
        
        // Add token to user object if not present
        const userData = response.data.data.user;
        if (!userData.token && response.headers['authorization']) {
          userData.token = response.headers['authorization'].replace('Bearer ', '');
        }
        
        // Store user in memory only
        this.setUser(userData);
        
        validationAttempts = 0;
        isInitialized = true;
        
        return { 
          success: true, 
          data: response.data.data,
          user: userData
        };
      }
      
      // If we got a response but success is false
      return { 
        success: false, 
        error: response.data.message || 'Identifiants invalides',
        rawResponse: response.data,
        status: response.data.status || 401
      };
    } catch (error) {
      console.error('AuthService: Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // More detailed error responses based on status codes
      let errorMsg = 'Échec de connexion';
      
      if (error.response) {
        const status = error.response.status;
        
        if (status === 401) {
          errorMsg = 'Email ou mot de passe incorrect';
        } else if (status === 404) {
          errorMsg = 'Aucun compte associé à cet email';
        } else if (status === 403) {
          errorMsg = 'Compte verrouillé. Trop de tentatives échouées.';
        } else if (status === 429) {
          errorMsg = 'Trop de tentatives. Veuillez réessayer plus tard.';
        } else if (status >= 500) {
          errorMsg = 'Problème de serveur. Veuillez réessayer plus tard.';
        }
      }
      
      return {
        success: false,
        error: error.response?.data?.message || errorMsg,
        status: error.response?.status,
        rawError: error.message
      };
    }
  },

  async logout(silent = false) {
    try {
      // First clear local state to prevent UI issues
      this.clearUserData();
      
      if (!silent) {
        try {
          await axios.post(`${API_URL}/auth/logout`, {}, { 
            withCredentials: true,
            // Prevent 401 error from triggering redirect
            validateStatus: (status) => status < 500
          });
          console.log('Logout API call successful');
        } catch (apiError) {
          console.warn('Logout API call failed, but proceeding with local logout', apiError);
        }
      }
    } catch (error) {
      if (!silent) {
        console.error('AuthService: Logout error:', error);
      }
    } finally {
      // Ensure user data is cleared regardless of API success
      this.clearUserData();
      isInitialized = false;
    }
  },

  async updateUser(userData) {
    try {
      console.log('AuthService: Updating user with data:', JSON.stringify(userData, null, 2));
      
      // Make sure token is available
      const user = this.getStoredUser();
      const token = this.getToken();
      
      // Debug the stored user address
      if (user && user.userType === 'individual') {
        console.log('Stored individual user address:', user.address);
      }
      
      if (!token && !user) {
        console.error('No auth credentials available for profile update');
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      // Create a clean data object with all fields explicitly included
      const cleanData = {
        ...userData,
        userId: user?.id || user?._id,
      };
      
      // For individual users, make sure address is included
      if (user?.userType === 'individual') {
        // Force address field to be included even if empty
        cleanData.address = userData.address !== undefined ? userData.address : (user.address || '');
        console.log('Including address in update for individual user:', cleanData.address);
        
        // Set business fields to null for individual users
        cleanData.businessName = null;
        cleanData.businessType = null;
        cleanData.businessAddress = null;
      }
      
      // For business users, make sure phone is null
      if (user?.userType === 'business') {
        cleanData.phone = null;
        
        // Convert empty business fields to null
        if (cleanData.businessName === '') cleanData.businessName = null;
        if (cleanData.businessType === '') cleanData.businessType = null;
        if (cleanData.businessAddress === '') cleanData.businessAddress = null;
      }
      
      // Fix the endpoint URL to ensure it's correct
      const updateUrl = `${API_URL}/auth/profile`;  // This should match the backend route
      
      // Make request with token in multiple places to ensure it's sent
      const response = await axios({
        method: 'put',
        url: updateUrl,
        data: cleanData,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined
        }
      });
      
      console.log('AuthService: Update response:', response.data);

      if (response.data && response.data.success) {
        // Check both places where the token might be
        const newToken = response.data.token || 
                        (response.data.data && response.data.data.token);
        
        // Always update the user data in memory
        const updatedUser = {
          ...user,
          ...response.data.data,
          token: newToken || token // Keep existing token if no new one
        };
        
        // Persist the updated user
        this.setUser(updatedUser);
        
        return { 
          success: true, 
          data: response.data.data
        };
      }
      
      return { 
        success: false, 
        error: response.data?.message || 'Failed to update profile',
        response: response.data
      };
    } catch (error) {
      console.error('AuthService: Update error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update profile',
        status: error.response?.status,
        rawError: error.message
      };
    }
  },

  setupAxiosInterceptors() {
    // Configure axios defaults
    axios.defaults.baseURL = API_URL;
    axios.defaults.withCredentials = true;  // Essential for cookie-based auth
    
    // Reset axios headers to ensure clean state
    delete axios.defaults.headers.common['Authorization'];
    
    // Add request interceptor for auth token
    axios.interceptors.request.use(
      (config) => {
        // Always ensure credentials are sent
        config.withCredentials = true;
        
        // Only add Authorization header if we have a token
        const token = this.getToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
          // For debugging, log the first part of the token on auth requests
          if (config.url.includes('/auth/')) {
            console.log(`Auth request to ${config.url} with token: ${token.substring(0, 15)}...`);
          }
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor for auth errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle auth errors on non-public pages
        if (error.response?.status === 401 && !this.isOnPublicPage()) {
          // Check if we're not already on the login page
          if (!window.location.pathname.includes('/login')) {
            console.log('Auth error detected, redirecting to login');
            
            // Clear user data
            this.clearUserData();
            
            // Delayed redirect to prevent excessive redirects during multiple API calls
            const currentPath = window.location.pathname + window.location.search;
            
            // Add a cache buster to prevent browser caching the redirect
            const redirectUrl = `/login?redirect=${encodeURIComponent(currentPath)}&t=${Date.now()}`;
            
            // Use timeout to prevent immediate redirect during page loads with multiple API calls
            setTimeout(() => {
              // Only redirect if we're still on the same page
              if (window.location.pathname === currentPath.split('?')[0]) {
                window.location.href = redirectUrl;
              }
            }, AUTH_REDIRECT_DELAY);
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Initialize authentication on page load
    const isLandingPage = window.location.pathname === '/' || window.location.pathname === '';
    if (!isLandingPage) {
      this.initializeAuth().then(isAuthenticated => {
        console.log('Auth initialized, user authenticated:', isAuthenticated);
      });
    } else {
      console.log('Skipping auth initialization on landing page');
    }
  },

  // Change password - DEPRECATED with Google-only auth
  async changePassword(data) {
    console.warn('Password change is not available with Google authentication');
    return {
      success: false,
      message: 'Password change is not available with Google authentication. Please manage your Google account password instead.'
    };
  },

  // Add this method to fetch the user profile directly
  async getUserProfile() {
    try {
      const response = await axios.get('/api/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Updated method to store user without localStorage
  storeUser(user) {
    if (!user) return;
    
    // Only store user in memory
    currentUser = this.normalizeUser(user);
    console.log('User data stored in memory:', currentUser);
  },

  // Remove method that depends on localStorage
  initFromLocalStorage() {
    // This method is now a no-op since we don't use localStorage
    console.log('initFromLocalStorage called, but localStorage is disabled');
    return false;
  },

  // Add a helper to normalize user object structure
  normalizeUser(user) {
    if (!user) return null;
    
    // Create a normalized copy with both id formats
    const normalizedUser = { ...user };
    
    // Ensure both id formats are available
    if (normalizedUser.id && !normalizedUser._id) {
      normalizedUser._id = normalizedUser.id;
    } else if (normalizedUser._id && !normalizedUser.id) {
      normalizedUser.id = normalizedUser._id;
    }
    
    // Ensure address field exists for individual users
    if (normalizedUser.userType === 'individual' && normalizedUser.address === undefined) {
      normalizedUser.address = '';
      console.log('Address field was missing, initialized to empty string');
    }
    
    // Make sure profileCompleted is a boolean
    if (normalizedUser.profileCompleted === 'true') {
      normalizedUser.profileCompleted = true;
    } else if (normalizedUser.profileCompleted === 'false') {
      normalizedUser.profileCompleted = false;
    } else if (normalizedUser.profileCompleted === undefined) {
      // Assume incomplete if undefined
      normalizedUser.profileCompleted = false;
    }
    
    return normalizedUser;
  },

  // Verify Google token (after Google OAuth callback)
  verifyGoogleToken: async (token) => {
    try {
      console.log('Verifying Google token with API URL:', API_URL);
      const response = await axios.post(`${API_URL}/auth/google/verify`, { token });
      const { user, token: authToken } = response.data;
      
      if (user && authToken) {
        authService.storeUser(user, authToken);
      }
      
      return {
        success: true,
        user,
        token: authToken
      };
    } catch (error) {
      console.error('Google token verification failed:', error.message);
      console.error('Request URL was:', `${API_URL}/auth/google/verify`);
      return {
        success: false,
        error: error.response?.data?.message || 'Google authentication failed'
      };
    }
  },
};

authService.setupAxiosInterceptors();

export default authService;
