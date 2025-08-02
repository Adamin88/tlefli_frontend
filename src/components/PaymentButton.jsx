import React, { useEffect, useState, useRef } from 'react';
import { loadScript } from "@paypal/paypal-js";
import { createItemPayment, capturePayment } from '../services/itemsService';
import authService from '../services/authService';
import toast from './Toast/index';

const PaymentButton = ({ itemId, amount, currency, onSuccess }) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState(null);
  const paypalButtonRef = useRef(null);
  const paypalInstance = useRef(null);
  const buttonInstance = useRef(null);
  const scriptPromise = useRef(null);
  const isMounted = useRef(true);
  const renderAttempted = useRef(false);
  
  // Track component mount status to prevent state updates after unmount
  useEffect(() => {
    isMounted.current = true;
    renderAttempted.current = false;
    
    return () => {
      isMounted.current = false;
      
      // Ensure any button instances are properly closed
      if (buttonInstance.current) {
        try {
          console.log('Cleaning up PayPal button instance on unmount');
          if (typeof buttonInstance.current.close === 'function') {
            buttonInstance.current.close();
          }
        } catch (err) {
          console.log('Non-critical error during button cleanup:', err);
        }
        buttonInstance.current = null;
      }
    };
  }, []);

  // Separate PayPal loading function
  const loadPayPalScript = () => {
    console.log('Loading PayPal script with client ID:', import.meta.env.VITE_PAYPAL_CLIENT_ID);
    
    // Determine environment based on URL or environment variable
    const isProduction = window.location.hostname === 'tlefli.ma' || 
                        import.meta.env.VITE_ENVIRONMENT === 'production';
    
    const scriptConfig = {
      "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
      currency: currency || "EUR",
      components: "buttons,marks",
      "enable-funding": "card",
      "disable-funding": "paylater,venmo,sepa,bancontact",
      debug: !isProduction // Enable debug only in non-production
    };
    
    console.log(`Loading PayPal script for ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} environment`);
    
    loadScript(scriptConfig)
    .then(paypal => {
      if (isMounted.current) {
        console.log('PayPal script loaded successfully');
        paypalInstance.current = paypal;
        setIsScriptLoaded(true);
      }
    })
    .catch(err => {
      console.error("Failed to load PayPal SDK:", err);
      if (isMounted.current) {
        setError("Error loading PayPal");
      }
    });
  };

  // Load PayPal script only once
  useEffect(() => {
    if (isScriptLoaded || isProcessingPayment || scriptPromise.current) {
      return;
    }
    
    scriptPromise.current = true; // Mark as loading
    loadPayPalScript();
    
    return () => {
      // Just log cleanup
      console.log('Cleaning up PayPal script loading effect');
    };
  }, [currency, isScriptLoaded, isProcessingPayment, itemId, amount]);

  // Render PayPal buttons with a delay to ensure container is ready
  useEffect(() => {
    // Clear any previous render attempts when dependencies change
    renderAttempted.current = false;
    
    // Only proceed if all conditions are met
    if (!isScriptLoaded || !paypalButtonRef.current || !paypalInstance.current || isProcessingPayment || renderAttempted.current) {
      return;
    }

    // Set a small delay to ensure DOM is ready
    const renderTimeout = setTimeout(() => {
      renderButtons();
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(renderTimeout);
    };
  }, [isScriptLoaded, itemId, onSuccess, isProcessingPayment]);

  // Separate the button rendering logic to its own function
  const renderButtons = async () => {
    // Guard against multiple render attempts
    if (renderAttempted.current || !isMounted.current) return;
    renderAttempted.current = true;
    
    try {
      // Clear the container first
      const buttonContainer = paypalButtonRef.current;
      if (!buttonContainer) {
        console.error('Button container not found');
        return;
      }
      
      buttonContainer.innerHTML = '';
      console.log('Cleared button container, rendering PayPal buttons');
      
      // Create the button instance
      buttonInstance.current = paypalInstance.current.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay'
        },
        
        // Create order
        createOrder: async () => {
          if (!isMounted.current) {
            throw new Error('Component unmounted');
          }
          
          try {
            setIsProcessingPayment(true);
            setError(null);
            
            // Validate item ID
            if (!itemId) {
              const errorMsg = 'Item ID is required for payment processing';
              console.error(errorMsg);
              toast.error('Erreur: ID de l\'objet manquant');
              throw new Error(errorMsg);
            }
            
            console.log('Creating payment for item:', itemId);
            
            // Always use 3.00 for amount and EUR for currency
            const fixedAmount = 3.00;
            const fixedCurrency = 'EUR';
            
            // Check if user is authenticated
            const token = authService.getToken();
            const isProduction = window.location.hostname === 'tlefli.ma' || 
                               import.meta.env.VITE_ENVIRONMENT === 'production';
            
            if (!token) {
              console.warn('User is not authenticated for payment');
              if (isProduction) {
                const errorMsg = 'Authentification requise pour effectuer un paiement';
                toast.error(errorMsg);
                throw new Error(errorMsg);
              }
              // In development, we continue anyway as backend might allow payment
            }
            
            const currentUrl = window.location.href;
            const baseUrl = currentUrl.split('/').slice(0, 3).join('/');
            const returnUrl = `${baseUrl}/profile/items`;
            const cancelUrl = window.location.href;
            
            console.log('Return URL:', returnUrl);
            console.log('Cancel URL:', cancelUrl);
            
            // Create the order on the backend using the exported function
            const response = await createItemPayment(itemId, {
              returnUrl,
              cancelUrl
            });
            
            if (!response.success) {
              console.error('Payment creation failed:', response);
              throw new Error(response.message || "Erreur lors de la création du paiement");
            }
            
            console.log('Payment created successfully:', response.payment.id);
            return response.payment.id;
          } catch (err) {
            console.error("Error creating PayPal order:", err);
            if (isMounted.current) {
              let errorMsg = 'Une erreur est survenue lors de la création du paiement.';
              
              // Try to extract more specific error message
              if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
              } else if (err.response?.data?.error) {
                errorMsg = err.response.data.error;
              } else if (err.message) {
                errorMsg = err.message;
              }
              
              setError(errorMsg);
              setIsProcessingPayment(false);
              toast.error(errorMsg);
            }
            throw err;
          }
        },
        
        // Handle approval
        onApprove: async (data) => {
          if (!isMounted.current) return false;
          
          try {
            console.log('Payment approved, capturing payment:', data.orderID);
            console.log('For item:', itemId);
            
            // Capture the payment on the server using the exported function
            const captureResult = await capturePayment(data.orderID);
            
            if (!captureResult.success) {
              throw new Error(captureResult.message || "Erreur lors de la capture du paiement");
            }
            
            console.log('Payment captured successfully:', captureResult);
            
            // Call the success callback if component is still mounted
            if (isMounted.current && onSuccess) {
              await onSuccess({
                ...captureResult,
                itemId: itemId,
                orderId: data.orderID
              });
            }
            
            return true;
          } catch (err) {
            console.error("Error capturing payment:", err);
            if (isMounted.current) {
              const errorMsg = err.response?.data?.message || 
                            "Erreur lors de la finalisation du paiement. Veuillez contacter le support.";
              setError(errorMsg);
              toast.error(errorMsg);
            }
            return false;
          } finally {
            if (isMounted.current) {
              setIsProcessingPayment(false);
            }
          }
        },
        
        // Handle cancel
        onCancel: () => {
          console.log('Payment cancelled by user');
          if (isMounted.current) {
            setIsProcessingPayment(false);
            toast.info("Paiement annulé");
          }
        },
        
        // Handle errors
        onError: (err) => {
          console.error("PayPal error:", err);
          if (isMounted.current) {
            setError("Une erreur est survenue lors du traitement du paiement.");
            setIsProcessingPayment(false);
            toast.error("Une erreur est survenue lors du traitement du paiement.");
          }
        }
      });
      
      // Only try to render if component is still mounted
      if (isMounted.current && buttonContainer) {
        try {
          await buttonInstance.current.render(buttonContainer);
          console.log('PayPal buttons rendered successfully');
        } catch (renderError) {
          if (renderError.message.includes('container element removed from DOM')) {
            console.warn('PayPal container was removed before rendering completed');
          } else if (renderError.message.includes('zoid destroyed')) {
            console.warn('PayPal zoid was destroyed, possibly due to rapid navigation');
          } else {
            console.error('Error rendering PayPal buttons:', renderError);
            if (isMounted.current) {
              setError("Impossible d'afficher les boutons de paiement PayPal.");
            }
          }
        }
      }
    } catch (err) {
      console.error("Error during PayPal button setup:", err);
      if (isMounted.current) {
        setError(`Erreur lors de l'initialisation de PayPal: ${err.message}`);
      }
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md border border-red-300">
        <p className="text-sm text-red-700">{error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      {isProcessingPayment && (
        <div className="flex items-center justify-center mb-4">
          <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-700">Traitement du paiement...</span>
        </div>
      )}
      
      <div 
        ref={paypalButtonRef}
        id="paypal-button-container" 
        className={`paypal-button-container min-h-[150px] ${isProcessingPayment ? 'opacity-50 pointer-events-none' : ''}`}
      ></div>
      
      <p className="mt-2 text-xs text-gray-500 text-center">
        En cliquant sur le bouton de paiement, vous acceptez nos conditions générales et notre politique de confidentialité.
      </p>
    </div>
  );
};

export default PaymentButton;
