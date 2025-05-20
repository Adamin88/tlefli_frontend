import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  UserIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const userTypes = [
  {
    id: 'individual',
    title: 'Compte Personnel',
    description: 'Compte personnel pour signaler ou retrouver des objets perdus',
    icon: UserIcon
  },
  {
    id: 'business',
    title: 'Compte Professionnel',
    description: 'Gérez les objets perdus et trouvés pour votre organisation',
    icon: BuildingOfficeIcon
  }
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Register() {
  const navigate = useNavigate();
  const { googleAuth } = useAuth();
  const [selected, setSelected] = useState(userTypes[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    if (errorParam) {
      console.error('Auth error from URL:', errorParam, messageParam);
      
      let errorMessage = 'Une erreur est survenue lors de l\'inscription.';
      
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
          errorMessage = 'Authentification échouée. Veuillez réessayer.';
          break;
        case 'google_callback_failed':
          errorMessage = 'Échec de connexion avec Google. Problème de configuration de l\'authentification.';
          break;
        case 'user_not_found':
          // Don't show error for user_not_found since we're redirecting from login
          return; // Skip setting error message entirely
        default:
          errorMessage = `Erreur lors de l'inscription`;
      }
      
      // Add the specific message if available
      if (messageParam) {
        // Only in development, show the actual error message
        if (process.env.NODE_ENV === 'development') {
          errorMessage += ` (${messageParam})`;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [searchParams]);

  // Add useEffect to check for email parameter
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const emailParam = searchParams.get('email');
    
    if (errorParam === 'user_not_found' && emailParam) {
      // Use toast() instead of toast.info() which doesn't exist in react-hot-toast
      toast(`Veuillez créer un compte`, {
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
  }, [searchParams]);

  const handleGoogleAuth = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Use clean URL without any double slashes
      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      // Ensure there's no trailing slash in the base URL
      const cleanBaseUrl = apiBaseUrl.endsWith('/') 
        ? apiBaseUrl.slice(0, -1) 
        : apiBaseUrl;
      
      // Explicitly log the selected user type
      console.log('Registering with user type:', selected.id);
      
      // Add action=register to indicate this is a registration attempt
      const googleAuthUrl = `${cleanBaseUrl}/auth/google?userType=${encodeURIComponent(selected.id)}&action=register`;
      
      console.log('Redirecting to Google auth for registration:', googleAuthUrl);
      
      // Open Google sign-in in the same window for better cookie handling
      window.location.href = googleAuthUrl;
    } catch (err) {
      console.error('Google authentication error:', err);
      setError('Échec de la connexion avec Google. Veuillez réessayer.');
      toast.error('Échec de la connexion avec Google. Veuillez réessayer.', {
        duration: 4000,
        position: 'top-center'
      });
    } finally {
      setIsLoading(false);
    }
  }, [selected.id, adBlockerDetected]);

  // Helper function to handle step progression
  const goToNextStep = () => {
    // Only proceed if a user type is selected
    if (selected) {
      setCurrentStep(2);
    } else {
      toast.error("Veuillez sélectionner un type de compte pour continuer");
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // New animation for the page transitions
  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  // Hover animation for cards
  const cardHover = {
    scale: 1.03,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { duration: 0.3 }
  };

  // Add new animation constants
  const progressVariants = {
    inactive: { scale: 0.9, opacity: 0.5 },
    active: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    completed: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 flex items-center justify-center p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl w-full h-[calc(100vh-2rem)] max-h-[900px] bg-white shadow-2xl rounded-3xl flex flex-col md:flex-row overflow-hidden relative"
      >
        {/* Enhanced decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 z-10"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-400 z-10"></div>
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-300 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-1/4 right-10 w-20 h-20 bg-blue-100 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute bottom-1/3 left-10 w-16 h-16 bg-red-100 rounded-full opacity-10 blur-xl"></div>
        
        {/* Home Button with better positioning and feedback */}
        <Link
          to="/"
          className="absolute top-4 left-4 z-20 bg-white hover:bg-yellow-50 p-2 rounded-full 
                   transition-all duration-300 ease-in-out flex items-center justify-center 
                   shadow-md hover:shadow-lg text-yellow-600 border border-transparent hover:border-yellow-200"
        >
          <HomeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Accueil</span>
        </Link>

        {/* New Enhanced Progress Steps Indicator (visible on both mobile and desktop) */}
        <div className="absolute top-6 left-0 right-0 z-20 mx-auto flex justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-3 border border-yellow-100 pointer-events-auto"
            style={{ width: 'min(90%, 320px)' }}
          >
            <div className="flex justify-between items-center relative">
              {/* Progress Line */}
              <div className="absolute h-0.5 inset-x-0 top-1/2 transform -translate-y-1/2 bg-gray-200"></div>
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: currentStep >= 2 ? "100%" : "0%" }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute h-1 inset-x-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full z-0"
              ></motion.div>
              
              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center px-2">
                <motion.div 
                  variants={progressVariants}
                  initial="inactive"
                  animate={currentStep >= 1 ? "completed" : "inactive"}
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center justify-center h-10 w-10 rounded-full 
                    ${currentStep >= 1 
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 shadow-md shadow-yellow-300/40' 
                      : 'bg-white border-2 border-gray-200'}`}
                >
                  {currentStep > 1 ? (
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  ) : (
                    <span className={`font-bold ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>1</span>
                  )}
                </motion.div>
                <p className={`mt-1.5 text-xs font-medium leading-none text-center ${currentStep >= 1 ? 'text-gray-700' : 'text-gray-500'}`}>
                  Type de<br/>compte
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center px-2">
                <motion.div 
                  variants={progressVariants}
                  initial="inactive"
                  animate={currentStep >= 2 ? "active" : "inactive"}
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center justify-center h-10 w-10 rounded-full 
                    ${currentStep >= 2 
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 shadow-md shadow-yellow-300/40' 
                      : 'bg-white border-2 border-gray-200'}`}
                >
                  <span className={`font-bold ${currentStep >= 2 ? 'text-white' : 'text-gray-500'}`}>2</span>
                </motion.div>
                <p className={`mt-1.5 text-xs font-medium leading-none text-center ${currentStep >= 2 ? 'text-gray-700' : 'text-gray-500'}`}>
                  Connexion
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Left Column: Redesigned with better flow */}
        <div className="hidden md:flex flex-col w-1/2 bg-gradient-to-b from-yellow-50 to-white justify-start items-center overflow-hidden">
          {/* Logo and header area with fixed height */}
          <div className="w-full pt-28 pb-6 px-5 flex flex-col items-center">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 -m-2 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-100 opacity-30 blur-md"></div>
              <img
                src="./TlefliLogo.webp"
                alt="TLEFLI Logo"
                className="h-16 relative z-10 w-auto max-w-full rounded-full shadow-md border-2 border-white"
              />
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-4 text-center text-lg md:text-xl font-bold text-gray-800"
            >
              <span className="bg-gradient-to-r from-yellow-700 to-yellow-500 bg-clip-text text-transparent">
                Créez votre compte
              </span>
            </motion.h2>
          </div>

          {/* Dynamic content area based on step */}
          <div className="flex-1 w-full overflow-hidden flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {currentStep === 1 ? (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible" 
                  className="w-full space-y-4"
                >
                  <motion.p
                    variants={itemVariants}
                    className="text-center text-gray-600 text-sm mb-6"
                  >
                    Veuillez sélectionner le type de compte qui correspond le mieux à vos besoins
                  </motion.p>
                  
                  <div className="space-y-3.5 transform scale-[0.98]">
                    {userTypes.map((type) => (
                      <motion.button
                        key={type.id}
                        variants={itemVariants}
                        whileHover={{
                          scale: 1.02,
                          boxShadow: "0 10px 15px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelected(type)}
                        className={`
                          w-full flex items-center p-4 rounded-xl transition-all duration-300
                          ${selected.id === type.id
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-white shadow-lg'
                            : 'bg-white text-gray-700 border border-gray-100 hover:border-yellow-200'}
                          group
                        `}
                      >
                        <div className={`p-2.5 rounded-xl mr-3 ${
                          selected.id === type.id 
                            ? 'bg-white/20' 
                            : 'bg-yellow-50 group-hover:bg-yellow-100'
                        }`}>
                          <type.icon className={`h-6 w-6 ${
                            selected.id === type.id ? 'text-white' : 'text-yellow-500'
                          }`} />
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="font-bold text-base">{type.title}</h3>
                          <p className={`text-xs ${selected.id === type.id ? 'text-white/90' : 'text-gray-500'}`}>
                            {type.description}
                          </p>
                        </div>
                        <div className="ml-2">
                          {selected.id === type.id ? (
                            <motion.div 
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                            >
                              <CheckCircleIcon className="h-5 w-5 text-white" />
                            </motion.div>
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-200 group-hover:border-yellow-300"></div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  
                  <motion.div 
                    variants={itemVariants}
                    className="flex justify-center mt-8"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={goToNextStep}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500
                               text-white px-6 py-2.5 rounded-full 
                               flex items-center shadow-lg hover:shadow-xl transition-all duration-300
                               focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                    >
                      <span className="font-medium text-sm">Continuer</span>
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </motion.button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full space-y-5 transform scale-[0.98]"
                >
                  <p className="text-center text-gray-600 text-sm">
                    Vous êtes sur le point de créer un compte :
                  </p>
                  
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-4 rounded-xl shadow-md border-l-4 border-yellow-500"
                  >
                    <div className="flex items-center">
                      <div className="p-2.5 bg-yellow-50 rounded-xl mr-4">
                        <selected.icon className="h-8 w-8 text-yellow-500" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-800">{selected.title}</h3>
                        <p className="text-xs text-gray-600">{selected.description}</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <div className="text-center flex justify-center mt-4">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setCurrentStep(1)}
                      className="bg-white hover:bg-gray-50 text-yellow-600 hover:text-yellow-700 px-4 py-1.5 rounded-full text-sm
                              border border-gray-200 hover:border-yellow-200 inline-flex items-center
                              shadow-sm hover:shadow transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Modifier mon choix
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center py-3 w-full bg-gray-50 bg-opacity-50 border-t border-gray-100"
            >
              <p className="text-xs text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link
                  to="/login"
                  className="font-medium text-yellow-600 hover:text-yellow-500 transition duration-300"
                >
                  Se connecter
                </Link>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right Column: Redesigned with better content flow - centered content */}
        <div className="w-full md:w-1/2 flex flex-col justify-between h-full overflow-hidden bg-gradient-to-b from-white to-gray-50">
          {/* Mobile content for first view - better positioning for mobile */}
          <div className="md:hidden pt-28 px-4 flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative mb-4"
            >
              <div className="absolute inset-0 -m-2 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-100 opacity-30 blur-md"></div>
              <img
                src="./TlefliLogo.webp"
                alt="TLEFLI Logo"
                className="h-14 w-auto max-w-full rounded-full shadow-md border-2 border-white relative z-10"
              />
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-center text-lg font-bold text-gray-800 mb-1"
            >
              <span className="bg-gradient-to-r from-yellow-700 to-yellow-500 bg-clip-text text-transparent">
                Créez votre compte
              </span>
            </motion.h2>
          </div>
          
          {/* Main content area - centered with flex */}
          <div className="flex-1 overflow-hidden flex flex-col justify-center items-center mt-4 md:mt-0">
            <div className="w-full max-w-md px-4 md:px-8">
              {/* Mobile steps display */}
              <div className="md:hidden flex-shrink-0">
                {currentStep === 1 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="overflow-hidden"
                  >
                    <p className="text-center text-gray-600 text-xs mb-4">
                      Veuillez sélectionner le type de compte qui correspond le mieux à vos besoins
                    </p>
                    <div className="space-y-2.5 transform scale-[0.98]">
                      {userTypes.map((type) => (
                        <motion.button
                          key={type.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelected(type)}
                          className={`
                            w-full flex items-center p-3 rounded-xl transition-all duration-300
                            ${selected.id === type.id
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-white shadow-md'
                              : 'bg-white text-gray-700 border border-gray-100 hover:border-yellow-200'}
                            group
                          `}
                        >
                          <div className={`p-2 rounded-lg mr-3 ${
                            selected.id === type.id 
                              ? 'bg-white/20' 
                              : 'bg-yellow-50 group-hover:bg-yellow-100'
                          }`}>
                            <type.icon className={`h-5 w-5 ${
                              selected.id === type.id ? 'text-white' : 'text-yellow-500'
                            }`} />
                          </div>
                          <div className="text-left flex-1">
                            <h3 className="font-semibold text-sm">{type.title}</h3>
                            <p className={`text-xs ${selected.id === type.id ? 'text-white/90' : 'text-gray-500'}`}>
                              {type.description}
                            </p>
                          </div>
                          <div className="ml-2">
                            {selected.id === type.id ? (
                              <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 500 }}
                              >
                                <CheckCircleIcon className="h-4 w-4 text-white" />
                              </motion.div>
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-gray-200 group-hover:border-yellow-300"></div>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex justify-center mt-5">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={goToNextStep}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500
                                text-white px-5 py-2 
                                rounded-full flex items-center shadow-md hover:shadow-lg transition-all duration-300
                                focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                      >
                        <span className="font-medium text-sm">Continuer</span>
                        <ArrowRightIcon className="h-4 w-4 ml-1" />
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-4 transform scale-[0.98]"
                  >
                    <p className="text-center text-gray-600 text-xs mb-3">
                      Vous êtes sur le point de créer un compte :
                    </p>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="bg-white p-3 rounded-xl shadow-sm border-l-4 border-yellow-500 mb-4"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-50 rounded-lg mr-3">
                          <selected.icon className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{selected.title}</h3>
                          <p className="text-xs text-gray-600">{selected.description}</p>
                        </div>
                      </div>
                    </motion.div>
                    <div className="text-center">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setCurrentStep(1)}
                        className="bg-white hover:bg-gray-50 text-yellow-600 hover:text-yellow-700 px-3 py-1 rounded-full text-xs
                                border border-gray-200 hover:border-yellow-200 inline-flex items-center
                                shadow-sm hover:shadow transition-all duration-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Modifier mon choix
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Step 2 content - Sign in with Google (both mobile and desktop) */}
              {/* Modified: Only show when in step 2, for both mobile and desktop */}
              {currentStep === 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="py-4 flex-1 flex flex-col mx-auto w-full overflow-hidden"
                >
                  {/* Error Handling */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-4 bg-red-50 border-l-3 border-red-400 rounded-lg p-3 flex items-start"
                      role="alert"
                      aria-live="assertive"
                    >
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-700">{error}</p>
                    </motion.div>
                  )}

                  {/* Title section centered */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                  >
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-1 bg-gradient-to-r from-yellow-700 to-yellow-500 bg-clip-text text-transparent">
                      Connexion avec Google
                    </h3>
                    <p className="text-gray-600 text-xs md:text-sm">
                      Utilisez votre compte Google pour créer votre compte en toute sécurité
                    </p>
                  </motion.div>

                  {/* Security notice with improved style */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-5 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 flex items-center"
                  >
                    <div className="bg-white p-1.5 rounded-full mr-2.5 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-blue-800 text-xs font-medium">
                      Pour votre sécurité, TLEFLI utilise uniquement l'authentification Google.
                    </p>
                  </motion.div>

                  {/* Google Sign-In Button - Enhanced with modern style */}
                  <div className="mt-8 mb-4">
                    <motion.div 
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full"
                    >
                      <button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center py-3.5 px-5 
                              rounded-xl text-sm font-medium text-gray-700 bg-white 
                              border border-gray-200 hover:border-yellow-300
                              focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2
                              transition-all duration-300 shadow-lg hover:shadow-xl
                              relative overflow-hidden group"
                      >
                        <span className="absolute inset-0 w-0 bg-gradient-to-r from-yellow-50 to-yellow-100 transition-all duration-500 ease-out group-hover:w-full"></span>
                        <span className="absolute -inset-1 scale-x-0 rounded-xl border border-yellow-300 transition-transform duration-500 group-hover:scale-x-100 group-hover:scale-y-100 pointer-events-none"></span>
                        
                        {isLoading ? (
                          <div className="flex items-center relative z-10">
                            <svg className="animate-spin h-4 w-4 mr-2 text-yellow-500" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Connexion en cours...</span>
                          </div>
                        ) : (
                          <div className="flex items-center relative z-10">
                            <div className="bg-white p-1.5 rounded-full shadow-sm mr-3 group-hover:shadow-md transition-all duration-300">
                              <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                            </div>
                            <span className="text-sm font-medium group-hover:text-gray-900 transition-colors duration-300">
                              S'inscrire avec Google
                            </span>
                          </div>
                        )}
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          
          {/* Unified footer with better styling for legal info */}
          <div className="bg-gray-50 p-3 border-t border-gray-100 flex flex-col items-center">
            <div className="text-center text-xs text-gray-500">
              <p>En continuant, vous acceptez les Conditions d'utilisation de TLEFLI</p>
              <div className="mt-1 mb-2">
                <Link
                  to="/conditions"
                  className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-medium transition duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Conditions d'utilisation
                </Link>
              </div>
            </div>
            
            {/* Mobile-only login link */}
            <div className="md:hidden text-center">
              <p className="text-xs text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link
                  to="/login"
                  className="font-medium text-yellow-600 hover:text-yellow-500 transition duration-300"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
