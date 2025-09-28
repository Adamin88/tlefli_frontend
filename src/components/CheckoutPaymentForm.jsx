import React, { useState, useEffect, useRef } from 'react';
import { createItemPayment, verifyItemPayment } from '../services/checkoutService';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const CheckoutPaymentForm = ({ itemId, amount, currency, onSuccess, onError, deliveryOption = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isComponentLoaded, setIsComponentLoaded] = useState(false);
  const [paymentSession, setPaymentSession] = useState(null);
  const [cardValid, setCardValid] = useState(false);
  const isMounted = useRef(true);
  const checkoutFormRef = useRef(null);
  const checkoutInstance = useRef(null);

  // Track component mount status
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Cleanup on unmount for Checkout.com Flow
      if (checkoutInstance.current) {
        try {
          // Flow cleanup - destroy the instance
          if (typeof checkoutInstance.current.destroy === 'function') {
            checkoutInstance.current.destroy();
          }
        } catch (err) {
          console.warn('Error during Flow cleanup:', err);
        }
      }
    };
  }, []);

  // Get Checkout.com public key
  const publicKey = import.meta.env.VITE_CHECKOUT_PUBLIC_KEY;

  if (!publicKey) {
    return (
      <div className="bg-red-50 p-4 rounded-md border border-red-300">
        <p className="text-sm text-red-700">
          Configuration de paiement manquante. Veuillez contacter le support.
        </p>
      </div>
    );
  }

  // Create payment session on component mount
  useEffect(() => {
    const createPaymentSession = async () => {
      try {
        setError(null);
        console.log('Creating payment session for item:', itemId);

        // Create payment session via our backend
        const response = await createItemPayment(itemId, {
          amount: amount * 100, // Convert to cents
          currency: currency,
          deliveryOption: deliveryOption // Include delivery option
          // Note: successUrl and failureUrl removed since we handle results via Flow callbacks
        });

        if (response.success && response.paymentSession) {
          console.log('Payment session created:', response.paymentSession);
          setPaymentSession(response.paymentSession);
        } else {
          throw new Error('Failed to create payment session');
        }

      } catch (err) {
        console.error('Error creating payment session:', err);
        console.log('Backend might not be running. Using mock session for testing...');
        
        // For testing when backend is not available, use a mock session
        if (isMounted.current) {
          // setError('Erreur lors de la création de la session de paiement');
          
          // Mock payment session for development/testing
          const mockSession = {
            id: 'ps_mock_session_' + Date.now(),
            payment_session_token: 'mock_token_for_testing_' + Date.now(),
            payment_session_secret: 'mock_secret_for_testing',
            amount: amount * 100,
            currency: currency
          };
          
          console.log('Using mock payment session:', mockSession);
          setPaymentSession(mockSession);
        }
      }
    };

    createPaymentSession();
  }, [itemId, amount, currency]);

  // Load Checkout.com Flow when payment session is ready
  useEffect(() => {
    if (!paymentSession) return;

    const initializeCheckoutFlow = async () => {
      try {
        console.log('Initializing Checkout.com Flow...');
        
        // Check if CheckoutWebComponents is available from the script tag
        if (typeof window.CheckoutWebComponents !== 'function') {
          throw new Error('CheckoutWebComponents not found. Make sure the script is loaded.');
        }

        // Check if this is a mock session (backend not running)
        if (paymentSession.payment_session_token && paymentSession.payment_session_token.includes('mock_token')) {
          console.log('Mock session detected - skipping Flow initialization');
          if (isMounted.current) {
            setError('Backend server not running. Please start the backend to enable payments.');
          }
          return;
        }
        
        // Validate that we have the required payment session token
        if (!paymentSession.payment_session_token) {
          throw new Error('Payment session token is missing');
        }
        
        console.log('Creating CheckoutWebComponents instance...');
        console.log('Payment session token:', paymentSession.payment_session_token);
        console.log('Using public key:', publicKey ? publicKey.substring(0, 15) + '...' : 'NOT SET');
        
        // Initialize CheckoutWebComponents with the official Flow API
        // Flow expects the entire payment session object, not just the token
        const checkout = await window.CheckoutWebComponents({
          paymentSession: paymentSession, // Pass the entire payment session object
          publicKey: publicKey,
          environment: import.meta.env.VITE_CHECKOUT_ENVIRONMENT === 'live' ? 'production' : 'sandbox',
          locale: 'fr-FR',
          // Handle synchronous payments
          onPaymentCompleted: async (self, paymentResponse) => {
            console.log('Payment completed:', paymentResponse);
            
            if (isMounted.current) {
              setIsProcessing(true); // Show processing state while verifying
              
              try {
                // Verify payment with backend to mark item as paid
                console.log('Verifying payment with backend:', paymentResponse.id);
                console.log('Full payment response:', paymentResponse);
                console.log('Payment ID type:', typeof paymentResponse.id);
                const verificationResult = await verifyItemPayment(paymentResponse.id);
                
                if (verificationResult.success) {
                  console.log('Payment verified successfully:', verificationResult);
                  
                  // Call onSuccess with additional refresh triggers
                  if (onSuccess) {
                    onSuccess({
                      success: true,
                      paymentId: paymentResponse.id,
                      payment: paymentResponse,
                      verification: verificationResult,
                      // Add refresh triggers
                      shouldRefreshItems: true,
                      itemUpdated: verificationResult.item
                    });
                  }
                  
                  toast.success('Paiement réussi et vérifié! L\'objet a été réclamé avec succès.');
                } else {
                  throw new Error('Payment verification failed');
                }
              } catch (verificationError) {
                console.error('=== VERIFICATION ERROR IN COMPONENT ===');
                console.error('Payment verification error:', verificationError);
                console.error('Error message:', verificationError.message);
                console.error('Error response:', verificationError.response);
                console.error('=== END VERIFICATION ERROR ===');
                
                // Payment succeeded but verification failed
                const errorMsg = verificationError.response?.data?.message || verificationError.message || 'Erreur de vérification inconnue';
                toast.error(`Paiement réussi mais erreur de vérification: ${errorMsg}`);
                
                if (onError) {
                  onError({
                    type: 'verification_error',
                    message: errorMsg,
                    paymentId: paymentResponse.id,
                    fullError: verificationError
                  });
                }
              } finally {
                setIsProcessing(false);
              }
            }
          },
          // Handle errors
          onError: (error) => {
            console.error('Flow error:', error);
            
            if (isMounted.current) {
              setError('Erreur de paiement: ' + error.message);
              setIsProcessing(false);
              
              if (onError) {
                onError(error);
              }
              
              toast.error('Erreur lors du paiement');
            }
          }
        });

        console.log('CheckoutWebComponents initialized successfully:', checkout);
        checkoutInstance.current = checkout;

        // Create the Flow component - this displays all available payment methods
        console.log('Creating Flow component...');
        const flowComponent = checkout.create('flow');
        
        console.log('Flow component created:', flowComponent);
        
        // Mount the Flow component to the DOM
        if (checkoutFormRef.current && isMounted.current) {
          console.log('Mounting Flow component to:', checkoutFormRef.current);
          
          // Flow component is mounted and ready immediately
          flowComponent.mount(checkoutFormRef.current);
          console.log('Flow component mounted successfully');
          
          // Set component as loaded since Flow doesn't have traditional event listeners
          setIsComponentLoaded(true);
          setCardValid(true); // Flow handles validation internally
        }

      } catch (err) {
        console.error('Error initializing Checkout Flow:', err);
        
        if (isMounted.current) {
          if (err.message && err.message.includes('CheckoutWebComponents not found')) {
            setError('Erreur de chargement des composants de paiement. Veuillez actualiser la page.');
          } else if (err.message && err.message.includes('401') || err.message.includes('Unauthorized')) {
            setError('Erreur d\'authentification avec Checkout.com. Vérifiez la configuration des clés API.');
          } else {
            setError('Erreur lors de l\'initialisation du système de paiement: ' + err.message);
          }
        }
      }
    };

    // Wait a bit to ensure the script is loaded
    setTimeout(initializeCheckoutFlow, 100);
  }, [paymentSession, publicKey]);

  // Flow handles payment submission automatically, so this is simplified
  const handlePayment = async () => {
    // With Flow, payments are handled automatically when the user clicks Pay
    // The onPaymentCompleted callback will be triggered
    console.log('Flow will handle payment submission automatically');
    
    if (isMounted.current) {
      setIsProcessing(true);
      // Flow takes over from here
    }
  };

  return (
    <div className="checkout-payment-form">
      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md border border-red-300">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {!isComponentLoaded && !error && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">
            {paymentSession ? 'Chargement du formulaire de paiement...' : 'Création de la session de paiement...'}
          </span>
        </div>
      )}

      {/* Checkout.com Flow container - displays payment form directly */}
      <div 
        ref={checkoutFormRef}
        className={`checkout-flow-container ${!isComponentLoaded ? 'hidden' : ''}`}
        style={{ minHeight: '300px' }}
      />
    </div>
  );
};

export default CheckoutPaymentForm;
