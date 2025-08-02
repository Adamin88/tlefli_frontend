import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentButton from '../components/PaymentButton';
import { getItemPaymentStatus } from '../services/itemsService';
import authService from '../services/authService';
import toast from '../components/Toast';

const CheckoutPage = () => {
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItemFromQuery = async () => {
      try {
        setIsLoading(true);

        // Check authentication for production
        const isProduction = window.location.hostname === 'tlefli.ma' || 
                           import.meta.env.VITE_ENVIRONMENT === 'production';
        
        if (isProduction && !authService.getToken()) {
          setError('Authentification requise pour accéder à cette page');
          toast.error('Veuillez vous connecter pour continuer');
          navigate('/login');
          return;
        }

        // Parse the item data from URL query parameters
        const params = new URLSearchParams(location.search);
        const encodedItem = params.get('item');
        
        if (!encodedItem) {
          throw new Error('Aucune information sur l\'objet n\'a été fournie');
        }
        
        const decodedItem = JSON.parse(decodeURIComponent(encodedItem));
        console.log('Decoded item from URL:', decodedItem);
        
        // Validate that we have the minimum required fields
        if (!decodedItem.id) {
          throw new Error('L\'ID de l\'objet est manquant');
        }
        
        // Always set amount to 3.00 EUR regardless of what's in the URL
        decodedItem.amount = 3.00;
        decodedItem.currency = 'EUR';
        
        setItem(decodedItem);
        
        // Fetch latest payment status
        if (decodedItem.id) {
          console.log('Fetching payment status for item:', decodedItem.id);
          const paymentStatusResponse = await getItemPaymentStatus(decodedItem.id);
          
          if (paymentStatusResponse.success) {
            console.log('Payment status received:', paymentStatusResponse.paymentStatus);
            setPaymentStatus(paymentStatusResponse.paymentStatus);
            
            // Redirect back if already paid
            if (paymentStatusResponse.paymentStatus?.paid) {
              toast.success('Cet objet a déjà été payé');
              navigate(`/items/${decodedItem.id}`);
              return;
            }
            
            // Force amount to always be 3.00 EUR
            setItem(prev => ({
              ...prev,
              amount: 3.00,
              currency: 'EUR'
            }));
          } else {
            console.warn('Failed to fetch payment status:', paymentStatusResponse.error);
          }
        }
      } catch (err) {
        console.error('Error loading checkout data:', err);
        setError('Impossible de charger les informations de paiement. Veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemFromQuery();
  }, [location.search, navigate]);

  const handlePaymentSuccess = (paymentResult) => {
    console.log('Payment successful:', paymentResult);
    toast.success('Paiement réussi ! Vous allez être redirigé...');
    
    // Redirect back to item page after successful payment
    setTimeout(() => {
      navigate(`/items/${item.id}`);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-lg w-full">
          <h2 className="text-xl font-semibold text-red-800 mb-4">Erreur</h2>
          <p className="text-red-700">{error || 'Impossible de charger les informations de paiement.'}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => navigate(-1)}
          >
            Retourner à la page précédente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-xl font-semibold text-white">Paiement des frais de réclamation</h1>
          </div>
          
          {/* Item summary */}
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Résumé de l'objet</h2>
            <div className="mt-4 flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Objet</p>
                <p className="text-md font-medium">{item.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Référence</p>
                <p className="text-md font-medium">{item.reference}</p>
              </div>
            </div>
          </div>
          
          {/* Payment details */}
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Détails du paiement</h2>
            
            {/* Production environment notice */}
            {(window.location.hostname === 'tlefli.ma' || import.meta.env.VITE_ENVIRONMENT === 'production') && (
              <div className="mt-2 mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex">
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
                      <p>Votre paiement sera traité de manière sécurisée via PayPal. Les frais de réclamation sont obligatoires pour les objets trouvés authentifiés.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-4 bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between text-sm mb-2">
                <span>Frais de réclamation:</span>
                <span className="font-medium">{item.amount} {item.currency}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="font-medium">Total:</span>
                <span className="font-bold">{item.amount} {item.currency}</span>
              </div>
            </div>
          </div>
          
          {/* Payment Button */}
          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Procéder au paiement</h2>
            <PaymentButton 
              itemId={item.id}
              amount={item.amount}
              currency={item.currency}
              onSuccess={handlePaymentSuccess}
            />
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50">
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Retourner à la page précédente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
