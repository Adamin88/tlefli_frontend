import React, { useState } from 'react';
import CheckoutPaymentForm from './CheckoutPaymentForm';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const PaymentButton = ({ itemId, amount, currency, onSuccess }) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [error, setError] = useState(null);

  // Handle showing payment form
  const handleShowPaymentForm = () => {
    // Check authentication for production
    const isProduction = window.location.hostname === 'tlefli.ma' || 
                       import.meta.env.VITE_ENVIRONMENT === 'production';
    
    if (isProduction && !authService.getToken()) {
      setError('Veuillez vous connecter pour effectuer un paiement');
      toast.error('Authentification requise');
      return;
    }
    
    setError(null);
    setShowPaymentForm(true);
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentResult) => {
    console.log('Payment successful:', paymentResult);
    setShowPaymentForm(false);
    
    if (onSuccess) {
      onSuccess(paymentResult);
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setError(error.message || 'Erreur lors du paiement');
  };

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md border border-red-300">
        <p className="text-sm text-red-700">{error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          onClick={() => setError(null)}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (showPaymentForm) {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setShowPaymentForm(false)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Retour
          </button>
        </div>
        
        <CheckoutPaymentForm
          itemId={itemId}
          amount={amount}
          currency={currency}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Paiement sécurisé
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>Montant: <span className="font-semibold">{amount} {currency}</span></p>
              <p>Votre paiement sera traité de manière sécurisée via Checkout.com.</p>
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleShowPaymentForm}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
      >
        Procéder au paiement
      </button>
      
      <p className="mt-2 text-xs text-gray-500 text-center">
        En cliquant sur le bouton de paiement, vous acceptez nos conditions générales et notre politique de confidentialité.
      </p>
    </div>
  );
};

export default PaymentButton;
