import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon,
  ExclamationCircleIcon,
  LockClosedIcon
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);
  const [searchParams] = useSearchParams();

  const { user, isAuthenticated, refreshAuth } = useAuth();
  const navigate = useNavigate();

  // Add this ref to prevent multiple refreshes
  const hasRefreshed = useRef(false);

  // Ensure auth state is fresh when component mounts
  useEffect(() => {
    // Only refresh auth once when component mounts and not already refreshing
    if (!hasRefreshed.current && !isLoading) {
      hasRefreshed.current = true;
      console.log('Login page - Initial auth check');
      // Use a timeout to avoid rapid repeated calls
      setTimeout(() => {
        refreshAuth();
      }, 500); // Small delay to allow other operations to complete
    }
    
    // Clean up function to reset the ref when component unmounts
    return () => {
      hasRefreshed.current = false;
    };
  }, [refreshAuth, isLoading]); // Add isLoading dependency

  // Check if user is already authenticated and redirect only once
  useEffect(() => {
    console.log('Login page - Auth state changed:', isAuthenticated, user);
    
    if (isAuthenticated && user && !redirecting) {
      console.log('User already authenticated, redirecting to dashboard');
      setRedirecting(true);
      
      // Use setTimeout to prevent rapid navigation issues
      const redirectTimer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 300); // Increased timeout to avoid navigation throttling
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, user, navigate, redirecting]);

  // Parse error from URL if present
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    if (errorParam) {
      console.error('Auth error from URL:', errorParam, messageParam);
      
      let errorMessage = 'Une erreur est survenue lors de la connexion.';
      
      // Map specific error codes to user-friendly messages
      switch (errorParam) {
        case 'google_auth_failed':
          errorMessage = 'Échec de la connexion avec Google. Veuillez réessayer.';
          break;
        case 'google_error':
          errorMessage = 'Google a refusé la demande d\'authentification.';
          break;
        case 'no_auth_code':
          errorMessage = 'Connexion Google annulée. Veuillez réessayer.';
          break;
        case 'token_exchange_failed':
          errorMessage = 'Problème avec les informations d\'identification Google.';
          break;
        case 'token_verification_failed':
          errorMessage = 'Échec de vérification des informations Google.';
          break;
        case 'auth_failed':
          // Check for "User not found" message and redirect to register
          if (messageParam && messageParam.includes('User not found')) {
            console.log('User not found, redirecting to register page');
            // Use toast instead of toast.info
            toast('Compte non trouvé. Redirection vers la page d\'inscription...', {
              icon: '🔔',
              style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
              },
            });
            
            // Redirect after a short delay to allow the toast to be seen
            setTimeout(() => {
              navigate('/register');
            }, 2000);
            return; // Skip setting error message
          }
          errorMessage = 'Authentification échouée. Veuillez réessayer.';
          break;
        case 'google_callback_failed':
          errorMessage = 'Échec de connexion avec Google. Problème de configuration de l\'authentification.';
          break;
        default:
          errorMessage = `Erreur de connexion: ${errorParam}`;
      }
      
      // Add the specific message if available
      if (messageParam) {
        console.log('Error details:', messageParam);
        // Only in development, show the actual error message
        if (process.env.NODE_ENV === 'development') {
          errorMessage += ` (${messageParam})`;
        }
      }
      
      setError(errorMessage);
    }
  }, [searchParams, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Add a query parameter to indicate this is a login attempt, not registration
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const cleanBaseUrl = apiBaseUrl.endsWith('/') 
        ? apiBaseUrl.slice(0, -1) 
        : apiBaseUrl;
      
      const googleAuthUrl = `${cleanBaseUrl}/auth/google?action=login`;
      console.log('Redirecting to Google auth URL for login:', googleAuthUrl);
      
      // Open in current window for better cookie handling
      window.location.href = googleAuthUrl;
    } catch (err) {
      console.error('Google login error:', err);
      setError('Échec de la connexion avec Google. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // If already redirecting, show a loading state
  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white p-8 rounded-2xl shadow-xl"
        >
          <div className="relative h-20 w-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-yellow-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300"></div>
            <img 
              src="./TlefliLogo.webp" 
              alt="TLEFLI Logo"
              className="absolute inset-5 rounded-full object-cover"
            />
          </div>
          <h3 className="mt-6 text-gray-800 font-bold text-lg">Connexion réussie !</h3>
          <p className="mt-2 text-gray-600">Redirection vers votre tableau de bord...</p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2 }}
              className="bg-yellow-500 h-1.5 rounded-full"
            ></motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4 overflow-hidden">
      {/* Home Button */}
      <Link
        to="/"
        className="absolute top-4 left-4 z-10 bg-white hover:bg-yellow-50 p-2 rounded-full 
                 transition-all duration-300 ease-in-out flex items-center justify-center 
                 shadow-md hover:shadow-lg text-yellow-600"
      >
        <HomeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="sr-only">Accueil</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full h-[calc(100vh-2rem)] max-h-[600px] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col"
      >
        {/* Decorative top banner */}
        <div className="h-3 bg-gradient-to-r from-yellow-400 to-yellow-300 flex-shrink-0"></div>
        
        <div className="flex-grow flex flex-col overflow-hidden">
          {/* Main content - scrollable if needed */}
          <div className="px-5 py-4 flex-grow flex flex-col">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex justify-center mb-4"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full blur-md opacity-70"></div>
                <img
                  src="./TlefliLogo.webp"
                  alt="TLEFLI Logo"
                  className="h-16 w-auto max-w-full rounded-full shadow-lg relative z-10 border-4 border-white"
                />
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-center"
            >
              <h2 className="text-xl font-bold text-gray-800 bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent">
                Connexion à votre compte
              </h2>
              <p className="mt-1 text-center text-gray-600 text-xs">
                Accédez à votre espace TLEFLI en toute sécurité
              </p>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mt-1 text-center text-xs text-gray-600"
              >
                Ou{' '}
                <Link
                  to="/register"
                  className="font-medium text-yellow-600 hover:text-yellow-500 transition duration-300 underline"
                >
                  créer un nouveau compte
                </Link>
              </motion.p>
            </motion.div>

            {/* Error message area */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-2 rounded-lg bg-red-50 text-red-700 text-xs border-l-3 border-red-400 flex items-start"
                role="alert"
                aria-live="assertive"
              >
                <ExclamationCircleIcon className="h-4 w-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
              
            {/* Security section */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200 p-3 shadow-sm"
            >
              <div className="flex items-center justify-center mb-1">
                <LockClosedIcon className="h-4 w-4 text-yellow-600 mr-1.5" />
                <h3 className="font-semibold text-yellow-800 text-xs">Connexion sécurisée</h3>
              </div>
              <p className="text-xs text-gray-700 text-center">
                Connectez-vous rapidement et en toute sécurité avec Google
              </p>
            </motion.div>
            
            <div className="mt-2 mb-3">
              <p className="text-yellow-700 text-xs font-medium flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                TLEFLI utilise uniquement l'authentification Google
              </p>
            </div>
            
            {/* Google Sign-In Button - centered vertically in remaining space */}
            <div className="flex-grow flex items-center justify-center">
              <motion.div 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full transform scale-[0.98]"
              >
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3 px-5 
                         rounded-xl text-sm font-medium text-gray-700 
                         bg-white hover:bg-gray-50 focus:outline-none 
                         shadow-lg hover:shadow-xl transition-all duration-300
                         border border-gray-300 hover:border-yellow-300
                         relative overflow-hidden group"
                >
                  <span className="absolute inset-0 w-0 bg-gradient-to-r from-yellow-50 to-yellow-100 transition-all duration-500 ease-out group-hover:w-full"></span>
                  
                  {isLoading ? (
                    <div className="flex items-center relative z-10">
                      <svg className="animate-spin h-4 w-4 mr-2 text-yellow-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm">Connexion en cours...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2 relative z-10" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span className="text-sm relative z-10">Se connecter avec Google</span>
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </div>
          
          {/* Registration Link and Legal Footer */}
          <div className="mt-auto bg-gray-50 bg-opacity-70 p-2 w-full text-center text-xs text-gray-500">
            <p>
              Pas encore de compte ?{' '}
              <Link
                to="/register"
                className="font-medium text-yellow-600 hover:text-yellow-500 transition duration-300"
              >
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
        
        {/* Decorative footer */}
        <div className="h-2 bg-gradient-to-r from-yellow-300 to-yellow-400 flex-shrink-0"></div>
      </motion.div>
    </div>
  );
}

export default Login;
