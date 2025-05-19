import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

const SessionTimeoutHandler = () => {
  const { logout } = useAuth();
  const [sessionValid, setSessionValid] = useState(true);

  // COMPONENT DISABLED - Will be re-enabled when project is finished
  // Remove this comment and uncomment the useEffect below when ready to use
  
  /*
  useEffect(() => {
    const checkSession = async () => {
      try {
        const isValid = await authService.validateSession();
        setSessionValid(isValid);
        
        if (!isValid) {
          console.log('Session expired, logging out');
          logout();
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // On error, we assume session is invalid
        setSessionValid(false);
        logout();
      }
    };

    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);
    
    // Initial check
    checkSession();
    
    return () => clearInterval(interval);
  }, [logout]);
  */

  // Component disabled for development
  console.log('SessionTimeoutHandler is currently disabled');
  
  return null; // This component doesn't render anything
};

export default SessionTimeoutHandler;
