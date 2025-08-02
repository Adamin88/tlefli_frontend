import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [searchParams] = useSearchParams();
  const [loginMethod, setLoginMethod] = useState(''); // 'google' or 'email'
  
  // Email login states
  const [emailFormData, setEmailFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Add OTP verification states for unverified email
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

  // Add password reset OTP states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetOTP, setShowResetOTP] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetData, setResetData] = useState({
    userId: '',
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [canResendResetOTP, setCanResendResetOTP] = useState(false);
  const [resetResendTimer, setResetResendTimer] = useState(60);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { user, isAuthenticated, refreshAuth } = useAuth();
  const navigate = useNavigate();

  // Add new state for form validation feedback
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  });
  const [isShaking, setIsShaking] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

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

  // Handle email form changes
  const handleEmailFormChange = (e) => {
    const { name, value } = e.target;
    setEmailFormData(prev => ({ ...prev, [name]: value }));
  };

  // Enhanced OTP input with real-time validation for email verification
  const handleEmailOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setEmailVerificationData(prev => ({ ...prev, otp: value }));
    
    // Real-time validation feedback
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

  // Enhanced email login handler with better feedback
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({ email: '', password: '' });

    try {
      // Enhanced client-side validation
      const errors = {};
      if (!emailFormData.email) {
        errors.email = 'L\'adresse email est requise';
      } else if (!/\S+@\S+\.\S+/.test(emailFormData.email)) {
        errors.email = 'Format d\'email invalide';
      }
      
      if (!emailFormData.password) {
        errors.password = 'Le mot de passe est requis';
      } else if (emailFormData.password.length < 3) {
        errors.password = 'Mot de passe trop court';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        throw new Error('Veuillez corriger les erreurs ci-dessus');
      }

      // Use the same API base URL logic
      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      const cleanBaseUrl = apiBaseUrl.endsWith('/') 
        ? apiBaseUrl.slice(0, -1) 
        : apiBaseUrl;

      const response = await fetch(`${cleanBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          email: emailFormData.email,
          password: emailFormData.password
        }),
      });

      const data = await response.json();

      // Check if response is ok first
      if (!response.ok) {
        // Handle specific error for unverified email
        if (response.status === 400 && data.message?.includes('vérifier votre email')) {
          // Check if we have userId in the response
          if (data.userId && data.email) {
            // Show email verification flow with data from backend
            setEmailVerificationData({
              otp: '',
              userId: data.userId,
              email: data.email
            });
            setShowEmailVerification(true);
            setLoginMethod('email-verification');
            
            toast('Veuillez vérifier votre email avant de vous connecter', {
              icon: '📧',
              style: {
                borderRadius: '10px',
                background: '#fbbf24',
                color: '#fff',
              },
              duration: 4000,
            });
            
            // Auto-send verification email now that we have the userId
            setTimeout(async () => {
              await handleResendEmailVerification();
            }, 500);
            return;
          } else {
            // If no userId in response, show error
            throw new Error('Email non vérifié. Veuillez contacter le support.');
          }
        }
        
        // Handle specific error types with field highlighting
        if (response.status === 404 || data.message?.includes('email')) {
          setFieldErrors({ email: 'Adresse email non trouvée', password: '' });
        } else if (response.status === 401 || data.message?.includes('mot de passe')) {
          setFieldErrors({ email: '', password: 'Mot de passe incorrect' });
        }
        
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        
        throw new Error(data.message || `Erreur ${response.status}`);
      }

      if (data.success) {
        setShowSuccessAnimation(true);
        toast.success('Connexion réussie !', {
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.25)',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#10b981',
          },
          duration: 3000,
        });
        
        setRedirecting(true);
        // Refresh auth context
        await refreshAuth();
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        throw new Error(data.message || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Email login error:', error);
      setError(error.message);
      
      // Enhanced error toast with modern styling
      toast.error(error.message, {
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          borderRadius: '12px',
          fontSize: '14px',
          padding: '12px 16px',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.25)',
        },
        iconTheme: {
          primary: 'white',
          secondary: '#ef4444',
        },
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email verification OTP
  const handleEmailVerification = async (e) => {
    e.preventDefault();
    setIsVerifyingEmailOTP(true);

    try {
      if (emailVerificationData.otp.length !== 6) {
        setEmailOtpValidation({
          isValid: false,
          isInvalid: true,
          showSuccess: false
        });
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        throw new Error('Veuillez entrer le code de vérification complet');
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      const cleanBaseUrl = apiBaseUrl.endsWith('/') 
        ? apiBaseUrl.slice(0, -1) 
        : apiBaseUrl;

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

      if (data.success) {
        // Show success animation
        setEmailOtpValidation({
          isValid: true,
          isInvalid: false,
          showSuccess: true
        });

        toast.success('Email vérifié avec succès !', {
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.25)',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#10b981',
          },
          duration: 3000,
        });
        
        // Reset to login form
        setTimeout(() => {
          setShowEmailVerification(false);
          setLoginMethod('email');
          setEmailVerificationData({ otp: '', userId: '', email: '' });
          toast('Vous pouvez maintenant vous connecter', {
            icon: '✅',
            style: {
              borderRadius: '10px',
              background: '#10b981',
              color: '#fff',
            },
          });
        }, 1500);
      } else {
        setEmailOtpValidation({
          isValid: false,
          isInvalid: true,
          showSuccess: false
        });
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        throw new Error(data.message || 'Code de vérification invalide');
      }
    } catch (error) {
      console.error('Email OTP verification error:', error);
      toast.error(error.message, {
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          borderRadius: '12px',
          fontSize: '14px',
          padding: '12px 16px',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.25)',
        },
        iconTheme: {
          primary: 'white',
          secondary: '#ef4444',
        },
        duration: 4000,
      });
    } finally {
      setIsVerifyingEmailOTP(false);
    }
  };

  // Resend email verification OTP
  const handleResendEmailVerification = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      const cleanBaseUrl = apiBaseUrl.endsWith('/') 
        ? apiBaseUrl.slice(0, -1) 
        : apiBaseUrl;

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

      if (data.success) {
        toast.success('Nouveau code de vérification envoyé');
        startEmailResendTimer();
      } else {
        throw new Error(data.message || 'Erreur lors de l\'envoi du code');
      }
    } catch (error) {
      console.error('Resend email OTP error:', error);
      toast.error(error.message);
    }
  };

  // Timer for resend email OTP
  const startEmailResendTimer = () => {
    setCanResendEmailOTP(false);
    setEmailResendTimer(60);
    
    const timer = setInterval(() => {
      setEmailResendTimer(prev => {
        if (prev <= 1) {
          setCanResendEmailOTP(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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

  // Handle reset form changes
  const handleResetFormChange = (e) => {
    const { name, value } = e.target;
    setResetData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  // Handle OTP input for password reset
  const handleResetOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setResetData(prev => ({ ...prev, otp: value }));
  };

  // Add forgot password handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsResettingPassword(true);
    setError('');

    try {
      if (!forgotPasswordEmail) {
        throw new Error('Veuillez entrer votre adresse email');
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      const cleanBaseUrl = apiBaseUrl.endsWith('/') 
        ? apiBaseUrl.slice(0, -1) 
        : apiBaseUrl;

      console.log('Sending forgot password request for:', forgotPasswordEmail);

      const response = await fetch(`${cleanBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: forgotPasswordEmail
        }),
      });

      console.log('Forgot password response status:', response.status);
      const data = await response.json();
      console.log('Forgot password response data:', data);

      if (data.success && data.data) {
        setResetData({
          userId: data.data.userId,
          email: data.data.email,
          otp: '',
          newPassword: '',
          confirmPassword: '',
          isGoogleUser: data.data.isGoogleUser || false
        });
        setShowForgotPassword(false);
        setShowResetOTP(true);
        
        // Different message for Google users
        if (data.data.isGoogleUser) {
          toast.success('Code pour créer un mot de passe envoyé à votre email', {
            style: {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 16px',
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.25)',
            },
            iconTheme: {
              primary: 'white',
              secondary: '#10b981',
            },
            duration: 4000,
          });
        } else {
          toast.success('Code de réinitialisation envoyé à votre email', {
            style: {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 16px',
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.25)',
            },
            iconTheme: {
              primary: 'white',
              secondary: '#10b981',
            },
            duration: 4000,
          });
        }
        startResetResendTimer();
      } else {
        // Even if no data is returned, show success message for security
        toast.success('Si ce compte existe, un code de réinitialisation a été envoyé', {
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.25)',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#10b981',
          },
          duration: 4000,
        });
        setShowForgotPassword(false);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error.message);
      toast.error(error.message, {
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          borderRadius: '12px',
          fontSize: '14px',
          padding: '12px 16px',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.25)',
        },
        iconTheme: {
          primary: 'white',
          secondary: '#ef4444',
        },
        duration: 4000,
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle password reset with OTP
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsResettingPassword(true);
    setError('');

    try {
      if (!resetData.otp || !resetData.newPassword || !resetData.confirmPassword) {
        throw new Error('Veuillez remplir tous les champs');
      }

      if (resetData.otp.length !== 6) {
        throw new Error('Veuillez entrer le code de vérification complet');
      }

      if (resetData.newPassword !== resetData.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      if (resetData.newPassword.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      const cleanBaseUrl = apiBaseUrl.endsWith('/') 
        ? apiBaseUrl.slice(0, -1) 
        : apiBaseUrl;

      console.log('Sending password reset request:', {
        userId: resetData.userId,
        otp: resetData.otp,
        passwordLength: resetData.newPassword.length,
        isGoogleUser: resetData.isGoogleUser
      });

      const response = await fetch(`${cleanBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: resetData.userId,
          otp: resetData.otp,
          newPassword: resetData.newPassword
        }),
      });

      console.log('Password reset response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Password reset error response:', errorData);
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      console.log('Password reset success response:', data);

      if (data.success) {
        const successMessage = resetData.isGoogleUser 
          ? 'Mot de passe créé avec succès ! Vous pouvez maintenant vous connecter avec votre email.'
          : 'Mot de passe réinitialisé avec succès !';
        
        toast.success(successMessage, {
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.25)',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#10b981',
          },
          duration: 5000,
        });
        
        setShowResetOTP(false);
        setLoginMethod('');
        
        // Reset form data
        setResetData({
          userId: '',
          email: '',
          otp: '',
          newPassword: '',
          confirmPassword: '',
          isGoogleUser: false
        });
        
        // Clear the forgot password email as well
        setForgotPasswordEmail('');
      } else {
        throw new Error(data.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message);
      toast.error(error.message, {
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          borderRadius: '12px',
          fontSize: '14px',
          padding: '12px 16px',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.25)',
        },
        iconTheme: {
          primary: 'white',
          secondary: '#ef4444',
        },
        duration: 4000,
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Resend reset OTP
  const handleResendResetOTP = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      const cleanBaseUrl = apiBaseUrl.endsWith('/') 
        ? apiBaseUrl.slice(0, -1) 
        : apiBaseUrl;

      const response = await fetch(`${cleanBaseUrl}/auth/resend-password-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: resetData.userId
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Nouveau code envoyé');
        startResetResendTimer();
      } else {
        throw new Error(data.message || 'Erreur lors de l\'envoi du code');
      }
    } catch (error) {
      console.error('Resend reset OTP error:', error);
      toast.error(error.message);
    }
  };

  // Timer for resend reset OTP
  const startResetResendTimer = () => {
    setCanResendResetOTP(false);
    setResetResendTimer(60);
    
    const timer = setInterval(() => {
      setResetResendTimer(prev => {
        if (prev <= 1) {
          setCanResendResetOTP(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Navigation helpers
  const goToEmailLogin = () => {
    setLoginMethod('email');
  };

  const goToGoogleLogin = () => {
    setLoginMethod('google');
    handleGoogleLogin();
  };

  const handleGoogleLogin = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Use clean URL without any double slashes
      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      // Ensure there's no trailing slash in the base URL
      const cleanBaseUrl = apiBaseUrl.endsWith('/') 
        ? apiBaseUrl.slice(0, -1) 
        : apiBaseUrl;
      
      // Add action=login to indicate this is a login attempt
      const googleAuthUrl = `${cleanBaseUrl}/auth/google?action=login`;
      
      console.log('Redirecting to Google auth for login:', googleAuthUrl);
      
      // Open Google sign-in in the same window for better cookie handling
      window.location.href = googleAuthUrl;
    } catch (err) {
      console.error('Google login error:', err);
      setError('Échec de la connexion avec Google. Veuillez réessayer.');
      toast.error('Échec de la connexion avec Google. Veuillez réessayer.', {
        duration: 4000,
        position: 'top-center'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        animate={{ 
          opacity: 1, 
          y: 0,
          x: isShaking ? [-5, 5, -5, 5, 0] : 0
        }}
        transition={{ 
          duration: 0.5,
          x: { duration: 0.4, ease: "easeInOut" }
        }}
        className="max-w-md w-full h-[calc(100vh-2rem)] max-h-[700px] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col"
      >
        {/* Decorative top banner */}
        <div className="h-3 bg-gradient-to-r from-yellow-400 to-yellow-300 flex-shrink-0"></div>
        
        <div className="flex-grow flex flex-col overflow-hidden">
          {/* Main content - scrollable if needed */}
          <div className="px-5 py-4 flex-grow flex flex-col">
            {/* Logo and header */}
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
                  className="h-10 w-auto max-w-full rounded-full shadow-lg relative z-10 border-4 border-white"
                />
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-center mb-4"
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

            {/* Enhanced error message area */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-3 p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 shadow-sm"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-start">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  </motion.div>
                  <p className="text-red-700 text-xs font-medium">{error}</p>
                </div>
              </motion.div>
            )}

            <div className="flex-grow flex flex-col justify-center">
              {!loginMethod ? (
                /* Method Selection */
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <p className="text-center text-gray-600 text-sm mb-4">
                    Choisissez votre méthode de connexion :
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={goToGoogleLogin}
                    className="w-full flex items-center justify-center py-3 px-5 
                           rounded-xl text-sm font-medium text-gray-700 
                           bg-white hover:bg-gray-50 focus:outline-none 
                           shadow-lg hover:shadow-xl transition-all duration-300
                           border border-gray-300 hover:border-yellow-300
                           relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 w-0 bg-gradient-to-r from-yellow-50 to-yellow-100 transition-all duration-500 ease-out group-hover:w-full"></span>
                    
                    <svg className="h-5 w-5 mr-2 relative z-10" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm relative z-10">Se connecter avec Google</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={goToEmailLogin}
                    className="w-full flex items-center justify-center py-3 px-5 
                           rounded-xl text-sm font-medium text-white
                           bg-yellow-600 hover:bg-yellow-700 focus:outline-none 
                           shadow-lg hover:shadow-xl transition-all duration-300
                           border border-yellow-600"
                  >
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm">Se connecter avec Email</span>
                  </motion.button>

                  {/* Security notice */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200 p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-center mb-1">
                      <LockClosedIcon className="h-4 w-4 text-yellow-600 mr-1.5" />
                      <h3 className="font-semibold text-yellow-800 text-xs">Connexion sécurisée</h3>
                    </div>
                  </motion.div>
                </motion.div>
              ) : loginMethod === 'email' ? (
                /* Email Login Form */
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-full"
                >
                  {!showForgotPassword && !showResetOTP ? (
                    <>
                      {/* Regular login form */}
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Connexion avec Email</h3>
                        <p className="text-xs text-gray-600">Entrez vos identifiants</p>
                      </div>

                      <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                          <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                            Adresse email *
                          </label>
                          <div className="relative">
                            <input
                              id="email"
                              name="email"
                              type="email"
                              required
                              value={emailFormData.email}
                              onChange={handleEmailFormChange}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm transition-all duration-200 ${
                                fieldErrors.email 
                                  ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200' 
                                  : 'border-gray-300 focus:border-yellow-500'
                              }`}
                              placeholder="votre@email.com"
                            />
                            {fieldErrors.email && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              >
                                <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
                              </motion.div>
                            )}
                          </div>
                          {fieldErrors.email && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-1 text-xs text-red-600 font-medium"
                            >
                              {fieldErrors.email}
                            </motion.p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                            Mot de passe *
                          </label>
                          <div className="relative">
                            <input
                              id="password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              required
                              value={emailFormData.password}
                              onChange={handleEmailFormChange}
                              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm transition-all duration-200 ${
                                fieldErrors.password 
                                  ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200' 
                                  : 'border-gray-300 focus:border-yellow-500'
                              }`}
                              placeholder="Votre mot de passe"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                              {fieldErrors.password && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                >
                                  <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
                                </motion.div>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? (
                                  <EyeSlashIcon className="h-4 w-4" />
                                ) : (
                                  <EyeIcon className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          {fieldErrors.password && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-1 text-xs text-red-600 font-medium"
                            >
                              {fieldErrors.password}
                            </motion.p>
                          )}
                        </div>

                        {/* Add forgot password link */}
                        <div className="flex items-center justify-between">
                          <div></div>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-xs text-yellow-600 hover:text-yellow-500 underline"
                          >
                            Mot de passe oublié ?
                          </button>
                        </div>

                        <div className="pt-2">
                          <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: isLoading ? 1 : 1.02 }}
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-300 ${
                              isLoading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-yellow-600 hover:bg-yellow-700 hover:shadow-lg'
                            }`}
                          >
                            {isLoading ? (
                              <span className="flex items-center">
                                <motion.svg 
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="h-4 w-4 text-white mr-3" 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  fill="none" 
                                  viewBox="0 0 24 24"
                                >
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </motion.svg>
                                Connexion...
                              </span>
                            ) : (
                              "Se connecter"
                            )}
                          </motion.button>
                        </div>
                      </form>

                      <div className="text-center mt-4">
                        <button
                          onClick={() => setLoginMethod('')}
                          className="text-yellow-600 hover:text-yellow-500 text-xs underline"
                        >
                          Retour aux options de connexion
                        </button>
                      </div>
                    </>
                  ) : showForgotPassword ? (
                    /* Forgot Password Form */
                    <>
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Mot de passe oublié</h3>
                        <p className="text-xs text-gray-600">Entrez votre email pour recevoir un code de réinitialisation</p>
                      </div>

                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                          <label htmlFor="forgotEmail" className="block text-xs font-medium text-gray-700 mb-1">
                            Adresse email *
                          </label>
                          <input
                            id="forgotEmail"
                            name="forgotEmail"
                            type="email"
                            required
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                            placeholder="votre@email.com"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isResettingPassword}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-300 disabled:opacity-50"
                          >
                            {isResettingPassword ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Envoi en cours...
                              </span>
                            ) : (
                              "Envoyer le code de réinitialisation"
                            )}
                          </button>
                        </div>
                      </form>

                      <div className="text-center mt-4 space-y-2">
                        <button
                          onClick={() => setShowForgotPassword(false)}
                          className="text-yellow-600 hover:text-yellow-500 text-xs underline block"
                        >
                          Retour à la connexion
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Password Reset OTP Form */
                    <>
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {resetData.isGoogleUser ? 'Créer un mot de passe' : 'Réinitialiser le mot de passe'}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {resetData.isGoogleUser ? (
                            <>
                              Créez un mot de passe pour vous connecter avec votre email<br />
                              <span className="font-medium">{resetData.email}</span>
                            </>
                          ) : (
                            <>
                              Entrez le code de 6 chiffres envoyé à<br />
                              <span className="font-medium">{resetData.email}</span>
                            </>
                          )}
                        </p>
                        {resetData.isGoogleUser && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-xs text-green-700">
                              Après avoir créé un mot de passe, vous pourrez vous connecter avec Google ou avec votre email.
                            </p>
                          </div>
                        )}
                      </div>

                      <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Code de vérification *
                          </label>
                          <input
                            type="text"
                            value={resetData.otp}
                            onChange={handleResetOTPChange}
                            placeholder="000000"
                            className="w-full px-4 py-3 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 tracking-widest"
                            maxLength={6}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {resetData.isGoogleUser ? 'Créer un mot de passe *' : 'Nouveau mot de passe *'}
                          </label>
                          <div className="relative">
                            <input
                              name="newPassword"
                              type={showPassword ? "text" : "password"}
                              required
                              value={resetData.newPassword}
                              onChange={handleResetFormChange}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                              placeholder="Minimum 8 caractères"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPassword ? (
                                <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                              ) : (
                                <EyeIcon className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                          
                          {/* Password strength indicator */}
                          {resetData.newPassword && (
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
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Confirmer le mot de passe *
                          </label>
                          <input
                            name="confirmPassword"
                            type="password"
                            required
                            value={resetData.confirmPassword}
                            onChange={handleResetFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                            placeholder="Confirmer le mot de passe"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isResettingPassword || resetData.otp.length !== 6}
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-300 disabled:opacity-50"
                        >
                          {isResettingPassword ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {resetData.isGoogleUser ? 'Création...' : 'Réinitialisation...'}
                            </span>
                          ) : (
                            resetData.isGoogleUser ? "Créer le mot de passe" : "Réinitialiser le mot de passe"
                          )}
                        </button>
                      </form>

                      <div className="text-center mt-4 space-y-2">
                        {canResendResetOTP ? (
                          <button
                            onClick={handleResendResetOTP}
                            className="text-yellow-600 hover:text-yellow-500 text-xs underline block"
                          >
                            Renvoyer le code
                          </button>
                        ) : (
                          <p className="text-xs text-gray-500">
                            Renvoyer le code dans {resetResendTimer}s
                          </p>
                        )}
                        <button
                          onClick={() => {
                            setShowResetOTP(false);
                            setShowForgotPassword(false);
                          }}
                          className="text-gray-500 hover:text-gray-600 text-xs underline block"
                        >
                          Retour à la connexion
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ) : loginMethod === 'email-verification' ? (
                /* Email Verification OTP Form */
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    scale: isShaking ? [1, 0.98, 1.02, 0.98, 1] : 1
                  }}
                  transition={{
                    scale: { duration: 0.4, ease: "easeInOut" }
                  }}
                  className="w-full text-center"
                >
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Vérification Email</h3>
                    <p className="text-xs text-gray-600">
                      Entrez le code de 6 chiffres envoyé à<br />
                      <span className="font-medium">{emailVerificationData.email}</span>
                    </p>
                  </div>

                  <form onSubmit={handleEmailVerification} className="space-y-4">
                    <div className="relative">
                      <motion.input
                        type="text"
                        value={emailVerificationData.otp}
                        onChange={handleEmailOTPChange}
                        placeholder="000000"
                        maxLength={6}
                        animate={{
                          borderColor: emailOtpValidation.isInvalid 
                            ? '#ef4444' 
                            : emailOtpValidation.isValid 
                              ? '#10b981' 
                              : '#d1d5db'
                        }}
                        className={`w-full px-4 py-3 text-center text-2xl font-bold border-2 rounded-lg focus:ring-2 focus:outline-none tracking-widest transition-all duration-200 ${
                          emailOtpValidation.isInvalid
                            ? 'border-red-400 bg-red-50 focus:ring-red-200'
                            : emailOtpValidation.isValid
                              ? 'border-green-400 bg-green-50 focus:ring-green-200'
                              : 'border-gray-300 focus:ring-yellow-500 focus:border-yellow-500'
                        }`}
                      />
                      
                      {/* Success checkmark overlay */}
                      {emailOtpValidation.showSuccess && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-90 rounded-lg"
                        >
                          <motion.svg
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <motion.path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </motion.svg>
                        </motion.div>
                      )}

                      {/* Error indicator */}
                      {emailOtpValidation.isInvalid && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-1/2 right-3 transform -translate-y-1/2"
                        >
                          <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
                        </motion.div>
                      )}

                      {/* Valid indicator */}
                      {emailOtpValidation.isValid && !emailOtpValidation.showSuccess && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-1/2 right-3 transform -translate-y-1/2"
                        >
                          <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </div>

                    {/* Real-time feedback */}
                    <div className="text-xs text-center">
                      {emailVerificationData.otp.length === 0 && (
                        <p className="text-gray-500">Entrez le code de 6 chiffres</p>
                      )}
                      {emailVerificationData.otp.length > 0 && emailVerificationData.otp.length < 6 && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-blue-600"
                        >
                          {6 - emailVerificationData.otp.length} chiffre(s) restant(s)
                        </motion.p>
                      )}
                      {emailOtpValidation.isValid && !emailOtpValidation.showSuccess && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-green-600 font-medium"
                        >
                          Code prêt à vérifier ✓
                        </motion.p>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isVerifyingEmailOTP || emailVerificationData.otp.length !== 6}
                      whileHover={{ scale: (isVerifyingEmailOTP || emailVerificationData.otp.length !== 6) ? 1 : 1.02 }}
                      whileTap={{ scale: (isVerifyingEmailOTP || emailVerificationData.otp.length !== 6) ? 1 : 0.98 }}
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-300 ${
                        isVerifyingEmailOTP || emailVerificationData.otp.length !== 6
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-yellow-600 hover:bg-yellow-700 hover:shadow-lg'
                      }`}
                    >
                      {isVerifyingEmailOTP ? (
                        <span className="flex items-center">
                          <motion.svg 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-4 w-4 text-white mr-3" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </motion.svg>
                          Vérification...
                        </span>
                      ) : (
                        "Vérifier"
                      )}
                    </motion.button>
                  </form>

                  <div className="mt-4 space-y-2">
                    {canResendEmailOTP ? (
                      <motion.button
                        onClick={handleResendEmailVerification}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-yellow-600 hover:text-yellow-500 text-xs underline font-medium transition-colors duration-200 block"
                      >
                        Renvoyer le code
                      </motion.button>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Renvoyer le code dans {emailResendTimer}s
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setShowEmailVerification(false);
                        setLoginMethod('email');
                      }}
                      className="text-gray-500 hover:text-gray-600 text-xs underline block"
                    >
                      Retour à la connexion
                    </button>
                  </div>
                </motion.div>
              ) : null}
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
