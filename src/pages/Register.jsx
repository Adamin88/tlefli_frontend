import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  UserIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

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
  const [searchParams] = useSearchParams();
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  // Email registration states
  const [emailFormData, setEmailFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Add OTP verification states
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [emailVerificationData, setEmailVerificationData] = useState({
    otp: '',
    userId: '',
    email: ''
  });
  const [isVerifyingEmailOTP, setIsVerifyingEmailOTP] = useState(false);
  const [canResendEmailOTP, setCanResendEmailOTP] = useState(false);
  const [emailResendTimer, setEmailResendTimer] = useState(60);
  const [emailOtpValidation, setEmailOtpValidation] = useState({
    isValid: false,
    isInvalid: false,
    showSuccess: false
  });

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
  }, [selected.id]);

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  // Handle email form changes
  const handleEmailFormChange = (e) => {
    const { name, value } = e.target;
    setEmailFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  // Enhanced OTP input with real-time validation for email verification
  const handleEmailOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setEmailVerificationData(prev => ({ ...prev, otp: value }));
    
    // Real-time validation
    if (value.length === 6) {
      setEmailOtpValidation({
        isValid: true,
        isInvalid: false,
        showSuccess: false
      });
    } else if (value.length > 0) {
      setEmailOtpValidation({
        isValid: false,
        isInvalid: false,
        showSuccess: false
      });
    } else {
      setEmailOtpValidation({
        isValid: false,
        isInvalid: false,
        showSuccess: false
      });
    }
  };

  // Handle email verification OTP
  const handleEmailVerification = async (e) => {
    e.preventDefault();
    setIsVerifyingEmailOTP(true);
    setError('');

    try {
      if (!emailVerificationData.otp || emailVerificationData.otp.length !== 6) {
        throw new Error('Veuillez entrer un code OTP valide de 6 chiffres');
      }

      if (!emailVerificationData.userId) {
        throw new Error('Erreur: ID utilisateur manquant. Veuillez recommencer l\'inscription.');
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      const cleanBaseUrl = apiBaseUrl.endsWith('/') 
        ? apiBaseUrl.slice(0, -1) 
        : apiBaseUrl;

      // Debug logging
      console.log('Verification data:', {
        userId: emailVerificationData.userId,
        otp: emailVerificationData.otp,
        email: emailVerificationData.email
      });

      const response = await fetch(`${cleanBaseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: emailVerificationData.userId,
          otp: emailVerificationData.otp
        }),
      });

      const data = await response.json();
      console.log('Verification response:', data);

      if (data.success) {
        setEmailOtpValidation({
          isValid: true,
          isInvalid: false,
          showSuccess: true
        });
        
        toast.success('Email vérifié avec succès !');
        
        // Navigate to profile completion after successful verification
        setTimeout(() => {
          if (selected.id === 'business') {
            navigate('/complete-business-profile');
          } else {
            navigate('/complete-profile');
          }
        }, 1000);
      } else {
        setEmailOtpValidation({
          isValid: false,
          isInvalid: true,
          showSuccess: false
        });
        throw new Error(data.message || 'Code OTP invalide');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setError(error.message);
      setEmailOtpValidation({
        isValid: false,
        isInvalid: true,
        showSuccess: false
      });
      toast.error(error.message);
    } finally {
      setIsVerifyingEmailOTP(false);
    }
  };

  // Resend email verification OTP
  const handleResendEmailVerification = async () => {
    try {
      if (!emailVerificationData.userId) {
        throw new Error('Erreur: ID utilisateur manquant. Veuillez recommencer l\'inscription.');
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      const cleanBaseUrl = apiBaseUrl.endsWith('/') 
        ? apiBaseUrl.slice(0, -1) 
        : apiBaseUrl;

      console.log('Resending OTP for userId:', emailVerificationData.userId);

      const response = await fetch(`${cleanBaseUrl}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: emailVerificationData.userId
        }),
      });

      const data = await response.json();
      console.log('Resend response:', data);

      if (data.success) {
        toast.success('Code de vérification renvoyé !');
        setCanResendEmailOTP(false);
        startEmailResendTimer();
      } else {
        throw new Error(data.message || 'Erreur lors du renvoi du code');
      }
    } catch (error) {
      console.error('Resend email verification error:', error);
      toast.error(error.message);
    }
  };

  // Timer for resend email OTP
  const startEmailResendTimer = () => {
    setEmailResendTimer(60);
    const timer = setInterval(() => {
      setEmailResendTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(timer);
          setCanResendEmailOTP(true);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  // Email registration
  const handleEmailRegistration = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validation
      if (!emailFormData.email || !emailFormData.password || !emailFormData.confirmPassword) {
        throw new Error('Veuillez remplir tous les champs');
      }

      if (emailFormData.password !== emailFormData.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      if (emailFormData.password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }

      // Use the same API base URL logic as Google auth
      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      const cleanBaseUrl = apiBaseUrl.endsWith('/') 
        ? apiBaseUrl.slice(0, -1) 
        : apiBaseUrl;

      const response = await fetch(`${cleanBaseUrl}/auth/register-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailFormData.email,
          password: emailFormData.password,
          userType: selected.id
        }),
      });

      const data = await response.json();
      console.log('Registration response:', data);
      console.log('Response structure:', {
        success: data.success,
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : 'no data object',
        directUserId: data.userId,
        nestedUserId: data.data?.userId
      });

      if (data.success) {
        // Show success message for registration
        toast.success('Inscription réussie ! Vérifiez votre email.');
        
        // Extract userId from nested data object (backend returns data.data.userId)
        const userId = data.data?.userId || data.userId;
        if (!userId) {
          console.error('Backend response:', data);
          throw new Error('Erreur: Aucun ID utilisateur reçu du serveur');
        }
        
        // Set up email verification data
        setEmailVerificationData({
          otp: '',
          userId: userId,
          email: emailFormData.email
        });
        
        console.log('Email verification data set:', {
          userId: userId,
          email: emailFormData.email
        });
        
        // Hide the registration form and show OTP verification
        setShowEmailForm(false);
        setShowEmailVerification(true);
        
        // Start the resend timer
        startEmailResendTimer();
      } else {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Email registration error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

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

      <div className="max-w-md w-full h-[calc(100vh-2rem)] max-h-[700px] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
        {/* Decorative top banner */}
        <div className="h-3 bg-gradient-to-r from-yellow-400 to-yellow-300 flex-shrink-0"></div>
        
        <div className="flex-grow flex flex-col overflow-hidden">
          {/* Main content - scrollable if needed */}
          <div className="px-5 py-4 flex-grow flex flex-col overflow-y-auto">
            {/* Logo and header */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full blur-md opacity-70"></div>
                <img
                  src="./TlefliLogo.webp"
                  alt="TLEFLI Logo"
                  className="h-10 w-auto max-w-full rounded-full shadow-lg relative z-10 border-4 border-white"
                />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                <span className="bg-gradient-to-r from-yellow-700 to-yellow-500 bg-clip-text text-transparent">
                  Créez votre compte
                </span>
              </h2>
              
              <p className="mt-2 text-sm text-gray-600">
                Rejoignez TLEFLI pour retrouver vos objets perdus
              </p>
            </div>

            {/* Account Type Selection */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Type de compte</h3>
              <div className="space-y-2">
                {userTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelected(type)}
                    className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 ${
                      selected.id === type.id
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-100 hover:border-yellow-200 shadow-sm'
                    } group`}
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
                      <h4 className="font-medium text-sm">{type.title}</h4>
                      <p className={`text-xs ${selected.id === type.id ? 'text-white/90' : 'text-gray-500'}`}>
                        {type.description}
                      </p>
                    </div>
                    <div className="ml-2">
                      {selected.id === type.id ? (
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-200 group-hover:border-yellow-300"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Registration Methods */}
            {!showEmailVerification && (
              <div className="space-y-3 mb-4">
                <h3 className="text-base font-semibold text-gray-800">Méthode d'inscription</h3>
                
                {!showEmailForm && (
                  <>
                    <p className="text-center text-gray-600 text-sm mb-3">
                      Choisissez votre méthode d'inscription :
                    </p>
                    
                    {/* Google Registration - Same style as Login */}
                    <button
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center py-3 px-5 
                             rounded-xl text-sm font-medium text-gray-700 
                             bg-white hover:bg-gray-50 focus:outline-none 
                             shadow-lg hover:shadow-xl transition-all duration-300
                             border border-gray-300 hover:border-yellow-300
                             relative overflow-hidden group disabled:opacity-50"
                    >
                      <span className="absolute inset-0 w-0 bg-gradient-to-r from-yellow-50 to-yellow-100 transition-all duration-500 ease-out group-hover:w-full"></span>
                      
                      <svg className="h-5 w-5 mr-2 relative z-10" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span className="text-sm relative z-10">S'inscrire avec Google</span>
                    </button>
                  </>
                )}

                {/* Email Registration - Same style as Login */}
                <button
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  className="w-full flex items-center justify-center py-3 px-5 
                         rounded-xl text-sm font-medium text-white
                         bg-yellow-600 hover:bg-yellow-700 focus:outline-none 
                         shadow-lg hover:shadow-xl transition-all duration-300
                         border border-yellow-600"
                >
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  <span className="text-sm">
                    {showEmailForm ? "Revenir aux options" : "S'inscrire avec Email"}
                  </span>
                </button>

                {/* Security notice - only show when not in email form */}
                {!showEmailForm && (
                  <div className="mt-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200 p-3 shadow-sm">
                    <div className="flex items-center justify-center mb-1">
                      <LockClosedIcon className="h-4 w-4 text-yellow-600 mr-1.5" />
                      <h3 className="font-semibold text-yellow-800 text-xs">Inscription sécurisée</h3>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email Registration Form - Show conditionally */}
            {showEmailForm && (
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <h4 className="font-semibold text-base text-gray-800 mb-4">Inscription avec Email</h4>
                
                {error && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-400 rounded-lg p-3 flex items-start">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleEmailRegistration} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                      Adresse Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={emailFormData.email}
                      onChange={handleEmailFormChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={emailFormData.password}
                        onChange={handleEmailFormChange}
                        required
                        className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200"
                        placeholder="Minimum 8 caractères"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    {emailFormData.password && (
                      <div className="mt-2">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded ${
                                level <= passwordStrength
                                  ? level <= 2 ? 'bg-red-400' : level <= 3 ? 'bg-yellow-400' : level <= 4 ? 'bg-blue-400' : 'bg-green-400'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Force: {passwordStrength <= 2 ? 'Faible' : passwordStrength <= 3 ? 'Moyenne' : passwordStrength <= 4 ? 'Forte' : 'Très forte'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirmPassword">
                      Confirmer le mot de passe *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={emailFormData.confirmPassword}
                        onChange={handleEmailFormChange}
                        required
                        className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200"
                        placeholder="Confirmez votre mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-300 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Inscription...
                      </span>
                    ) : (
                      "S'inscrire"
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Email Verification OTP Form */}
            {showEmailVerification && (
              <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-200">
                <div className="text-center mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-3">
                    <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-base text-gray-800">Vérification de votre email</h4>
                  <p className="text-sm text-gray-600 mt-2">
                    Nous avons envoyé un code de vérification à <strong>{emailVerificationData.email}</strong>
                  </p>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-400 rounded-lg p-3 flex items-start">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleEmailVerification} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="emailOtp">
                      Code de vérification (6 chiffres) *
                    </label>
                    <input
                      type="text"
                      id="emailOtp"
                      value={emailVerificationData.otp}
                      onChange={handleEmailOTPChange}
                      maxLength={6}
                      required
                      className={`w-full px-3 py-2 text-center text-lg font-mono border rounded-lg focus:ring-2 transition duration-200 ${
                        emailOtpValidation.showSuccess
                          ? 'border-green-500 focus:ring-green-500 bg-green-50'
                          : emailOtpValidation.isInvalid
                          ? 'border-red-500 focus:ring-red-500 bg-red-50'
                          : emailOtpValidation.isValid
                          ? 'border-blue-500 focus:ring-blue-500 bg-blue-50'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="000000"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Entrez le code de 6 chiffres reçu par email
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingEmailOTP || emailVerificationData.otp.length !== 6}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifyingEmailOTP ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Vérification...
                      </span>
                    ) : (
                      "Vérifier l'email"
                    )}
                  </button>

                  <div className="text-center text-sm text-gray-600">
                    <p>Vous n'avez pas reçu le code ?</p>
                    {canResendEmailOTP ? (
                      <button
                        type="button"
                        onClick={handleResendEmailVerification}
                        className="text-blue-600 hover:text-blue-500 font-medium transition duration-300"
                      >
                        Renvoyer le code
                      </button>
                    ) : (
                      <span className="text-gray-500">
                        Renvoyer dans {emailResendTimer}s
                      </span>
                    )}
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailVerification(false);
                        setShowEmailForm(true);
                        setEmailVerificationData({ otp: '', userId: '', email: '' });
                        setError('');
                      }}
                      className="text-sm text-gray-600 hover:text-gray-500 transition duration-300"
                    >
                      ← Retour à l'inscription
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
            <div className="text-center text-xs text-gray-500">
              <p className="mb-2">En continuant, vous acceptez les Conditions d'utilisation de TLEFLI</p>
              <div className="space-y-1">
                <Link
                  to="/conditions"
                  className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-medium transition duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Conditions d'utilisation
                </Link>
                
                <p className="text-gray-600">
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
        </div>
      </div>
    </div>
  );
}
