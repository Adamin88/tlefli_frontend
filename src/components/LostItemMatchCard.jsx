import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import BaseMatchCard from './BaseMatchCard';
import itemsService from '../services/itemsService';

const LostItemMatchCard = ({ 
  match, 
  onMatchedItemStatusUpdate, 
  currentUser, 
  onTwinItems,
  onNotificationRefresh,
  sourceItemId,
  isSourceItem = false,
  onVerificationComplete,
  onDataRefresh // New prop for refreshing parent component data
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [itemReference, setItemReference] = useState(null);
  const [forceRender, setForceRender] = useState(0);
  const [isUntwinning, setIsUntwinning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rewardInfo, setRewardInfo] = useState(null);
  const [distance, setDistance] = useState(null);

  // Check if the item is twinned based on the twin field
  const isTwinned = match.item.twin?.isTwinned || match.item.status === 'authenticating';

  // Check if current user can untwin the items
  const canUntwin = React.useMemo(() => {
    // Check if the current user is the reporter of either item
    const isItemReporter = match.item.reportedBy?._id === currentUser?._id;
    const isSourceItemReporter = match.sourceItem?.reportedBy?._id === currentUser?._id;
    
    // Allow untwinning if:
    // 1. Items are twinned AND
    // 2. Either:
    //   - User initiated the twinning OR
    //   - User is the reporter of either item
    return isTwinned && (
      currentUser?._id === match.item.twin?.initiatedBy ||
      isItemReporter ||
      isSourceItemReporter
    );
  }, [isTwinned, match.item.twin, match.item.reportedBy, match.sourceItem, currentUser]);

  // Fetch item details to get reference and reward info
  const fetchItemDetails = useCallback(async () => {
    try {
      if (match.item._id) {
        const response = await itemsService.getItemById(match.item._id);
        
        if (response.success && response.data) {
          console.log(`LostItemMatchCard: Item details fetched:`, {
            reference: response.data.reference,
            reward: response.data.reward
          });
          
          // Set the reference directly
          setItemReference(response.data.reference);
          
          // Set reward information if available
          if (response.data.reward) {
            setRewardInfo(response.data.reward);
          }
          
          // Also set it on the match object for immediate display
          match.item.reference = response.data.reference;
          match.item.reward = response.data.reward;
        }
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  }, [match.item._id]);

  useEffect(() => {
    // Use reference and reward directly from match if available
    if (match.item.reference) {
      setItemReference(match.item.reference);
    }
    
    if (match.item.reward) {
      setRewardInfo(match.item.reward);
    } else if (match.item.type === 'lost') {
      // Only fetch details if we need them and haven't already got them
      fetchItemDetails();
    }
  }, [fetchItemDetails, match.item.reference, match.item.reward, match.item.type]);

  // Set distance from match data when component mounts or match changes
  useEffect(() => {
    // Check all possible locations where distance might be stored
    if (match) {
      // Try different possible paths for the distance property
      const distanceValue = match.distanceKm || 
                           match.distance ||
                           match.item?.distance;
      
      if (distanceValue !== undefined) {
        setDistance(distanceValue);
        console.log(`Distance found: ${distanceValue} km`);
      } else {
        console.log('No distance information available in match data:', match);
      }
    }
  }, [match]);

  // Format distance for display - keep consistent with FoundItemMatchCard
  const formatDistance = (distance) => {
    if (distance === null || distance === undefined) return null;
    
    // Convert to meters if less than 1km
    if (distance < 1) {
      const meters = Math.round(distance * 1000);
      return `${meters}m`;
    }
    
    // Format with 1 decimal place if under 10km
    if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    }
    
    // Round to whole number for larger distances
    return `${Math.round(distance)}km`;
  };

  // Get color based on distance value (inverse of score - closer is better)
  const getDistanceColor = (distance) => {
    if (distance === null || distance === undefined) return 'text-gray-400';
    
    if (distance < 0.5) return 'text-green-500'; // Very close
    if (distance < 1) return 'text-emerald-500'; // Close
    if (distance < 3) return 'text-blue-500'; // Moderate
    if (distance < 5) return 'text-yellow-500'; // Far
    if (distance < 10) return 'text-orange-500'; // Very far
    return 'text-red-500'; // Extremely far
  };
  
  // Create a header extras renderer that matches the score UI
  const renderHeaderExtras = useCallback(() => {
    if (distance === null || distance === undefined) return null;
    
    const distanceText = formatDistance(distance);
    const colorClass = getDistanceColor(distance);
    const ringColorClass = colorClass.replace('text-', 'ring-');
    
    return (
      <div className="relative inline-flex flex-col items-center justify-center mr-2">
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Background circle */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <circle 
              className="text-gray-200" 
              strokeWidth="8" 
              stroke="currentColor" 
              fill="transparent" 
              r="42" 
              cx="50" 
              cy="50" 
            />
            {/* Distance circle with inverted scale (closer = more filled) */}
            <circle 
              className={`${colorClass} transform origin-center -rotate-90`} 
              strokeWidth="8" 
              strokeDasharray={264}
              strokeDashoffset={distance > 20 ? 0 : 264 - (264 * (20 - Math.min(distance, 20)) / 20)} 
              strokeLinecap="round" 
              stroke="currentColor" 
              fill="transparent" 
              r="42" 
              cx="50" 
              cy="50" 
            />
          </svg>
          {/* Center content */}
          <div className="flex flex-col items-center">
            <MapPinIcon className={`h-4 w-4 ${colorClass} mb-0.5`} />
            <span className={`text-sm font-bold ${colorClass}`}>{distanceText}</span>
          </div>
        </div>
        <span className="text-xs text-gray-500 mt-1">Distance</span>
      </div>
    );
  }, [distance]);

  // Ensure the handleUntwin function doesn't have any toast references
  const handleUntwin = async () => {
    setIsUntwinning(true);
    
    try {
      // For lost items, ensure IDs are passed in the correct order
      const firstItemId = sourceItemId;
      const secondItemId = match.item._id;
      
      if (!firstItemId || !secondItemId) {
        console.error('Missing required IDs for untwinning:', {
          firstItemId,
          secondItemId
        });
        return;
      }

      console.log('Initiating untwin operation:', {
        itemType: match.item.type,
        firstItemId,
        secondItemId,
        currentUser: currentUser?._id,
        twinInfo: match.item.twin,
        currentStatus: match.item.status
      });

      const response = await onTwinItems(firstItemId, secondItemId, false);
      
      if (response?.success) {
        // IMPORTANT: Reset status to 'posted' regardless of current status
        if (match.item.status === 'authenticated' || match.item.status === 'authenticating') {
          if (onMatchedItemStatusUpdate) {
            // Update both items status to 'posted'
            onMatchedItemStatusUpdate(firstItemId, 'posted');
            onMatchedItemStatusUpdate(secondItemId, 'posted');
          }
          
          // Update local item status immediately for immediate UI feedback
          match.item.status = 'posted';
        }
        
        // Force a refresh of the component
        setForceRender(prev => prev + 1);
        
        // Trigger data refresh to update parent components
        if (onDataRefresh) {
          console.log('LostItemMatchCard: Triggering data refresh after manual untwinning');
          try {
            await onDataRefresh();
          } catch (error) {
            console.error('LostItemMatchCard: Error refreshing data after untwinning:', error);
          }
        }
      } else {
        throw new Error(response?.error || 'Failed to untwin items');
      }
    } catch (error) {
      console.error('Error untwinning items:', error);
    } finally {
      setIsUntwinning(false);
    }
  };

  // Add a handler for verification completion
  const handleVerificationComplete = useCallback((isCorrect, answerId, untwinned, statusReset) => {
    console.log(`LostItemMatchCard: Verification complete - isCorrect=${isCorrect}, untwinned=${untwinned}`);
    
    if (untwinned) {
      // If untwinned, update status to posted
      if (statusReset && match.item) {
        match.item.status = 'posted';
        match.item.twin = {
          isTwinned: false,
          item: null,
          initiatedBy: null
        };
        // Force re-render
        setForceRender(prev => prev + 1);
      }
      
      // Trigger data refresh to update parent components
      if (onDataRefresh) {
        console.log('LostItemMatchCard: Triggering data refresh after untwinning');
        onDataRefresh().catch(error => {
          console.error('LostItemMatchCard: Error refreshing data after untwinning:', error);
        });
      }
    } else if (isCorrect) {
      // If answer is correct, update the item status to authenticated
      match.item.status = 'authenticated';
      
      // Force re-render to show the updated status
      setForceRender(prev => prev + 1);
      
      console.log('LostItemMatchCard: Updated status to authenticated after correct answer');
      
      // Trigger data refresh to update parent components
      if (onDataRefresh) {
        console.log('LostItemMatchCard: Triggering data refresh after authentication');
        onDataRefresh().catch(error => {
          console.error('LostItemMatchCard: Error refreshing data after authentication:', error);
        });
      }
    }
    
    // Propagate the event to parent components if needed
    if (onVerificationComplete) {
      onVerificationComplete(isCorrect, answerId, untwinned, statusReset);
    }
  }, [match.item, onVerificationComplete, onDataRefresh]);

  // Render button for untwin under the image - only show if the user can untwin
  const renderActionButtons = () => {
    // Don't render anything if conditions aren't met
    if (!isTwinned || !canUntwin) {
      return null;
    }
    
    return (
      <div className="mt-3 flex justify-center">
        <button
          onClick={handleUntwin}
          disabled={isUntwinning}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
            ${isUntwinning ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'}`}
        >
          {isUntwinning ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Annulation...
            </>
          ) : (
            `Ce n'est pas votre objet`
          )}
        </button>
      </div>
    );
  };

  // Add reward information to details content
  const renderDetailsContent = () => {
    return (
      <>
        {match.item.type === 'lost' && rewardInfo && (
          <div className="col-span-2 mb-4">
            <div className="inline-block bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              <div className="flex items-center">
                <span className="text-amber-500 text-xl mr-2">🎁</span>
                <span className="text-amber-700 font-medium">
                  Récompense: {rewardInfo.amount} {rewardInfo.currency}
                </span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <BaseMatchCard
      match={match}
      itemReference={itemReference || match.item.reference}
      showDetails={showDetails}
      setShowDetails={setShowDetails}
      forceRender={forceRender}
      renderActionButtons={renderActionButtons}
      renderDetailsContent={renderDetailsContent}
      onVerificationComplete={handleVerificationComplete}
      renderHeaderExtras={renderHeaderExtras}
      onDataRefresh={onDataRefresh}
    >
      {/* No need for renderDistanceBadge - it's now in the header */}
    </BaseMatchCard>
  );
};

export default LostItemMatchCard;
