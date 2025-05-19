import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ItemVerificationScanner from '../components/ItemVerificationScanner';
import toast from '../components/Toast/index';
import itemsService from '../services/itemsService';

/**
 * Dedicated page for item verification with QR scanner
 */
const VerifyItemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  
  // Fetch the item details on mount
  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!id) {
        setError('Missing item ID');
        setLoading(false);
        return;
      }
      
      try {
        const response = await itemsService.getItemById(id);
        if (response.success) {
          setItem(response.data);
        } else {
          setError(response.error || 'Failed to fetch item details');
        }
      } catch (err) {
        console.error('Error fetching item:', err);
        setError('Failed to fetch item details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchItemDetails();
  }, [id]);
  
  const handleVerificationSuccess = (scannedItem) => {
    setVerificationResult({
      success: true,
      item: scannedItem
    });
    toast.success('Vérification réussie! L\'objet correspond.');
  };

  const handleVerificationFailure = (scannedItem, error) => {
    setVerificationResult({
      success: false,
      item: scannedItem,
      error: error?.message
    });
    toast.error('Échec de la vérification. L\'objet ne correspond pas.');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-red-600 font-medium mb-4">{error}</div>
          <Link
            to={`/items/${id}`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Retour aux détails de l'objet
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header with back button */}
        <div className="flex justify-between items-center mb-6">
          <Link
            to={`/items/${id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Retour
          </Link>
          
          <div className="text-gray-500 text-sm font-medium">
            Vérification #{item?.reference}
          </div>
        </div>
        
        {/* Page content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Vérification de l'objet: {item?.title}
            </h1>
            <p className="text-gray-600 text-sm">
              Scannez le code QR de l'objet pour vérifier s'il correspond.
            </p>
          </div>
          
          {/* Scanner component - with explicit error catching */}
          <div id="scanner-container">
            {item && (
              <ItemVerificationScanner
                currentItemId={id}
                onVerificationSuccess={handleVerificationSuccess}
                onVerificationFailure={handleVerificationFailure}
                onClose={() => navigate(`/items/${id}`)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyItemPage;
