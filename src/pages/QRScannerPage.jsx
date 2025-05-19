import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import itemsService from '../services/itemsService';
import { 
  ClockIcon, 
  MapPinIcon, 
  CalendarIcon, 
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CATEGORIES_CONFIG } from '../config/categoriesConfig';

const QRScannerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        // Use the public QR code endpoint
        const response = await fetch(`/api/items/qr/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch item details');
        }
        
        const data = await response.json();
        if (data.success && data.data) {
          setItem(data.data);
        } else {
          throw new Error(data.message || 'Item not found');
        }
      } catch (error) {
        console.error('Error fetching item from QR code:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItemDetails();
    }
  }, [id]);

  const renderStatusBadge = (status) => {
    const statusConfig = {
      posted: { color: 'bg-blue-100 text-blue-800', label: 'Publié' },
      authenticating: { color: 'bg-yellow-100 text-yellow-800', label: 'En cours d\'authentification' },
      authenticated: { color: 'bg-green-100 text-green-800', label: 'Authentifié' },
      returning: { color: 'bg-purple-100 text-purple-800', label: 'En cours de retour' },
      returned: { color: 'bg-gray-100 text-gray-800', label: 'Retourné' }
    };

    const config = statusConfig[status] || statusConfig.posted;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Chargement des détails de l'objet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="flex items-center justify-center mb-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-center text-gray-900 mb-4">Erreur</h1>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-xl font-bold text-center text-gray-900 mb-4">Objet non trouvé</h1>
          <p className="text-gray-600 text-center mb-6">L'objet que vous recherchez n'existe pas ou a été supprimé.</p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getCategoryLabel = () => {
    if (!item.category || !item.subcategory) return 'Non catégorisé';
    
    const categoryLabel = CATEGORIES_CONFIG[item.category]?.label || item.category;
    const subcategoryLabel = CATEGORIES_CONFIG[item.category]?.subcategories[item.subcategory]?.label || item.subcategory;
    
    return `${categoryLabel} - ${subcategoryLabel}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Retour
          </button>
        </div>
        
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold text-gray-900 break-words pr-4">{item.title}</h1>
              <div className="flex flex-col items-end">
                {renderStatusBadge(item.status)}
                <span className="text-sm text-gray-500 mt-2">Réf: {item.reference}</span>
              </div>
            </div>
            
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <span>Publié le {formatDate(item.createdAt)}</span>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="flex justify-between">
                <div className="text-sm font-medium text-gray-500">Type</div>
                <div className="text-sm text-gray-900">
                  {item.type === 'lost' ? 'Objet perdu' : 'Objet trouvé'}
                </div>
              </div>
              
              <div className="mt-3 flex justify-between">
                <div className="text-sm font-medium text-gray-500">Catégorie</div>
                <div className="text-sm text-gray-900">
                  {getCategoryLabel()}
                </div>
              </div>
              
              {item.location && (item.location.name || item.location.address) && (
                <div className="mt-3 flex justify-between">
                  <div className="text-sm font-medium text-gray-500">Lieu</div>
                  <div className="text-sm text-gray-900 text-right">
                    {item.location.name || item.location.address}
                  </div>
                </div>
              )}
              
              {item.date && (
                <div className="mt-3 flex justify-between">
                  <div className="text-sm font-medium text-gray-500">Date</div>
                  <div className="text-sm text-gray-900">
                    {formatDate(item.date)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900">Description</h3>
              <div className="mt-2 text-sm text-gray-500 whitespace-pre-wrap">
                {item.description || 'Aucune description fournie.'}
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800">Information</h3>
                <p className="mt-2 text-sm text-blue-700">
                  {item.type === 'lost' ? (
                    'Cet objet est actuellement recherché par son propriétaire.'
                  ) : (
                    'Cet objet a été trouvé et est en attente de récupération par son propriétaire.'
                  )}
                </p>
                
                <div className="mt-4">
                  <button
                    onClick={() => navigate(`/items/${item._id}`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Voir tous les détails
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;
