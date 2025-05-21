import React, { useState, useEffect, useCallback } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import itemsService from '../services/itemsService';
import FoundItemMatchCard from './FoundItemMatchCard';
import LostItemMatchCard from './LostItemMatchCard';
import { useAuth } from '../contexts/AuthContext';

const MatchesList = ({ 
  itemId, 
  isTwinned,
  twinnedItemId: propsTwinnedItemId,
  onMatchedItemStatusUpdate, 
  onTwinItems,
  onVerificationComplete 
}) => {
  const { user: currentUser, loading: authLoading } = useAuth(); // Get loading state from auth context
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [localTwinnedItemId, setLocalTwinnedItemId] = useState(propsTwinnedItemId);
  
  // Add missing state variables
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [twinnedItemIds, setTwinnedItemIds] = useState([]);

  // Set auth ready state when auth loading changes
  useEffect(() => {
    if (!authLoading && currentUser) {
      setAuthReady(true);
      setUserId(currentUser._id);
      
      // Instead of localStorage, we'll maintain twinned items in memory
      // or fetch them from the server when needed
      setTwinnedItemIds([]);
      
      // Fetch any twinned items from the server if needed
      const fetchTwinnedItems = async () => {
        try {
          // You would implement this API endpoint on your backend
          // const response = await itemsService.getTwinnedItems();
          // if (response.success) {
          //   setTwinnedItemIds(response.data);
          // }
        } catch (error) {
          console.error('Error fetching twinned items:', error);
        }
      };
      
      // fetchTwinnedItems();
    }
  }, [authLoading, currentUser]);

  // Update local twin state when props change
  useEffect(() => {
    setLocalTwinnedItemId(propsTwinnedItemId);
  }, [propsTwinnedItemId]);

  // Function to update match twin status locally
  const updateMatchTwinStatus = useCallback((matchId, isTwinned, twinData = null) => {
    setMatches(prevMatches => {
      const updatedMatches = prevMatches.map(match => {
        if (match.item._id === matchId) {
          return {
            ...match,
            item: {
              ...match.item,
              twin: {
                ...match.item.twin,
                isTwinned,
                ...(twinData ? { item: twinData } : {})
              }
            }
          };
        }
        return match;
      });

      // If an item is twinned, filter to show only that item
      return isTwinned ? updatedMatches.filter(match => match.item._id === matchId) : updatedMatches;
    });
  }, []);

  // Replace localStorage helpers with in-memory state
  const addToTwinnedItems = useCallback((uid, itemId) => {
    if (!uid || !itemId) return false;
    
    setTwinnedItemIds(prev => {
      if (!prev.includes(itemId)) {
        return [...prev, itemId];
      }
      return prev;
    });
    
    return true;
  }, []);

  const removeFromTwinnedItems = useCallback((uid, itemIds) => {
    if (!uid || !itemIds) return false;
    
    const idsToRemove = Array.isArray(itemIds) ? itemIds : [itemIds];
    
    setTwinnedItemIds(prev => 
      prev.filter(id => !idsToRemove.includes(id))
    );
    
    return true;
  }, []);

  // Add a flag to prevent update loops
  const [isUpdatingStorage, setIsUpdatingStorage] = useState(false);
  
  // Modify fetchMatches to handle proper data processing
  const fetchMatches = useCallback(async () => {
    if (!itemId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching matches for item:', itemId);
      
      // Pass current user ID to allow backend filtering of twinned items
      const response = await itemsService.findMatches(itemId, { 
        userId: currentUser?._id 
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch matches');
      }
      
      console.log('Raw matches response:', response);
      
      // Process matches to ensure all have proper structures
      let processedMatches = [];
      if (response.data && Array.isArray(response.data)) {
        processedMatches = response.data.map(match => {
          // Simple data validation to ensure required fields exist
          return {
            ...match,
            item: match.item || {},
            sourceItem: match.sourceItem || {},
            score: match.score || 0
          };
        });
        
        // Log all fetched items to verify data
        console.log('Processed matches:', processedMatches.map(m => ({
          id: m.item?._id,
          title: m.item?.title,
          twinned: m.item?.twin?.isTwinned || false,
          reportedBy: m.item?.reportedBy?._id
        })));
      }
      
      // Apply strict filtering for twinned items - don't show items twinned by others
      const filteredMatches = processedMatches.filter(match => {
        const currentUserId = currentUser?._id?.toString();
        
        // For NON-twinned items, always show them
        if (!match.item?.twin?.isTwinned) {
          return true;
        }
        
        // If no current user, don't show ANY twinned items
        if (!currentUserId) {
          return false;
        }
        
        // STRICT FILTERING: Only show twinned items where the user is directly involved
        const matchItemReporterId = match.item?.reportedBy?._id?.toString();
        const sourceItemReporterId = match.sourceItem?.reportedBy?._id?.toString();
        const twinInitiator = match.item?.twin?.initiatedBy?.toString();
        
        // User must be the reporter, source reporter, or initiator to see twinned items
        const isUserInvolved = 
          matchItemReporterId === currentUserId || 
          sourceItemReporterId === currentUserId ||
          twinInitiator === currentUserId;
        
        // Always check if this item is in our locally tracked twinned items
        const isTrackedTwin = twinnedItemIds.includes(match.item?._id);
        
        // Only return true if the current user is involved
        return isUserInvolved || isTrackedTwin;
      });

      console.log(`Filtered ${processedMatches.length} matches to ${filteredMatches.length} visible matches`);
      
      // Sort by score and set the matches
      const sortedMatches = filteredMatches.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // If there's a twinned match, prioritize showing it
      const twinnedMatch = sortedMatches.find(match => 
        match.item?.twin?.isTwinned || match.sourceItem?.twin?.isTwinned
      );
      
      if (twinnedMatch) {
        console.log('Prioritizing twinned match:', twinnedMatch.item?._id);
        setMatches([twinnedMatch]);
      } else {
        setMatches(sortedMatches);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err.message || 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  }, [itemId, userId, currentUser, isUpdatingStorage, twinnedItemIds]);

  // Add a more robust filtering function with improved visibility rules
  const applyEnhancedFilteringWithNullCheck = (matchesArray) => {
    if (!matchesArray || !matchesArray.length) return [];
    
    console.log('Filtering matches with user ID:', userId);
    console.log('Known twinned item IDs:', twinnedItemIds);
    
    // Always include items the current user has twinned (stored in our local state)
    const enhancedMatches = matchesArray.filter(match => {
      const matchItemId = match.item?._id;
      const sourceItemId = match.sourceItem?._id;
      
      // If no auth or ID, only show non-twinned items
      if (!userId) {
        return !match.item?.twin?.isTwinned && match.item?.status !== 'authenticating';
      }
      
      const currentUserId = userId.toString();
      
      // Show all non-twinned items
      const itemTwinned = match.item?.twin?.isTwinned || match.item?.status === 'authenticating';
      if (!itemTwinned) {
        return true;
      }
      
      // STRICT RULE: For twinned items, user must be directly involved
      const isReporterOfItem = match.item?.reportedBy?._id?.toString() === currentUserId;
      const isReporterOfSource = match.sourceItem?.reportedBy?._id?.toString() === currentUserId;
      const isInitiatorOfItem = match.item?.twin?.initiatedBy?.toString() === currentUserId;
      const isTrackedTwin = twinnedItemIds.includes(matchItemId) || 
                          (sourceItemId && twinnedItemIds.includes(sourceItemId));
      
      // Debug visibility decision
      const showItem = isReporterOfItem || isReporterOfSource || isInitiatorOfItem || isTrackedTwin;
      console.log(`Filtering twinned item ${match.item?.title}:`, {showItem});
      
      return showItem;
    });
    
    return enhancedMatches;
  };
  
  // Modified handleTwinItems to use in-memory state instead of localStorage
  const handleTwinItems = async (matchItemId, sourceId = itemId, twinState = true) => {
    try {
      if (twinState && userId && !isUpdatingStorage) {
        setIsUpdatingStorage(true);
        
        try {
          // Add to in-memory state
          if (!twinnedItemIds.includes(matchItemId)) {
            addToTwinnedItems(userId, matchItemId);
            
            if (sourceId !== matchItemId) {
              addToTwinnedItems(userId, sourceId);
            }
          }
        } finally {
          setIsUpdatingStorage(false);
        }
      }
      
      // Call the parent component's onTwinItems function
      const response = await onTwinItems(matchItemId, sourceId, twinState);
      
      // Handle untwinning - remove from local state only
      if (!twinState && response?.success) {
        removeFromTwinnedItems(userId, [matchItemId, sourceId]);
        
        // IMPORTANT: When untwinning, don't try to update the status separately
        // The untwin operation should already reset the status on the server
        
        // Force UI update on successful untwin
        if (onMatchedItemStatusUpdate) {
          console.log('Manually updating UI state for untwinned item:', matchItemId);
          // Just update the UI, not making an API call
          onMatchedItemStatusUpdate(matchItemId, 'posted', true);
        }
      }
      
      // Always refresh matches after twinning operations
      await fetchMatches();
      return response;
    } catch (error) {
      console.error('Error in handleTwinItems:', error);
      throw error;
    }
  };

  // Add a function to handle verification completion events
  const handleVerificationComplete = (isCorrect, answerId, untwinned, statusReset) => {
    console.log(`MatchesList: Verification complete event - isCorrect=${isCorrect}, untwinned=${untwinned}, statusReset=${statusReset}`);
    
    // Update both items in the match pair when verification is complete
    if (isCorrect) {
      // Find both twinned items and update their status to 'authenticated'
      setMatches(prevMatches => {
        const updatedMatches = prevMatches.map(match => {
          // For any twinned item, update its status to 'authenticated'
          if (match.item?.twin?.isTwinned) {
            return {
              ...match,
              item: {
                ...match.item,
                status: 'authenticated'
              }
            };
          }
          return match;
        });
        return updatedMatches;
      });
      
      // Call the parent handler to ensure both items get updated server-side as well
      if (onMatchedItemStatusUpdate) {
        // Get the item IDs for both twinned items
        matches.forEach(match => {
          if (match.item?.twin?.isTwinned) {
            // Update the main item
            onMatchedItemStatusUpdate(match.item._id, 'authenticated');
            
            // If we know the twinned item's ID, update it too
            if (match.item.twin?.item?._id) {
              onMatchedItemStatusUpdate(match.item.twin.item._id, 'authenticated');
            }
          }
        });
      }
    }
    
    // Force refresh for either case (correct or incorrect)
    fetchMatches();
    
    // Pass the event up to the parent component if callback exists
    if (onVerificationComplete) {
      onVerificationComplete(isCorrect, answerId, untwinned, statusReset);
    }
  };

  // Remove unnecessary localStorage related code
  useEffect(() => {
    if (authReady && userId && !isUpdatingStorage) {
      // No need to read from localStorage
    }
  }, [authReady, userId, isUpdatingStorage]);

  // Fetch matches when itemId changes or fetchMatches function updates
  useEffect(() => {
    if (itemId) {
      fetchMatches();
    }
  }, [itemId, fetchMatches]);

  // Function to refresh notifications after an action
  const refreshNotifications = async () => {
    try {
      // Placeholder for notification refresh logic
      return { success: true };
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      return { success: false, error: error.message };
    }
  };

  // Add safe rendering for no matches
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Aucun objet correspondant trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        // Prepare match data with default twin object if needed
        const enhancedMatch = {
          ...match,
          item: {
            ...match.item,
            twin: match.item.twin || {
              isTwinned: false,
              item: null,
              initiatedBy: null
            }
          }
        };
        
        // Render the appropriate card based on the item type
        return match.item.type === 'found' ? (
          <FoundItemMatchCard
            key={match.item._id}
            match={enhancedMatch}
            onMatchedItemStatusUpdate={onMatchedItemStatusUpdate}
            currentUser={currentUser}
            onTwinItems={handleTwinItems}
            onNotificationRefresh={refreshNotifications}
            sourceItemId={itemId}
            isSourceItem={match.item._id === itemId}
            onVerificationComplete={handleVerificationComplete}
          />
        ) : (
          <LostItemMatchCard
            key={match.item._id}
            match={enhancedMatch}
            onMatchedItemStatusUpdate={onMatchedItemStatusUpdate}
            currentUser={currentUser}
            onTwinItems={handleTwinItems}
            onNotificationRefresh={refreshNotifications}
            sourceItemId={itemId}
            isSourceItem={match.item._id === itemId}
            onVerificationComplete={handleVerificationComplete}
          />
        );
      })}
      
      {/* Only show expand button if there are more than 3 non-twinned matches */}
      {matches.length > 3 && !matches.some(match => match.item.twin?.isTwinned || match.sourceItem?.twin?.isTwinned) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {expanded ? 'Voir moins' : `Voir ${matches.length - 3} correspondances de plus`}
        </button>
      )}
    </div>
  );
};

export default MatchesList;