import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      try {
        // Check if session is valid
        const isValid = await authService.validateSession();
        setSessionValid(isValid);
      } catch (error) {
        console.error('Error validating session:', error);
        setSessionValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
  }, [location.pathname]);

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !sessionValid) {
    // Redirect them to the login page with a return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin access is required but user is not an admin
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
