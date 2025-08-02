import axios from 'axios';
import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const NOTIFICATIONS_URL = `${API_URL}/notifications`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true  // Important for sending cookies with requests
});

class ItemsService {
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

  // Update getAllItems to better handle user filtering
  async getAllItems(filters = {}) {
    try {
      console.log('ItemsService: Fetching items with filters:', filters);
      
      // If no userId is explicitly provided but a user is logged in,
      // automatically include the current user's ID regardless of user type
      const currentUser = authService.getStoredUser();
      if (!filters.userId && currentUser) {
        filters.userId = currentUser._id || currentUser.id;
        console.log('ItemsService: Auto-adding user ID filter for user:', filters.userId);
      }
      
      // Add a timestamp to prevent caching issues
      filters._t = Date.now();
      
      const response = await api.get('/items', {
        params: filters,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('ItemsService: Raw response:', response);
      
      // Handle different response formats
      let data = [];
      if (response.data && response.data.success) {
        data = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }
      
      console.log('ItemsService: Processed items:', data.length);
      
      return {
        success: true,
        data: data,
        totalItems: response.data.totalItems || data.length,
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1
      };
    } catch (error) {
      console.error('ItemsService: Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch items',
        data: [] // Return empty array to avoid undefined errors in components
      };
    }
  }

  // New method: Get items by user ID
  async getItemsByUserId(userId) {
    try {
      if (!userId) {
        console.error('ItemsService: getItemsByUserId called without userId');
        return {
          success: false,
          error: 'User ID is required'
        };
      }
      
      console.log('ItemsService: Fetching items for user:', userId);
      const response = await api.get('/items', {
        params: { userId: userId }
      });
      
      // Check if response.data is an array or has a data property
      const items = Array.isArray(response.data) ? response.data : response.data.data;
      
      return {
        success: true,
        data: items
      };
    } catch (error) {
      console.error('ItemsService: Error fetching items by user ID:', {
        userId,
        error: error.response?.data || error.message
      });
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch user items'
      };
    }
  }

  // Update getCurrentUserItems to handle various ID formats and errors better
  async getCurrentUserItems(filters = {}) {
    const userId = authService.getUserId();
    
    if (!userId) {
      console.warn('ItemsService: getCurrentUserItems called but no user is logged in');
      return {
        success: true, // Changed to true to avoid UI errors
        data: [], // Return empty array instead of error
        error: 'User is not authenticated'
      };
    }
    
    // Clone filters and add userId - ensure it's properly sent
    const userFilters = { 
      ...filters, 
      userId // Explicitly include in URL params
    };
    
    try {
      console.log('ItemsService: Fetching current user items with filters:', userFilters);
      
      // Add timestamp to prevent caching
      userFilters._t = Date.now();
      
      // Add error handling and retries for the API request
      let response;
      try {
        // First try with the main approach - user endpoint
        response = await api.get('/items/user', {
          params: userFilters,
          headers: {
            'X-User-ID': userId, // Set explicitly as header
            'Cache-Control': 'no-cache'
          }
        });
      } catch (initialError) {
        console.warn('First attempt failed, retrying with fallback approach:', initialError.message);
        
        // If that fails, try the generic items endpoint with userId
        response = await api.get('/items', {
          params: {
            ...filters,
            userId: userId,
            _t: Date.now()
          }
        });
      }
      
      // Handle different response formats
      let items = [];
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        items = response.data.data;
      } else if (Array.isArray(response.data)) {
        items = response.data;
      }
      
      console.log(`ItemsService: Processed ${items.length} items for user:`, userId);
      
      return {
        success: true,
        data: items,
        count: items.length,
        totalItems: response.data.totalItems || items.length,
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1
      };
    } catch (error) {
      console.error('ItemsService: Error fetching current user items:', error);
      // Return empty array instead of error to avoid UI breaking
      return {
        success: true,
        data: [],
        error: error.response?.data?.message || 'Failed to fetch your items',
        errorDetails: error.message
      };
    }
  }

  async getItemById(id) {
    try {
      console.log('ItemsService: Fetching item:', id);
      const response = await api.get(`/items/${id}`, {
        populate: {
          path: 'secretAnswers',
          select: 'answer submittedAt verified isCorrect user',
          populate: {
            path: 'user',
            select: 'firstName lastName _id'
          }
        }
      });

      console.log('ItemsService: Raw response:', response.data);
      
      const item = response.data.data || response.data;
      
      if (!item) {
        throw new Error('Item not found');
      }
      
      // Debug log for twin status
      console.log('Twin status:', {
        isTwinned: item.twin?.isTwinned || false,
        twinItemId: item.twin?.item?._id || null,
        status: item.status
      });
      
      // Debug log for secret answers
      if (item.secretAnswers) {
        console.log('Secret Answers:', {
          total: item.secretAnswers.length,
          answers: item.secretAnswers.map(a => ({
            id: a._id,
            userId: a.user?._id,
            answer: a.answer,
            verified: a.verified,
            isCorrect: a.isCorrect,
            submittedAt: a.submittedAt
          }))
        });
      }
      
      return {
        success: true,
        data: item
      };
    } catch (error) {
      console.error('ItemsService: Item error:', error.response || error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch item'
      };
    }
  }

  async deleteItem(itemId) {
    try {
      console.log('ItemsService: Deleting item:', itemId);
      const response = await api.delete(`/items/${itemId}`);
      console.log('ItemsService: Delete response:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('ItemsService: Delete error:', error.response || error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete item'
      };
    }
  }

  async createItem(itemData) {
    try {
      console.log('ItemsService: Creating item with data:', JSON.stringify(itemData, null, 2));
      
      // Check if user is authenticated
      const token = authService.getToken();
      if (!token) {
        console.error('ItemsService: No auth token available');
        return {
          success: false,
          error: 'Authentication required'
        };
      }
      
      // Ensure user ID is included
      const userId = authService.getUserId();
      if (userId && !itemData.reportedBy) {
        console.log('ItemsService: Adding missing user ID to request');
        itemData.reportedBy = userId;
      }
      
      // Make request with explicit headers
      const response = await api.post('/items', itemData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('ItemsService: Create response:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('ItemsService: Create error details:', {
        data: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        validationErrors: error.response?.data?.errors || error.response?.data?.message
      });
      
      // Return more detailed error information
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create item',
        validationErrors: error.response?.data?.errors,
        details: error.response?.data
      };
    }
  }

  async updateItem(itemId, itemData) {
    try {
      console.log('ItemsService: Updating item:', itemId);
      console.log('ItemsService: Update data:', JSON.stringify(itemData, null, 2));
      
      const response = await api.put(`/items/${itemId}`, itemData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('ItemsService: Update response:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('ItemsService: Update error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update item'
      };
    }
  }

  async updateItemStatus(itemId, newStatus) {
    try {
      console.log('ItemsService: Updating item status:', { itemId, newStatus });
      
      // Make sure we have a valid item ID and status
      if (!itemId) {
        console.error('ItemsService: Missing itemId for status update');
        return {
          success: false,
          error: 'Item ID is required for status update'
        };
      }
      
      if (!newStatus) {
        console.error('ItemsService: Missing newStatus for status update');
        return {
          success: false,
          error: 'New status is required'
        };
      }
      
      // Ensure we have authentication
      const token = authService.getToken();
      if (!token) {
        console.error('ItemsService: No auth token available for status update');
        return {
          success: false,
          error: 'Authentication required'
        };
      }
      
      // Make the API call with proper headers
      const response = await api.put(`/items/${itemId}/status`, 
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('ItemsService: Status update response:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('ItemsService: Status update error:', error.response || error);
      
      // Enhanced error handling with more context
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update item status',
        statusCode: error.response?.status,
        details: error.response?.data
      };
    }
  }

  async findMatches(itemId, options = {}) {
    try {
      console.log('ItemsService: Finding matches for item:', itemId);
      
      const response = await api.get(`/items/matches/${itemId}`);
      console.log('ItemsService: Raw matches response:', response.data);
      
      // Ensure we return an array with the correct data structure
      let matches = [];
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        matches = response.data.data;
      } else if (Array.isArray(response.data)) {
        matches = response.data;
      }
      
      // Process each match to ensure consistent data structure
      matches = await Promise.all(matches.map(async match => {
        return await this.refreshUserData(match);
      }));
      
      return {
        success: true,
        data: matches
      };
    } catch (error) {
      console.error('ItemsService: Find matches error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to find matches',
        data: [] // Return empty array to prevent undefined errors
      };
    }
  }

  async submitSecretAnswer(itemId, answer, isNewAttempt = false) {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentification requise. Veuillez vous reconnecter.');
      }

      // Updated to use the new endpoint
      const response = await api.post(
        `/items/${itemId}/secret-answers`,
        { answer: answer.trim() },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error submitting secret answer:', error);
      throw error;
    }
  }

  async verifySecretAnswer(itemId, answerId, isCorrect) {
    try {
      console.log('Verifying secret answer:', {
        itemId,
        answerId,
        isCorrect: Boolean(isCorrect)
      });

      // Get auth token
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required to verify answers');
      }

      // Make API call with proper headers
      const response = await api.post(
        `/items/${itemId}/secret-answers/${answerId}/verify`,
        { isCorrect: Boolean(isCorrect) },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Verify secret answer response:', response.data);

      return {
        success: true,
        data: {
          foundItem: response.data.data.foundItem,
          lostItem: response.data.data.lostItem,
          newStatus: response.data.data.newStatus,
          // Explicitly include untwinned and statusReset flags
          untwinned: response.data.data.untwinned || !isCorrect,
          statusReset: response.data.data.statusReset || !isCorrect
        },
        message: 'Secret answer verified successfully'
      };
    } catch (error) {
      console.error('Error verifying secret answer:', error);
      
      // Return a standardized error object with more context
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to verify secret answer',
        status: error.response?.status || 500
      };
    }
  }

  async getNotifications() {
    try {
      console.log('Fetching notifications');
      const response = await api.get('/notifications');
      console.log('Notifications response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      console.log('Marking notification as read:', notificationId);
      const response = await api.put(`/notifications/${notificationId}/read`);
      console.log('Mark as read response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead() {
    try {
      console.log('Marking all notifications as read');
      const response = await api.put('/notifications/read-all');
      console.log('Mark all as read response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async twinItems(itemId, twinId, twinState = true) {
    try {
      if (!itemId) {
        throw new Error('Item ID is required');
      }
      
      // If no twinId is provided, assume we want to twin with the source item
      // This is for the special case when calling this method from the FoundItemMatchCard
      if (!twinId && twinState) {
        console.error('Twin ID is required for twinning items');
        return {
          success: false,
          error: 'Both item IDs are required for twinning'
        };
      }
      
      console.log(`${twinState ? 'Twinning' : 'Untwinning'} items:`, {
        itemId,
        twinId,
        twinState
      });

      const response = await api.put(`/items/${itemId}/twin`, {
        twinId: twinId || null,
        twinState
      });
      
      console.log('ItemsService: Twin/untwin response:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('ItemsService: Twin error:', error.response || error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to twin items'
      };
    }
  }

  async untwinItems(itemId) {
    try {
      const response = await api.put(`/items/${itemId}/twin`, {
        twinState: false
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('ItemsService: Untwin error:', error.response || error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to untwin items'
      };
    }
  }

  async getTimerInfo(itemId) {
    try {
      console.log('ItemsService: Getting timer info for item:', itemId);
      const response = await api.get(`/items/${itemId}/timer`);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('ItemsService: Timer info error:', error.response || error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get timer info'
      };
    }
  }

  async createNotification(notificationData) {
    try {
      console.log('Creating notification:', notificationData);
      
      // Use axios directly with full URL since the notification endpoint is different
      const response = await axios.post(NOTIFICATIONS_URL, notificationData, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`
        }
      });
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'Failed to create notification'
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      // For now, return success true to prevent blocking the twin operation
      return {
        success: true,
        error: 'Notification creation failed but twin operation succeeded'
      };
    }
  }

  /**
   * A simplified check for existing answers, using locally available data
   * @param {Object} item - Item object with secretAnswers array
   * @param {String} userId - Current user ID
   * @returns {Object} Status info about any existing answer
   */
  checkAnswersLocally(item, userId) {
    if (!item?.secretAnswers?.length || !userId) {
      console.log(`checkAnswersLocally: No answers or userId provided (answers: ${item?.secretAnswers?.length || 0}, userId: ${Boolean(userId)})`);
      return { exists: false, status: 'none', canSubmitAnswer: true };
    }
    
    // Debug logging
    console.log('DETAILED ANSWER CHECK:', {
      itemId: item._id,
      answersCount: item.secretAnswers.length,
      userId: userId,
      userIdType: typeof userId
    });
    
    // Convert userId to string for consistent comparison
    const currentIdStr = String(userId);
    
    // Log detailed info about each answer
    item.secretAnswers.forEach((answer, index) => {
      console.log(`Answer #${index + 1}:`, {
        id: answer._id,
        user: answer.user, // Raw user field
        userId: answer.userId, // Alternative ID field
        userIdFromObject: answer.user?._id,
        userIdFromObjectType: typeof answer.user?._id,
        userIdStr: answer.user?._id ? String(answer.user._id) : 'N/A',
        answerStart: answer.answer?.substring(0, 20) + '...',
        verified: answer.verified,
        isCorrect: answer.isCorrect
      });
    });
    
    // Enhanced user answers filter with comprehensive ID comparison
    const userAnswers = item.secretAnswers.filter(answer => {
      // Try ALL possible formats of user ID in the answer
      const answerUserId = answer.user?._id ? String(answer.user._id) : // Object form with _id
                         answer.user ? String(answer.user) :          // Direct ID as string/ObjectId 
                         answer.userId ? String(answer.userId) :      // Alternative field
                         null;                                        // No user ID found
      
      // Log each comparison for debugging
      const isMatch = answerUserId === currentIdStr;
      console.log(`Comparing user IDs: "${answerUserId}" vs "${currentIdStr}" = ${isMatch}`);
      
      return isMatch;
    });
    
    if (userAnswers.length === 0) {
      console.log(`No answers found for user ${userId} in item ${item._id}`);
      return { exists: false, status: 'none', canSubmitAnswer: true };
    }
    
    console.log(`Found ${userAnswers.length} answers for user ${userId} in item ${item._id}`);
    
    // Find pending (unverified) answers first (high priority)
    const pendingAnswer = userAnswers.find(a => a.verified !== true);
    if (pendingAnswer) {
      console.log(`Found pending answer: ${pendingAnswer._id}`);
      return {
        exists: true,
        status: 'pending', 
        message: 'Réponse en attente de vérification',
        submittedAt: pendingAnswer.submittedAt || pendingAnswer.createdAt,
        answer: pendingAnswer,
        canSubmitAnswer: false // Don't allow new submissions if an answer is pending
      };
    }
    
    // Find latest verified answer
    const verifiedAnswers = userAnswers.filter(a => a.verified === true);
    if (verifiedAnswers.length) {
      // Sort by date, newest first
      verifiedAnswers.sort((a, b) => 
        new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)
      );
      
      const latest = verifiedAnswers[0];
      const status = latest.isCorrect ? 'correct' : 'incorrect';
      console.log(`Found verified answer: ${latest._id}, status: ${status}`);
      
      return {
        exists: true,
        status,
        message: status === 'correct' ? 'Réponse correcte' : 'Réponse incorrecte',
        submittedAt: latest.submittedAt || latest.createdAt,
        answer: latest,
        canSubmitAnswer: !latest.isCorrect // Only allow submission if previous answer was incorrect
      };
    }
    
    return { exists: false, status: 'none', canSubmitAnswer: true };
  }

  // Create a helper method to make it easier to determine if the form should be shown
  canSubmitAnswerForItem(item, userId) {
    const answerCheck = this.checkAnswersLocally(item, userId);
    return answerCheck.canSubmitAnswer;
  }

  // Enhanced method to refresh user data in matches while preserving twin relationships
  async refreshUserData(match) {
    if (!match) return match;
    
    try {
      // Make a defensive copy of the match to avoid mutations
      const processedMatch = { ...match };
      
      // Process the item safely without deep cloning
      if (processedMatch.item) {
        // Ensure basic item structure exists
        if (!processedMatch.item._id) {
          console.error('Item is missing _id property:', processedMatch.item);
          return match; // Return original if missing critical data
        }
        
        // Process reportedBy field - always preserve the ID
        if (processedMatch.item.reportedBy) {
          const reporterIdRaw = processedMatch.item.reportedBy._id || processedMatch.item.reportedBy;
          const reporterId = reporterIdRaw ? String(reporterIdRaw) : null;
          
          if (reporterId) {
            // Keep existing name if available
            const firstName = processedMatch.item.reportedBy.firstName || '';
            const lastName = processedMatch.item.reportedBy.lastName || '';
            
            processedMatch.item.reportedBy = {
              _id: reporterId,
              firstName,
              lastName
            };
          }
        }
        
        // Process twin data if it exists
        if (processedMatch.item.twin) {
          // Make sure basic twin structure exists
          processedMatch.item.twin = processedMatch.item.twin || {};
          processedMatch.item.twin.isTwinned = !!processedMatch.item.twin.isTwinned;
          
          // Preserve initiator ID
          if (processedMatch.item.twin.initiatedBy) {
            processedMatch.item.twin.initiatedBy = String(processedMatch.item.twin.initiatedBy);
          }
          
          // Ensure twin item reference exists if twinned
          if (processedMatch.item.twin.isTwinned && !processedMatch.item.twin.item) {
            processedMatch.item.twin.item = { _id: null };
          }
        }
        
        // Process secretAnswers carefully - this often causes issues
        if (Array.isArray(processedMatch.item.secretAnswers)) {
          processedMatch.item.secretAnswers = processedMatch.item.secretAnswers.map(answer => {
            // Create basic answer structure
            const processedAnswer = { ...answer };
            
            // Process user data
            if (answer.user) {
              const userId = answer.user._id || answer.user;
              if (userId) {
                processedAnswer.user = {
                  _id: String(userId),
                  firstName: answer.user.firstName || '',
                  lastName: answer.user.lastName || ''
                };
              }
            }
            
            return processedAnswer;
          });
        }
      }
      
      // Process sourceItem in the same way if it exists
      if (processedMatch.sourceItem) {
        // Apply same processing as for item
        if (processedMatch.sourceItem.reportedBy) {
          const reporterId = processedMatch.sourceItem.reportedBy._id || processedMatch.sourceItem.reportedBy;
          if (reporterId) {
            processedMatch.sourceItem.reportedBy = {
              _id: String(reporterId),
              firstName: processedMatch.sourceItem.reportedBy.firstName || '',
              lastName: processedMatch.sourceItem.reportedBy.lastName || ''
            };
          }
        }
      }
      
      return processedMatch;
    } catch (error) {
      console.error('Error refreshing user data in match:', error);
      // Return original match if any error occurs
      return match;
    }
  }

  async deleteSecretAnswer(itemId, answerId) {
    try {
      console.log('Deleting secret answer:', {
        itemId,
        answerId
      });

      // Get auth token
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required to delete answer');
      }

      // Make API call with proper headers
      const response = await api.delete(
        `/items/${itemId}/secret-answers/${answerId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Delete secret answer response:', response.data);

      return {
        success: true,
        data: response.data,
        message: 'Réponse supprimée avec succès'
      };
    } catch (error) {
      console.error('Error deleting secret answer:', error);
      
      // Return a standardized error object with more context
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete answer',
        status: error.response?.status || 500
      };
    }
  }

  async deleteAllUserAnswers(itemId, userId) {
    try {
      if (!itemId || !userId) {
        throw new Error('Item ID and user ID are required to delete answers');
      }
      
      console.log('Deleting all answers for user:', {
        itemId,
        userId
      });

      // Get auth token
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required to delete answers');
      }

      // Make API call with proper headers
      const response = await api.delete(
        `/items/${itemId}/secret-answers/user/${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Delete all user answers response:', response.data);

      return {
        success: true,
        data: response.data,
        message: 'Toutes les réponses ont été supprimées avec succès'
      };
    } catch (error) {
      console.error('Error deleting all user answers:', error);
      
      // Return a standardized error object with more context
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete answers',
        status: error.response?.status || 500
      };
    }
  }

  // Get payment status for an item
  async getItemPaymentStatus(itemId) {
    try {
      const response = await api.get(`/payments/items/${itemId}/payment-status`);
      return response.data;
    } catch (error) {
      console.error('Error getting item payment status:', error);
      throw error;
    }
  }

  // Create a payment for an item
  async createItemPayment(itemId, data) {
    try {
      console.log(`Creating payment for item ${itemId} with data:`, data);
      
      if (!itemId) {
        throw new Error('Item ID is required');
      }
      
      // Get auth token
      const token = authService.getToken();
      if (!token) {
        console.error('No auth token available for payment creation');
        throw new Error('Authentication required');
      }
      
      // Ensure payment endpoints are correctly formed
      const endpoint = `/payments/items/${itemId}/payments`;
      console.log('Payment endpoint:', endpoint);
      
      const response = await api.post(endpoint, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Payment creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating item payment:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Return a better formatted error that includes success: false
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create payment',
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Capture a payment after approval
  async capturePayment(orderId) {
    try {
      const response = await api.post(`/payments/capture/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error capturing payment:', error);
      throw error;
    }
  }

  // Mark an item as returning (after payment)
  async markItemReturning(itemId) {
    try {
      const response = await api.put(`/items/${itemId}/returning`);
      return response.data;
    } catch (error) {
      console.error('Error marking item as returning:', error);
      throw error;
    }
  }
}

// Delete an item
const deleteItem = async (itemId) => {
  try {
    const response = await api.delete(`/items/${itemId}`);
    return {
      success: true,
      message: response.data.message || 'Item deleted successfully'
    };
  } catch (error) {
    console.error('Error in deleteItem service:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete item',
      error: error.response?.data?.error || error.message
    };
  }
};

// Get payment status for an item
const getItemPaymentStatus = async (itemId) => {
  try {
    console.log(`Fetching payment status for item ${itemId}`);
    const response = await api.get(`/payments/items/${itemId}/payment-status`);
    return {
      success: true,
      paymentStatus: response.data.paymentStatus
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch payment status'
    };
  }
};

// Create a payment for an item
const createItemPayment = async (itemId, data) => {
  try {
    console.log(`Creating payment for item ${itemId} with data:`, data);
    
    if (!itemId) {
      throw new Error('Item ID is required');
    }
    
    // Make sure the URL is properly constructed
    const url = `/payments/items/${itemId}/payments`;
    
    // Get auth token
    const token = authService.getToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('Creating payment without authentication token');
    }
    
    console.log('Making payment request to:', url);
    console.log('With headers:', { ...headers, Authorization: token ? 'Bearer [REDACTED]' : undefined });
    
    const response = await api.post(url, data, { headers });
    
    console.log('Payment creation response:', response.data);
    return {
      success: true,
      payment: response.data.payment
    };
  } catch (error) {
    console.error('Error creating item payment:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      // If there's a specific error message from the server, use it
      const serverMessage = error.response.data?.message || error.response.data?.error;
      if (serverMessage) {
        return {
          success: false,
          message: serverMessage,
          error: error.message,
          status: error.response.status
        };
      }
    }
    
    return {
      success: false,
      message: 'Erreur lors de la création du paiement. Veuillez réessayer.',
      error: error.message
    };
  }
};

// Capture a payment after approval
const capturePayment = async (orderId) => {
  try {
    console.log(`Capturing payment with orderId: ${orderId}`);
    
    const token = authService.getToken();
    const response = await api.post(`/payments/capture/${orderId}`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : undefined
      }
    });
    
    console.log('Payment capture response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error capturing payment:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to capture payment'
    };
  }
};

// Mark an item as returning (after payment)
const markItemReturning = async (itemId) => {
  try {
    console.log(`Marking item ${itemId} as returning`);
    const response = await api.put(`/items/${itemId}/returning`);
    return response.data;
  } catch (error) {
    console.error('Error marking item as returning:', error);
    throw error;
  }
};

export default new ItemsService();
export {
  deleteItem,
  getItemPaymentStatus,
  createItemPayment,
  capturePayment,
  markItemReturning
};
