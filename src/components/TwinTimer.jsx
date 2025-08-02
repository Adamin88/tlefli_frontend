import React, { useState, useEffect, useCallback } from 'react';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import itemsService from '../services/itemsService';

const TwinTimer = ({ itemId, onTimerExpired, isVisible = true }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState(null);

  // Fetch timer info from backend
  const fetchTimerInfo = useCallback(async () => {
    if (!itemId) return;
    
    try {
      const result = await itemsService.getTimerInfo(itemId);
      
      if (result.success) {
        setIsActive(result.data.timerActive);
        setTimeRemaining(result.data.remainingTime || 0);
        setIsExpired(result.data.timerExpired || false);
        setError(null);
        
        // If timer expired on server, trigger callback
        if (result.data.timerExpired && onTimerExpired) {
          onTimerExpired();
        }
      }
    } catch (err) {
      console.error('Error fetching timer info:', err);
      setError('Failed to fetch timer information');
    }
  }, [itemId, onTimerExpired]);

  // Initial fetch and re-fetch when itemId changes
  useEffect(() => {
    fetchTimerInfo();
    
    // Set up periodic refresh every 30 seconds to stay in sync with server
    const refreshInterval = setInterval(fetchTimerInfo, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchTimerInfo]);

  // Update timer every second when active
  useEffect(() => {
    if (!isActive || isExpired || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1000;
        
        if (newTime <= 0) {
          setIsActive(false);
          setIsExpired(true);
          if (onTimerExpired) {
            onTimerExpired();
          }
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isExpired, timeRemaining, onTimerExpired]);

  // Format time remaining
  const formatTime = (milliseconds) => {
    if (milliseconds <= 0) return '0:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (isExpired) return 'text-red-600';
    if (timeRemaining <= 60000) return 'text-red-500'; // Last minute - red
    if (timeRemaining <= 120000) return 'text-orange-500'; // Last 2 minutes - orange
    return 'text-blue-600'; // Normal - blue
  };

  // Get background color for timer badge
  const getTimerBgColor = () => {
    if (isExpired) return 'bg-red-100 border-red-200';
    if (timeRemaining <= 60000) return 'bg-red-50 border-red-200';
    if (timeRemaining <= 120000) return 'bg-orange-50 border-orange-200';
    return 'bg-blue-50 border-blue-200';
  };

  if (!isVisible || (!isActive && !isExpired)) return null;

  if (error) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
        <span className="text-xs text-yellow-700">Timer info unavailable</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 p-3 border rounded-lg ${getTimerBgColor()}`}>
      <ClockIcon className={`h-5 w-5 ${getTimerColor()}`} />
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${getTimerColor()}`}>
            {isExpired ? 'Temps écoulé' : formatTime(timeRemaining)}
          </span>
          {isExpired && (
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
          )}
        </div>
        <span className="text-xs text-gray-600">
          {isExpired 
            ? 'Les objets ont été automatiquement dé-jumelés'
            : 'Temps restant pour soumettre une réponse'
          }
        </span>
      </div>
    </div>
  );
};

export default TwinTimer;
