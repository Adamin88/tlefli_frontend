import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
  CreditCardIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import BaseMatchCard from './BaseMatchCard';
import itemsService from '../services/itemsService';
import PaymentButton from './PaymentButton';
import toast from './Toast/index';

const FoundItemMatchCard = ({
  match,
  onMatchedItemStatusUpdate,
  currentUser,
  onTwinItems,
  onNotificationRefresh,
  sourceItemId,
  isSourceItem = false,
  onVerificationComplete
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [secretAnswer, setSecretAnswer] = useState('');
  const [showSecretQuestion, setShowSecretQuestion] = useState(false);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTwinning, setIsTwinning] = useState(false);
  const [isUntwinning, setIsUntwinning] = useState(false);
  const [itemReference, setItemReference] = useState(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [latestAnswer, setLatestAnswer] = useState(null);
  const [forceRender, setForceRender] = useState(0);
  const [justTwinned, setJustTwinned] = useState(false);
  const [forceShowQuestionForm, setForceShowQuestionForm] = useState(false);
  const [formShownAfterTwin, setFormShownAfterTwin] = useState(false);
  const [permanentShowForm, setPermanentShowForm] = useState(false);
  const [persistentTwinState, setPersistentTwinState] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showAnswerHistory, setShowAnswerHistory] = useState(false);
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState(null);
  const isInitialMount = useRef(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isLoadingPaymentStatus, setIsLoadingPaymentStatus] = useState(false);
  const [showPaymentButton, setShowPaymentButton] = useState(false);
  const [distance, setDistance] = useState(null);

  // Add this utility function to get a valid userID
  const getValidUserId = (currentUser, match) => {
    // First priority: Use currentUser._id if available
    if (currentUser?._id) {
      return currentUser._id;
    }
    
    // Second priority: Use the ID from the twin initiator
    const initiatedBy = match?.item?.twin?.initiatedBy;
    if (initiatedBy) {
      console.log('Using twin initiatedBy as fallback user ID:', initiatedBy);
      return initiatedBy;
    }
    
    // No valid ID available
    console.warn('No valid user ID found - using null');
    return null;
  };

  // Check if the item is twinned based on the twin field
  const isTwinned = useMemo(() => {
    // Check both the item and sourceItem for twin status
    const itemTwinned = match.item.twin?.isTwinned || match.item.status === 'authenticating';
    const sourceTwinned = match.sourceItem?.twin?.isTwinned || match.sourceItem?.status === 'authenticating';
    
    console.log('isTwinned check:', {
      itemTwinned,
      sourceTwinned,
      itemStatus: match.item.status,
      twin: match.item.twin,
      sourceItemStatus: match.sourceItem?.status
    });
    
    return itemTwinned || sourceTwinned;
  }, [match.item.twin, match.item.status, match.sourceItem?.twin, match.sourceItem?.status]);

  // Check if current user can untwin the items
  const canUntwin = useMemo(() => {
    // Check if the current user is the reporter of either item
    const isItemReporter = match.item.reportedBy?._id === currentUser?._id;
    const isSourceItemReporter = match.sourceItem?.reportedBy?._id === currentUser?._id;
    
    // Allow untwinning if:
    // 1. Items are twinned AND
    // 2. Either:
    //   - User initiated the twinning OR
    //   - User is the reporter of either item
    const canUntwin = isTwinned && (
      currentUser?._id === match.item.twin?.initiatedBy ||
      isItemReporter ||
      isSourceItemReporter
    );
    
    console.log('canUntwin calculation:', {
      isTwinned,
      currentUserId: currentUser?._id,
      initiatedBy: match.item.twin?.initiatedBy,
      isItemReporter,
      isSourceItemReporter,
      result: canUntwin
    });
    
    return canUntwin;
  }, [isTwinned, match.item.twin, match.item.reportedBy, match.sourceItem, currentUser]);

  // Add the displayAllPendingAnswers function that was missing
  const displayAllPendingAnswers = () => {
    if (!match?.item?.secretAnswers?.length) return;
    
    // Find any pending answers regardless of user
    const pendingAnswers = match.item.secretAnswers.filter(a => !a.verified);
    
    if (pendingAnswers.length > 0) {
      console.log('Found pending answers without user match:', pendingAnswers.length);
      // Sort by date, newest first
      pendingAnswers.sort((a, b) => 
        new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)
      );
      
      // Set latest answer to the newest pending answer
      setLatestAnswer(pendingAnswers[0]);
      setAnswerStatus('pending');
      setShowSecretQuestion(false);
      
      console.log('Set pending answer without user match:', {
        answer: pendingAnswers[0].answer?.substring(0, 20) + '...',
        user: pendingAnswers[0].user?._id || 'unknown'
      });
    }
  };

  // Enhanced version of checkUserSecretAnswer to ensure pending answers always take absolute priority
const checkUserSecretAnswer = () => {
  try {
    console.log('Checking for existing secret answers for item:', match.item._id);
    
    // IMPORTANT: Check for secret answers first
    if (match?.item?.secretAnswers?.length) {
      console.log('Secret answers found in item data:', match.item.secretAnswers.length);
      
      // Get valid user ID with fallback options
      const userId = getValidUserId(currentUser, match);
      
      if (!userId) {
        console.warn('Cannot process secret answers - no valid user ID available');
        // Just display all pending answers if we can't match by user
        displayAllPendingAnswers();
        return { success: false, exists: false, status: 'no_user' };
      }
      
      // Enhanced search for the user's answers
      const userAnswers = match.item.secretAnswers.filter(answer => {
        // Handle various possible formats of user ID
        const answerUserId = answer.user?._id?.toString() || 
                           answer.user?.toString() || 
                           answer.userId?.toString();
        
        const validUserId = userId.toString();
        
        const isMatch = answerUserId === validUserId;
        
        return isMatch;
      });
      
      console.log('Found user answers:', userAnswers.length);
      
      // Store all user answers for tracking
      if (userAnswers.length > 0) {
        // Sort by submission date, newest first
        userAnswers.sort((a, b) => 
          new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)
        );
        
        // Store all answers for history view
        setUserAnswers(userAnswers);
        
        // CRITICAL FIX: ALWAYS set lastSubmittedAnswer to the most recent answer
        // regardless of its status - this ensures we always show the latest answer
        const mostRecentAnswer = userAnswers[0];
        setLastSubmittedAnswer(mostRecentAnswer);
        console.log('Setting last submitted answer to most recent:', mostRecentAnswer);
        
        // ABSOLUTE HIGHEST PRIORITY: Find pending answers first
        const pendingAnswer = userAnswers.find(a => a.verified !== true);
        
        if (pendingAnswer) {
          console.log('***PRIORITY FIX***: Found pending answer - giving it ABSOLUTE priority:', {
            id: pendingAnswer._id,
            answer: pendingAnswer.answer?.substring(0, 20) + '...',
            submittedAt: pendingAnswer.submittedAt || pendingAnswer.createdAt
          });
          
          // Pending always takes priority for display
          setAnswerStatus('pending');
          setLatestAnswer(pendingAnswer);
          setShowSecretQuestion(false);
          setPermanentShowForm(false);
          
          return { 
            success: true, 
            exists: true, 
            status: 'pending',
            answer: pendingAnswer
          };
        }
        
        // Only check verified answers for UI status if there are no pending ones
        const verifiedAnswers = userAnswers.filter(a => a.verified === true);
        if (verifiedAnswers.length) {
          // Take the most recent one (already sorted)
          const latest = verifiedAnswers[0];
          const status = latest.isCorrect ? 'correct' : 'incorrect';
          
          console.log('Found verified answer:', {
            id: latest._id,
            status,
            answer: latest.answer?.substring(0, 20) + '...',
            submittedAt: latest.submittedAt
          });
          
          setAnswerStatus(status);
          setLatestAnswer(latest);
          
          // Only show question form for incorrect answers when item is twinned
          if (status === 'incorrect' && isTwinned) {
            setShowSecretQuestion(true);
          } else {
            setShowSecretQuestion(false);
          }
          
          return {
            success: true,
            exists: true,
            status,
            answer: latest,
            allAnswers: userAnswers
          };
        }
      } else {
        // Reset user answers if none found
        setUserAnswers([]);
        setLastSubmittedAnswer(null);
      }
      
      return { success: true, exists: false, status: 'none' };
    }
    
    // If no secret answers in the match data, assume none exist
    console.log('No secret answers found in match data');
    setUserAnswers([]);
    setLastSubmittedAnswer(null);
    return { success: true, exists: false, status: 'none' };
  } catch (error) {
    console.error('Error checking for existing answer:', error);
    return { success: false, exists: false };
  }
};

  // Make fetchItemDetails available throughout the component
  const fetchItemDetails = async () => {
    try {
      if (match.item._id) {
        const response = await itemsService.getItemById(match.item._id);
        
        if (response.success && response.data) {
          console.log(`FoundItemMatchCard: Item reference fetched: ${response.data.reference}`);
          
          // Set the reference directly
          setItemReference(response.data.reference);
          
          // Also set it on the match object for immediate display
          match.item.reference = response.data.reference;
          
          // If the response contains updated secret answers, update our local state
          if (response.data.secretAnswers?.length) {
            console.log('Updating secret answers from fetchItemDetails:', 
              response.data.secretAnswers.length);
            
            // Update match.item.secretAnswers with the fresh data
            match.item.secretAnswers = response.data.secretAnswers;
            
            // Force re-render to reflect updated data
            setForceRender(prev => prev + 1);
            
            // Re-run the check with the updated data
            checkUserSecretAnswer();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
      // If we can't fetch the reference, don't set anything
    }
  };

  useEffect(() => {
    if (match?.item?._id && match.item.secretQuestion && currentUser) {
      // Check for answers when component mounts or data changes
      checkUserSecretAnswer();
    }
  }, [match?.item?._id, match?.item?.secretAnswers, currentUser]);

  // Initialize showSecretQuestion based on item status and type
  useEffect(() => {
    if (!match?.item) return;

    const currentUserIsReporter = match.item.reportedBy?._id === currentUser?._id;

    // Show secret question form only when item is twinned
    const canShowSecretQuestionForm = !currentUserIsReporter && isTwinned;

    if (currentUser?._id && match.item.secretAnswers?.length > 0) {
      const userAnswer = match.item.secretAnswers.find(answer => {
        const answerUserId = answer.user?._id || answer.user;
        return answerUserId?.toString() === currentUser._id.toString();
      });
      
      if (userAnswer) {
        if (!userAnswer.verified) {
          setAnswerStatus('pending');
        } else if (userAnswer.isCorrect) {
          setAnswerStatus('correct');
        } else {
          setAnswerStatus('incorrect');
        }
        // Only show question form if untwinned and answer was incorrect
        setShowSecretQuestion(canShowSecretQuestionForm && userAnswer.verified && !userAnswer.isCorrect);
      } else {
        setShowSecretQuestion(canShowSecretQuestionForm);
      }
    } else {
      setShowSecretQuestion(canShowSecretQuestionForm);
    }
  }, [match?.item, currentUser, isTwinned]);

  useEffect(() => {
    // Use reference directly from match if available
    if (match.item.reference) {
      setItemReference(match.item.reference);
    } else {
      fetchItemDetails();
    }
  }, [match.item._id, match.item.reference]);

  // Move getLatestAnswerStatus here, before it's used in useEffect
  const getLatestAnswerStatus = useCallback(() => {
    if (!match?.item?.secretAnswers?.length || !currentUser?._id) return null;
    
    // Ensure all objects have the required properties before filtering
    const validAnswers = match.item.secretAnswers.filter(answer => 
      answer && answer.user && answer.user._id === currentUser._id &&
      answer.answer && // Check that answer exists
      (answer.submittedAt || answer.createdAt) // Check for submission date
    );
    
    if (validAnswers.length === 0) return null;
    
    // Sort by submission date
    const userAnswers = validAnswers.sort((a, b) => 
      new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)
    );

    const latestAnswer = userAnswers[0];
    if (!latestAnswer) return null;

    // Handle missing verified/isCorrect properties with defaults
    const verified = latestAnswer.verified !== undefined ? latestAnswer.verified : false;
    const isCorrect = latestAnswer.isCorrect !== undefined ? latestAnswer.isCorrect : false;

    return {
      status: !verified ? 'pending' : isCorrect ? 'correct' : 'incorrect',
      answer: latestAnswer,
      shouldShowForm: !verified || (verified && !isCorrect)
    };
  }, [match?.item?.secretAnswers, currentUser?._id]);

  // Update the check for pending answers to be more robust
  const hasPendingAnswer = useMemo(() => {
    if (!match?.item?.secretAnswers || !currentUser) return false;
    
    const pending = match.item.secretAnswers.some(answer => 
      answer.user?._id === currentUser._id && !answer.verified
    );
    
    if (pending) {
      console.log('User has pending answer:', {
        userId: currentUser._id,
        itemId: match.item._id,
        timestamp: new Date().toISOString()
      });
    }
    
    return pending;
  }, [match?.item?.secretAnswers, currentUser]);

  // Add constant for direct access anywhere in the component
  const forceHideFormCondition = (match, currentUser, answerStatus) => {
    // Direct check for pending answers in the item data - highest priority check
    return match.item.secretAnswers?.some(answer => 
      answer.user?._id === currentUser?._id && !answer.verified
    ) || answerStatus === 'pending';
  };

  // Update shouldNeverShowForm to explicitly check for non-twinned items with pending answers
  const shouldNeverShowForm = useMemo(() => {
    // ABSOLUTE HIGHEST PRIORITY: Check for pending answers
    // This check overrides EVERYTHING else, even permanentShowForm
    const hasPendingAnswer = match.item.secretAnswers?.some(answer => 
      answer.user?._id === currentUser?._id && !answer.verified
    );
    
    if (hasPendingAnswer) {
      console.log('🚫 CRITICAL BLOCKER: Form will never show due to pending answer');
      return true;
    }
    
    // Only now check other conditions since pending answers check passed
    if (permanentShowForm) {
      console.log('Form permanently visible - overriding all hide checks');
      return false;
    }
    
    // Check for correct answers in the item data
    const hasCorrectAnswer = match.item.secretAnswers?.some(answer =>
      answer.user?._id === currentUser?._id && answer.verified && answer.isCorrect
    );
    
    return hasPendingAnswer || hasCorrectAnswer || answerStatus === 'correct';
  }, [match.item.secretAnswers, currentUser?._id, answerStatus, permanentShowForm]);

  // ADD NEW useMemo for reliable form visibility checking
  const shouldShowSecretQuestionForm = useMemo(() => {
    // PRIORITY CHECK: Never show form if there's a pending answer
    const hasPendingAnswer = match.item.secretAnswers?.some(answer => 
      answer.user?._id === currentUser?._id && !answer.verified
    );
    
    // Also never show form if item is authenticated
    const isAuthenticated = match.item.status === 'authenticated';
    
    if (!isTwinned || hasPendingAnswer || answerStatus === 'pending' || isAuthenticated) {
      return false;
    }
    
    // Use persistentTwinState instead of localStorage
    const effectivelyTwinned = isTwinned || persistentTwinState;
    
    // Basic requirements: must be found item, user not the reporter, and twinned
    const basicRequirements = 
      match.item.reportedBy?._id !== currentUser?._id &&
      effectivelyTwinned;
    
    if (!basicRequirements) return false;
    
    // Check for correct answers that would block the form
    const hasCorrectAnswer = match.item.secretAnswers?.some(answer =>
      answer.user?._id === currentUser?._id && answer.verified && answer.isCorrect
    );
    
    return !hasCorrectAnswer;
  }, [match.item, currentUser, isTwinned, answerStatus, persistentTwinState]);

  // Render twin item section
  const renderTwinItem = () => {
    if (!isTwinned || !match.item.twin?.item) return null;
    
    const twinItem = match.item.twin.item;
    
    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-500">Objet associé</h4>
        <div className="mt-2 bg-gray-50 p-3 rounded-md">
          <div className="flex items-center">
            <div className="mr-2">
              {twinItem.type === 'lost' ? (
                <FolderIcon className="h-5 w-5 text-blue-500" />
              ) : (
                <ChartBarIcon className="h-5 w-5 text-green-500" />
              )}
            </div>
            <h5 className="text-sm font-medium text-gray-900">
              {twinItem.title}
            </h5>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {twinItem.description}
          </div>
        </div>
      </div>
    );
  };

  const handleTwinItems = async () => {
    if (!onTwinItems || isTwinned || !match.item._id) return;
    
    setIsTwinning(true);
    
    try {
      console.log('Initiating twin operation:', {
        itemId: match.item._id,
        currentUser: currentUser?._id
      });

      // Call the API
      const response = await onTwinItems(match.item._id);
      
      if (response && response.success) {
        // Reset answer status if re-twinning after incorrect answer
        if (answerStatus === 'incorrect') {
          setAnswerStatus(null);
          setSecretAnswer('');
        }
        
        // IMPORTANT: Set ALL flags to force show the form permanently
        setForceShowQuestionForm(true);
        setPermanentShowForm(true);
        setFormShownAfterTwin(true);
        setJustTwinned(true);
        setShowSecretQuestion(true);

        // Store twinned state in memory for persistence
        setPersistentTwinState(true);
        
        // Update UI status
        if (onMatchedItemStatusUpdate) {
          onMatchedItemStatusUpdate(match.item._id, 'authenticating');
        }
        
        // Force re-render to update UI state
        setForceRender(prev => prev + 1); 
      }
    } catch (error) {
      console.error('Error twinning items:', error);
    } finally {
      setIsTwinning(false);
    }
  };

  const handleUntwinItems = async () => {
    setIsUntwinning(true);
    
    try {
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

      // Pass false as the third parameter to keep only incorrect answers
      const response = await onTwinItems(firstItemId, secondItemId, false);
      
      if (response?.success) {
        // IMPORTANT: Reset status to 'posted' regardless of current status
        if (match.item.status === 'authenticated' || match.item.status === 'authenticating') {
          if (onMatchedItemStatusUpdate) {
            // Update both items status to 'posted'
            onMatchedItemStatusUpdate(firstItemId, 'posted');
            if (secondItemId) {
              onMatchedItemStatusUpdate(secondItemId, 'posted');
            }
          }
          
          // Update local item status immediately for immediate UI feedback
          match.item.status = 'posted';
          
          // If twin object exists, update its status too for UI consistency
          if (match.item.twin?.item) {
            match.item.twin.item.status = 'posted';
          }
        }
        
        // Force a refresh of the component
        setForceRender(prev => prev + 1);
        
        // Clear twinned state from memory
        setPersistentTwinState(false);
      } else {
        throw new Error(response?.error || 'Failed to untwin items');
      }
    } catch (error) {
      console.error('Error untwinning items:', error);
    } finally {
      setIsUntwinning(false);
    }
  };

  const handleSecretAnswerSubmit = async (e) => {
    e.preventDefault();
    
    // Get valid user ID from current user or twin initiator
    const userId = getValidUserId(currentUser, match);
    
    if (!userId) {
      return;
    }
    
    // Check if user already has an unverified answer
    const hasPendingAnswer = match.item.secretAnswers?.some(answer => {
      const answerUserId = answer.user?._id?.toString() || 
                         answer.user?.toString() || 
                         answer.userId?.toString();
      return answerUserId === userId.toString() && !answer.verified;
    });
    
    if (hasPendingAnswer || answerStatus === 'pending') {
      setShowSecretQuestion(false);
      return;
    }

    if (!secretAnswer.trim()) {
      return;
    }

    if (secretAnswer.trim().length < 10) {
      return;
    }

    setIsSubmittingAnswer(true);
    setErrorMessage('');
    try {
      // Store the current answer for potential rollback
      const submittedAnswer = secretAnswer;
      const isNewAttempt = answerStatus === 'incorrect';
      
      // Immediately update UI state before API call
      setSecretAnswer('');
      setAnswerStatus('pending');
      setShowSecretQuestion(false);
      
      // Create temporary answer object for local state
      const tempAnswer = {
        _id: `temp_${Date.now()}`,
        answer: submittedAnswer,
        submittedAt: new Date(),
        user: {
          _id: userId,
          firstName: currentUser?.firstName || 'User',
          lastName: currentUser?.lastName || ''
        },
        verified: false  // Explicitly mark as not verified (pending)
      };
      
      // CRITICAL: Set as latest answer AND last submitted answer
      setLatestAnswer(tempAnswer);
      setLastSubmittedAnswer(tempAnswer);
      
      // Update user answers list too, always keeping the newest first
      setUserAnswers(prev => [tempAnswer, ...prev]);
      
      // Directly modify the match object's secretAnswers array
      if (!match.item.secretAnswers) {
        match.item.secretAnswers = [];
      }
      
      // Remove any existing unverified answers to avoid duplicates
      match.item.secretAnswers = match.item.secretAnswers.filter(a => 
        !(a.user?._id === currentUser._id && !a.verified)
      );
      
      // Add the new answer to the beginning for visibility
      match.item.secretAnswers.unshift(tempAnswer);
      
      // Force re-render immediately to reflect updated data
      setForceRender(prev => prev + 1);
      
      // Make the API call
      const result = await itemsService.submitSecretAnswer(
        match.item._id, 
        submittedAnswer,
        isNewAttempt
      );
      
      if (result.success) {
        // Clear the permanent flags
        setPermanentShowForm(false);
        setForceShowQuestionForm(false);
        setFormShownAfterTwin(false);
        setJustTwinned(false);
        setPersistentTwinState(false);
        
        // Immediately fetch and update:
        await fetchItemDetails();
        
        // Also refresh notifications if available
        if (onNotificationRefresh) {
          await onNotificationRefresh();
        }
      } else {
        // If we get an error about pending answers from the server, update UI accordingly
        if (result.message && result.message.includes('attente de vérification')) {
          setAnswerStatus('pending');
          setShowSecretQuestion(false);
          // Refresh to get the actual pending answer from the server
          await fetchItemDetails();
        }
        throw new Error(result.error || result.message || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting secret answer:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setErrorMessage(errorMessage);
      
      // Special handling for "already has pending answer" errors
      if (error.response?.data?.message?.includes('attente de vérification')) {
        setAnswerStatus('pending');
        setShowSecretQuestion(false);
        // Refresh item details to get the actual pending answer
        await fetchItemDetails();
      } else if (answerStatus === 'incorrect') {
        // For other server-side errors with incorrect answers, we might want to allow resubmission
        setShowSecretQuestion(true);
      }
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleSecretAnswerVerificationComplete = (isCorrect, answerId, untwinned, statusReset) => {
    // Update local state to reflect the verification result
    if (untwinned) {
      // Update local twin status immediately
      setPersistentTwinState(false);
      
      // Update local status if needed
      if (statusReset) {
        // Update the local item state to reflect reset status
        match.item.status = 'posted';
      }
      
      // Force re-render of component
      setForceRender(prev => prev + 1);
      
      console.log('FoundItemMatchCard: Answer verification resulted in untwin and status reset to posted');
    } else if (isCorrect) {
      // If answer is correct, update the item status to authenticated
      match.item.status = 'authenticated';
      
      // Force re-render to show the updated status
      setForceRender(prev => prev + 1);
      
      console.log('FoundItemMatchCard: Answer verification resulted in authenticated status');
    }
    
    // Update the last submitted answer status if it's the one being verified
    if (lastSubmittedAnswer && lastSubmittedAnswer._id === answerId) {
      setLastSubmittedAnswer(prev => ({
        ...prev,
        verified: true,
        isCorrect: isCorrect
      }));
    }
    
    // Update the status in userAnswers array too
    setUserAnswers(prev => 
      prev.map(answer => {
        if (answer._id === answerId) {
          return {
            ...answer,
            verified: true,
            isCorrect: isCorrect
          };
        }
        return answer;
      })
    );
    
    // Bubble up the verification event to parent components
    if (onVerificationComplete) {
      onVerificationComplete(isCorrect, answerId, untwinned, statusReset);
    }
  };

  // New function to render answer history
  const renderAnswerHistory = () => {
    if (!userAnswers.length) return null;

    return (
      <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700">Historique de vos réponses</h4>
          <button
            onClick={() => setShowAnswerHistory(!showAnswerHistory)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showAnswerHistory ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        {showAnswerHistory && (
          <div className="space-y-3 mt-2">
            {userAnswers.map((answer, index) => (
              <div 
                key={answer._id || index}
                className={`p-3 rounded border ${
                  !answer.verified 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : answer.isCorrect 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className={`text-xs font-medium ${
                    !answer.verified 
                      ? 'text-yellow-800' 
                      : answer.isCorrect 
                        ? 'text-green-800' 
                        : 'text-red-800'
                  }`}>
                    {!answer.verified 
                      ? 'En attente de vérification' 
                      : answer.isCorrect 
                        ? 'Correcte' 
                        : 'Incorrecte'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(answer.submittedAt || answer.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                  {answer.answer}
                </p>
              </div>
            ))}
          </div>
        )}
        {!showAnswerHistory && userAnswers.length > 0 && (
          <p className="text-xs text-gray-500">
            Vous avez soumis {userAnswers.length} réponse{userAnswers.length > 1 ? 's' : ''} pour cet objet.
            {userAnswers.some(a => !a.verified) && 
              ' Une réponse est en attente de vérification.'}
          </p>
        )}
      </div>
    );
  };

  // Improved renderAnswerStatus to ensure pending answers always display with highest priority
const renderAnswerStatus = () => {
  // PRIORITY OVERRIDE: Pending status always takes precedence
  const hasPendingAnswer = match.item.secretAnswers?.some(answer => 
    answer.user?._id === currentUser?._id && !answer.verified
  );
  
  if (hasPendingAnswer || answerStatus === 'pending') {
    // Get the user's pending answer
    const userAnswer = match.item.secretAnswers?.find(a => 
      a.user?._id === currentUser?._id && !a.verified
    );

    return (
      <div className="mt-4 bg-yellow-50 p-4 rounded-md border border-yellow-300">
        <div className="flex">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3 flex-grow">
            <h3 className="text-sm font-medium text-yellow-800">
              Votre réponse est en attente de vérification
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <div className="mb-2">
                Vous avez déjà soumis une réponse à la question secrète pour cet objet. 
                Le propriétaire vérifiera votre réponse.
              </div>
              {userAnswer && (
                <div className="bg-white p-3 rounded border border-yellow-200">
                  <p className="font-medium text-yellow-900">Question:</p>
                  <p className="mb-2 text-yellow-800">{match.item.secretQuestion?.question}</p>
                  <p className="font-medium text-yellow-900">Votre réponse:</p>
                  <p className="text-yellow-800">{userAnswer.answer}</p>
                  <p className="mt-2 text-xs text-yellow-600">
                    Soumise le {new Date(userAnswer.submittedAt || userAnswer.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
              {/* Show tracking information if user has multiple answers */}
              {userAnswers.length > 1 && (
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-yellow-700">
                    {userAnswers.length - 1} réponse{userAnswers.length > 2 ? 's' : ''} précédente{userAnswers.length > 2 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setShowAnswerHistory(!showAnswerHistory)}
                    className="text-xs text-yellow-800 hover:text-yellow-900 underline"
                  >
                    {showAnswerHistory ? 'Masquer l\'historique' : 'Voir l\'historique'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Proceed with other statuses only if no pending answer
  if (answerStatus === 'correct') {
    return (
      <div className="mt-4 bg-green-50 p-4 rounded-md border border-green-300">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Réponse correcte vérifiée</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Votre réponse à la question secrète a été vérifiée et confirmée comme correcte.</p>
            </div>
            {/* Show view history button if user has multiple answers */}
            {userAnswers.length > 1 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowAnswerHistory(!showAnswerHistory)}
                  className="text-xs text-green-800 hover:text-green-900 underline"
                >
                  {showAnswerHistory ? 'Masquer l\'historique' : 'Voir historique des réponses'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (answerStatus === 'incorrect') {
    // Find verified incorrect answers for current user
    const userIncorrectAnswers = match.item.secretAnswers?.filter(ans => {
      const isCurrentUser = ans.user?._id?.toString() === currentUser?._id?.toString();
      const isVerified = ans.verified === true;
      const isIncorrect = ans.isCorrect === false;
      
      return isCurrentUser && isVerified && isIncorrect;
    });

    // Get latest incorrect answer
    const latestAnswer = userIncorrectAnswers?.sort((a, b) => 
      new Date(b.submittedAt) - new Date(a.submittedAt)
    )[0];

    return (
      <div className="mt-4 bg-red-50 p-4 rounded-md border border-red-300">
        <div className="flex">
          <div className="flex-shrink-0">
            <XMarkIcon className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-grow">
            <h3 className="text-sm font-medium text-red-800">Réponse incorrecte</h3>
            <div className="mt-2 text-sm text-red-700">
              <div className="bg-white p-3 rounded border border-red-200">
                <p className="font-medium text-red-900">Question:</p>
                <p className="mb-2 text-red-800">{match.item.secretQuestion?.question}</p>
                <div className="mt-4">
                  <p className="font-medium text-red-900">Votre dernière réponse soumise:</p>
                  {latestAnswer ? (
                    <>
                      <div className="mt-1 text-red-800 whitespace-pre-wrap bg-red-50 p-2 rounded border border-red-200">
                        {latestAnswer.answer}
                      </div>
                      <div className="mt-2 text-xs text-red-600">
                        <p>Soumise le: {new Date(latestAnswer.submittedAt).toLocaleString()}</p>
                      </div>
                      {latestAnswer.message && (
                        <div className="mt-2 text-xs text-red-600">
                          <p className="font-medium">Raison du refus:</p>
                          <p>{latestAnswer.message}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="mt-1 text-red-800">Aucune réponse trouvée</p>
                  )}
                </div>
              </div>
              {/* Show tracking information if user has multiple answers */}
              {userAnswers.length > 1 && (
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-red-700">
                    Vous avez soumis {userAnswers.length} réponse{userAnswers.length > 1 ? 's' : ''} précédente{userAnswers.length > 2 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setShowAnswerHistory(!showAnswerHistory)}
                    className="text-xs text-red-800 hover:text-red-900 underline"
                  >
                    {showAnswerHistory ? 'Masquer l\'historique' : 'Voir l\'historique'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

  // New function to render last submitted answer status
  const renderLastSubmittedAnswerStatus = () => {
    if (!lastSubmittedAnswer) return null;
    
    const isVerified = lastSubmittedAnswer.verified === true;
    const isCorrect = lastSubmittedAnswer.isCorrect === true;
    const isPending = !isVerified;
    
    // Format the date
    const submittedDate = new Date(lastSubmittedAnswer.submittedAt || lastSubmittedAnswer.createdAt || new Date());
    const dateFormatted = submittedDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return (
      <div className={`mt-4 p-4 rounded-md ${
        isPending ? 'bg-yellow-50 border border-yellow-300' :
        isCorrect ? 'bg-green-50 border border-green-300' :
        'bg-red-50 border border-red-300'
      }`}>
        <h3 className="font-medium mb-2 flex items-center justify-between">
          <span className={`${
            isPending ? 'text-yellow-800' :
            isCorrect ? 'text-green-800' :
            'text-red-800'
          }`}>
            Dernière réponse soumise
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            isPending ? 'bg-yellow-100 text-yellow-800' :
            isCorrect ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {isPending ? 'En attente' :
            isCorrect ? 'Correcte' :
            'Incorrecte'}
          </span>
        </h3>
        
        <div className="bg-white p-3 rounded border whitespace-pre-wrap break-words text-sm mb-2 max-h-36 overflow-auto text-gray-800 italic">
          "{lastSubmittedAnswer.answer}"
        </div>
        
        <div className="flex justify-between items-center text-xs mt-1">
          <span className={`${
            isPending ? 'text-yellow-600' :
            isCorrect ? 'text-green-600' :
            'text-red-600'
          }`}>
            Soumise le {dateFormatted}
          </span>
          <button
            onClick={() => setShowAnswerHistory(!showAnswerHistory)}
            className={`underline ${
              isPending ? 'text-yellow-700 hover:text-yellow-900' :
              isCorrect ? 'text-green-700 hover:text-green-900' :
              'text-red-700 hover:text-red-900'
            }`}
          >
            {showAnswerHistory ? 'Masquer l\'historique' : 'Voir l\'historique'}
          </button>
        </div>
      </div>
    );
  };

  // Modified renderSecretQuestionContent to ensure the correct element is displayed and pending answers take priority
const renderSecretQuestionContent = () => {
  // Only show for found items where current user is not the reporter
  if (match.item.reportedBy?._id === currentUser?._id) {
    return null;
  }

  // CRITICAL FIX: Check for pending answers at the very beginning of the function
  const hasPendingAnswer = match.item.secretAnswers?.some(answer => 
    answer.user?._id === currentUser?._id && !answer.verified
  );

  // PRIORITY FIX: Pending answers ALWAYS take precedence over everything else
  if (hasPendingAnswer || answerStatus === 'pending') {
    console.log('Rendering pending answer status with HIGHEST priority');
    return (
      <>
        {renderAnswerStatus()}
        {userAnswers.length > 0 && renderAnswerHistory()}
      </>
    );
  }

  // For authenticated items, proceed with normal display
  if (match.item.status === 'authenticated') {
    // Check if user can claim based on correct answer
    const canUserClaim = match.item.secretAnswers?.some(answer => 
      answer.user?._id === currentUser?._id && 
      answer.verified === true && 
      answer.isCorrect === true
    );
    
    if (canUserClaim) {
      return (
        <>
          {answerStatus === 'correct' ? renderAnswerStatus() : (
            <div className="mt-4 bg-green-50 p-4 rounded-md border border-green-300">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Objet authentifié</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Cet objet a été authentifié. Vous pouvez maintenant payer les frais de réclamation pour le récupérer.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Add payment section */}
          {renderPaymentSection()}
          
          {/* Always show last submitted answer if it's not already shown and not a pending answer */}
          {lastSubmittedAnswer && !renderAnswerStatus() && renderLastSubmittedAnswerStatus()}
          
          {userAnswers.length > 0 && renderAnswerHistory()}
        </>
      );
    }
    
    // Original return for authenticated items when user can't claim
    return (
      <>
        {answerStatus === 'correct' ? renderAnswerStatus() : (
          <div className="mt-4 bg-green-50 p-4 rounded-md border border-green-300">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Objet authentifié</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Cet objet a été authentifié et est en cours de retour à son propriétaire.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Always show last submitted answer if it's not already shown and not a pending answer */}
        {lastSubmittedAnswer && !renderAnswerStatus() && renderLastSubmittedAnswerStatus()}
        
        {userAnswers.length > 0 && renderAnswerHistory()}
      </>
    );
  }

  // For secret question display
  if (shouldShowSecretQuestionForm) {
    return (
      <div className="mt-4">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-300 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <QuestionMarkCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Étape d'authentification</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Pour prouver que vous êtes bien le propriétaire de cet objet, veuillez répondre à la question secrète posée par la personne qui l'a trouvé.</p>
              </div>
              
              {/* Show previous attempts count if there are any */}
              {userAnswers.length > 0 && (
                <div className="mt-2 text-xs text-blue-600">
                  Vous avez déjà fait {userAnswers.length} tentative{userAnswers.length > 1 ? 's' : ''}.
                  <button
                    onClick={() => setShowAnswerHistory(!showAnswerHistory)}
                    className="ml-2 underline hover:text-blue-800"
                  >
                    {showAnswerHistory ? 'Masquer' : 'Voir l\'historique'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Only show incorrect status, never both incorrect and pending */}
        {answerStatus === 'incorrect' && renderAnswerStatus()}
        
        {/* Only show last submitted answer status if it's not already shown by renderAnswerStatus */}
        {lastSubmittedAnswer && 
         answerStatus !== 'pending' && 
         answerStatus !== 'incorrect' && 
         renderLastSubmittedAnswerStatus()}
        
        {userAnswers.length > 0 && showAnswerHistory && renderAnswerHistory()}
        {showSecretQuestion && renderSecretQuestionForm()}
      </div>
    );
  }

  // Default case with better status handling
  return (
    <>
      {/* First show any important status UI */}
      {answerStatus && renderAnswerStatus()}
      
      {/* If no status is shown but we have last submitted answer, show it */}
      {!answerStatus && lastSubmittedAnswer && renderLastSubmittedAnswerStatus()}
      
      {/* Show the form if needed */}
      {answerStatus === 'incorrect' && showSecretQuestion && 
       !hasPendingAnswer && renderSecretQuestionForm()}
      
      {!answerStatus && isTwinned && showSecretQuestion && 
       !forceHideFormCondition(match, currentUser, answerStatus) && 
       renderSecretQuestionForm()}
      
      {/* Only show verification component for found item reporters */}
      {(currentUser && match.item.type === 'found' && 
        match.item.reportedBy?._id === currentUser._id && 
        match.item.secretAnswers?.length > 0) && (
        <div className="mt-4">
          <SecretAnswerVerification 
            answers={match.item.secretAnswers}
            item={match.item}
            onVerificationComplete={handleSecretAnswerVerificationComplete}
          />
        </div>
      )}
      
      {/* Always show answer history if available */}
      {userAnswers.length > 0 && renderAnswerHistory()}
    </>
  );
};

  // Add new function to render payment section
  const renderPaymentSection = () => {
    if (!match.item.status === 'authenticated') return null;
    
    // If payment status is loading
    if (isLoadingPaymentStatus) {
      return (
        <div className="mt-4 bg-white p-4 rounded-md border border-gray-200 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-700">Chargement des informations de paiement...</span>
        </div>
      );
    }
    
    // If payment is already paid
    if (paymentStatus?.paid) {
      return (
        <div className="mt-4 bg-green-50 p-4 rounded-md border border-green-300">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Frais de réclamation payés</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Vous avez payé les frais de réclamation de {paymentStatus.amount} {paymentStatus.currency} le {new Date(paymentStatus.paidAt).toLocaleDateString('fr-FR')}.</p>
                <p className="mt-2">L'objet est maintenant en cours de restitution.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // If payment is required but not yet paid
    if (paymentStatus?.required && !paymentStatus?.paid) {
      return (
        <div className="mt-4 bg-white p-4 rounded-md border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <CreditCardIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3 flex-grow">
              <h3 className="text-sm font-medium text-gray-900">Frais de réclamation</h3>
              <div className="mt-2 text-sm text-gray-700">
                <p>Pour récupérer cet objet, des frais de réclamation de {paymentStatus.amount} {paymentStatus.currency} sont demandés.</p>
                <div className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Récapitulatif</h4>
                    <div className="flex justify-between text-sm">
                      <span>Frais de réclamation:</span>
                      <span className="font-medium">{paymentStatus.amount} {paymentStatus.currency}</span>
                    </div>
                  </div>
                </div>
                
                {/* Replace PayPal button with checkout redirect button */}
                <div className="mt-4">
                  <button
                    onClick={() => navigateToCheckout(match.item)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-150 ease-in-out flex justify-center items-center"
                  >
                    <CreditCardIcon className="h-5 w-5 mr-2" />
                    Payer les frais de réclamation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Add navigation function to redirect to checkout
  const navigateToCheckout = (item) => {
    // Make sure we have the proper item data
    if (!item || !item._id) {
      console.error('Cannot navigate to checkout: Invalid item data', item);
      toast.error('Impossible de procéder au paiement: données de l\'objet invalides');
      return;
    }
    
    console.log('Navigating to checkout with item:', item._id);
    
    // Create a clean object with just the necessary data
    const checkoutData = {
      id: item._id,
      title: item.title || 'Objet trouvé',
      reference: item.reference || itemReference || `REF-${item._id.substring(0, 8)}`,
      amount: paymentStatus?.amount || 3,
      currency: paymentStatus?.currency || 'EUR',
      status: item.status
    };
    
    console.log('Checkout data:', checkoutData);
    
    // Encode the data and redirect
    const encodedItem = encodeURIComponent(JSON.stringify(checkoutData));
    window.location.href = `/checkout?item=${encodedItem}`;
  };

  // Add the missing renderSecretQuestionForm function before renderSecretQuestionContent
const renderSecretQuestionForm = () => {
  return (
    <div className="mt-4 bg-white p-4 rounded-md border border-blue-200">
      <h3 className="text-sm font-medium text-blue-800 mb-2">
        Question secrète: {match.item.secretQuestion?.question || "Veuillez décrire cet objet avec des détails spécifiques que seul le propriétaire pourrait connaître"}
      </h3>
      <form onSubmit={handleSecretAnswerSubmit}>
        <div className="mt-2">
          <textarea
            value={secretAnswer}
            onChange={(e) => setSecretAnswer(e.target.value)}
            rows={4}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Votre réponse..."
            required
            minLength={10}
          />
        </div>
        {errorMessage && (
          <div className="mt-2 text-sm text-red-600">
            {errorMessage}
          </div>
        )}
        <div className="mt-3">
          <button
            type="submit"
            disabled={isSubmittingAnswer}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isSubmittingAnswer ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isSubmittingAnswer ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Envoi en cours...
              </>
            ) : (
              'Soumettre ma réponse'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

  // Ensure the untwin function properly passes twinState: false to the API

  // Render buttons for twin/untwin under the image - hide buttons instead of disabling them
  const renderActionButtons = () => (
    <div className="mt-3 flex justify-center gap-2">
      {/* Only show twin button if not already twinned */}
      {!isTwinned && (
        <button 
          onClick={handleTwinItems}
          disabled={isTwinning}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
            ${isTwinning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
        >
          {isTwinning ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Jumelage...
            </>
          ) : (
            'Jumeler cet objet'
          )}
        </button>
      )}

      {/* Only show untwin button if already twinned and user has permission */}
      {isTwinned && canUntwin && (
        <button
          onClick={handleUntwinItems}
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
            'Annuler le jumelage'
          )}
        </button>
      )}
    </div>
  );

  const fetchPaymentStatus = useCallback(async () => {
    if (!match?.item?._id || match.item.status !== 'authenticated') return;
    
    try {
      setIsLoadingPaymentStatus(true);
      const response = await itemsService.getItemPaymentStatus(match.item._id);
      
      if (response.success) {
        setPaymentStatus(response.paymentStatus);
        setShowPaymentButton(!response.paymentStatus.paid && response.paymentStatus.required);
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    } finally {
      setIsLoadingPaymentStatus(false);
    }
  }, [match?.item?._id, match?.item?.status]);

  useEffect(() => {
    if (match?.item?.status === 'authenticated') {
      fetchPaymentStatus();
    }
  }, [match?.item?.status, fetchPaymentStatus]);

  const handlePaymentSuccess = async (details) => {
    try {
      // Refresh payment status
      await fetchPaymentStatus();
      
      // Show success message
      toast.success('Paiement réussi. Vous pouvez maintenant récupérer votre objet.');
      
      // Update item status to returning if needed
      if (match.item.status === 'authenticated') {
        const response = await itemsService.markItemReturning(match.item._id);
        
        if (response.success) {
          if (onMatchedItemStatusUpdate) {
            onMatchedItemStatusUpdate(match.item._id, 'returning');
          }
          match.item.status = 'returning';
          setForceRender(prev => prev + 1);
        }
      }
      
      // Refresh notifications if callback available
      if (onNotificationRefresh) {
        await onNotificationRefresh();
      }
    } catch (error) {
      console.error('Error processing successful payment:', error);
      toast.error('Le paiement a été effectué mais une erreur est survenue lors de la mise à jour du statut de l\'objet.');
    }
  };

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

  // Format distance for display 
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

  // Remove the renderDistanceBadge function as it's not needed anymore

  return (
    <BaseMatchCard
      match={match}
      itemReference={itemReference || match.item.reference}
      showDetails={showDetails}
      setShowDetails={setShowDetails}
      forceRender={forceRender}
      renderActionButtons={renderActionButtons}
      renderHeaderExtras={renderHeaderExtras}
    >
      {renderSecretQuestionContent()}
    </BaseMatchCard>
  );
};

export default FoundItemMatchCard;