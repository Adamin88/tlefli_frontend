import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { format, formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CalendarIcon, 
  MapPinIcon, 
  TagIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  PencilIcon,
  ChartBarIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowsPointingInIcon,
  PrinterIcon, // Make sure PrinterIcon is imported here
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import itemsService from '../services/itemsService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { CATEGORIES_CONFIG } from '../config/categoriesConfig'
// Importer toutes les icônes depuis categoriesConfig
import * as CategoryIcons from '../config/categoriesConfig';
import MatchesList from '../components/MatchesList';
import { ArrowLeftIcon as ArrowLeftIconSolid } from '@heroicons/react/20/solid';
import axios from 'axios';
import SecretAnswerVerification from '../components/SecretAnswerVerification';
import QRCodeGenerator from '../components/QRCodeGenerator';
import ItemVerificationScanner from '../components/ItemVerificationScanner';
import { QrCodeIcon, CameraIcon } from '@heroicons/react/24/outline';

// Image Modal Component
const ImageModal = ({ image, onClose }) => {
  if (!image) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 focus:outline-none"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6 text-gray-900" />
        </button>
        <img
          src={`data:${image.contentType};base64,${image.data}`}
          alt="Full size"
          className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
        />
      </div>
    </div>
  );
};

// Composant Slider d'images
const ImageSlider = ({ images, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);

  const goToPrevious = (e) => {
    e.stopPropagation();
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = (e) => {
    e.stopPropagation();
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="relative h-64 w-full">
      <div 
        className="h-full w-full relative overflow-hidden rounded-lg bg-gray-100"
        onClick={() => onImageClick(images[currentIndex])}
      >
        <img
          src={`data:${images[currentIndex].contentType};base64,${images[currentIndex].data}`}
          alt={`Image ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        {images[currentIndex].isMain && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              Principal
            </span>
          </div>
        )}
      </div>

      {/* Boutons de navigation */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-md text-gray-800"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-md text-gray-800"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>

      {/* Indicateurs de position */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Fonction pour formater la date relative (il y a X temps)
const formatRelativeDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { 
      addSuffix: true,
      locale: fr 
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const SecretAnswersSection = ({ item }) => {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnswers = async () => {
    try {
      console.log('Fetching answers for item:', item._id);
      const response = await itemsService.getSecretAnswers(item._id);
      console.log('Received answers:', {
        count: response.answers?.length || 0,
        answers: response.answers
      });
      
      // Use the answers array from the response
      setAnswers(response.answers || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching answers:', err);
      setError('Failed to load secret answers');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (item.type === 'found' && item.secretQuestion) {
      console.log('Initial answers fetch for item:', item._id);
      fetchAnswers();
    }
  }, [item]);

  // Set up polling for updates
  useEffect(() => {
    if (item.type === 'found' && item.secretQuestion) {
      console.log('Setting up polling for item:', item._id);
      const interval = setInterval(() => {
        console.log('Polling for new answers...');
        fetchAnswers();
      }, 5000);
      return () => {
        console.log('Cleaning up polling interval');
        clearInterval(interval);
      };
    }
  }, [item]);

  const handleVerifyAnswer = async (answerId, isCorrect) => {
    try {
      await itemsService.verifySecretAnswer(item._id, answerId, isCorrect);
      
      // Refresh the answers list
      await fetchAnswers();

    } catch (err) {
      console.error('Une erreur est survenue lors de la vérification');
    }
  };

  if (loading) return <div className="text-center py-4">Chargement des réponses...</div>;
  if (error) return <div className="text-red-600 py-4">{error}</div>;
  if (!answers.length) return null;

  return (
    <div className="mt-6 bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Réponses à la question secrète
        </h3>
        <div className="mt-4 space-y-4">
          {answers.map((answer) => (
            <div
              key={answer._id}
              className={`border rounded-lg p-4 ${
                answer.verified
                  ? answer.isCorrect
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">
                    Réponse de {answer.user?.name || `${answer.user?.firstName || ''} ${answer.user?.lastName || ''}`}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {answer.answer}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(answer.createdAt).toLocaleString()}
                  </p>
                </div>
                {!answer.verified && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVerifyAnswer(answer._id, true)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Valider
                    </button>
                    <button
                      onClick={() => handleVerifyAnswer(answer._id, false)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Refuser
                    </button>
                  </div>
                )}
                {answer.verified && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      answer.isCorrect
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {answer.isCorrect ? 'Validée' : 'Refusée'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isTwinned, setIsTwinned] = useState(false);
  const [isTwinning, setIsTwinning] = useState(false);
  const [showFullQR, setShowFullQR] = useState(false);
  const [showVerificationScanner, setShowVerificationScanner] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Check if scanner should be shown from location state - now available for all users
  useEffect(() => {
    if (location.state?.openVerificationScanner) {
      setShowVerificationScanner(true);
      // Clear the state to prevent reopening on page refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await itemsService.getItemById(id);
        if (response.success) {
          console.log('Item data received:', response.data);
          
          // Set the item data first, so we at least have the basic item details
          // even if fetching secret answers fails
          setItem(response.data);

          // If it's a found item with a secret question, fetch answers
          if (response.data.type === 'found' && response.data.secretQuestion) {
            try {
              const secretAnswersResponse = await itemsService.getSecretAnswers(response.data._id);
              console.log('Secret answers response:', secretAnswersResponse);
              
              if (secretAnswersResponse && secretAnswersResponse.answers) {
                // Ensure answers are properly structured
                const formattedAnswers = secretAnswersResponse.answers.map(answer => ({
                  ...answer,
                  user: answer.user || { _id: answer.userId },
                  submittedAt: answer.submittedAt || answer.createdAt
                }));
                
                // Update the item with the answers
                setItem(prevItem => ({
                  ...prevItem,
                  secretAnswers: formattedAnswers
                }));
              } else {
                console.warn('No secret answers found or invalid response structure');
                // Still keep the item data without secret answers
              }
            } catch (answerErr) {
              // Log the error but don't fail the whole item loading
              console.error('Error fetching secret answers:', answerErr);
            }
          }
        } else {
          setError(response.error || 'Impossible de charger cet objet');
        }
      } catch (err) {
        console.error('Error in fetchItem:', err);
        // Check if it's an authorization error
        if (err.response?.status === 403) {
          setError('You are not authorized to view this item. Only the item owner can access these details.');
        } else if (err.response?.status === 401) {
          setError('Authentication required to view item details.');
        } else {
          setError(err.response?.data?.message || err.message || 'Impossible de charger cet objet');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, currentUser]); // Add currentUser dependency

  useEffect(() => {
    setIsTwinned(item?.twin?.isTwinned || false);
  }, [item?.twin]);

  const handleVerifyAnswer = async (answerId, isCorrect) => {
    try {
      const response = await itemsService.verifySecretAnswer(item._id, answerId, isCorrect);
      
      if (response.success) {
        // Update local item state with new status
        setItem(prevItem => ({
          ...prevItem,
          status: response.data.newStatus
        }));

        // Refresh both items' data
        const [foundItemResponse, lostItemResponse] = await Promise.all([
          itemsService.getItemById(response.data.foundItem.id),
          itemsService.getItemById(response.data.lostItem.id)
        ]);

        if (foundItemResponse.success) {
          setItem(foundItemResponse.data);
        }

        // Refresh the answers list
        const fetchAnswers = async () => {
          try {
            console.log('Fetching answers for item:', item._id);
            const response = await itemsService.getSecretAnswers(item._id);
            console.log('Received answers:', {
              count: response.answers?.length || 0,
              answers: response.answers
            });
            setAnswers(response.answers);
          } catch (err) {
            console.error('Error fetching answers:', err);
          }
        };
        await fetchAnswers();
      }
    } catch (error) {
      console.error('Error verifying answer:', error);
    }
  };

  const handleStatusUpdate = (newStatus) => {
    console.log('Updating item status from', item.status, 'to', newStatus);
    setItem({ ...item, status: newStatus });
  };

  const handleMatchedItemsStatusUpdate = async (matchedItemId, newStatus) => {
    if (!newStatus) {
      console.error('No status provided for update');
      return;
    }

    console.log('Updating status for both items:', { currentItemId: id, matchedItemId, newStatus });
    
    try {
      // Update current item status
      const currentItemResponse = await itemsService.updateItemStatus(id, newStatus);
      if (currentItemResponse.success) {
        setItem(prevItem => ({ ...prevItem, status: newStatus }));
        
        // Update matched item status
        const matchedItemResponse = await itemsService.updateItemStatus(matchedItemId, newStatus);
        if (matchedItemResponse.success) {
          console.log('Successfully updated both items to status:', newStatus);
        } else {
          console.error('Failed to update matched item status:', matchedItemResponse.error);
        }
      } else {
        console.error('Failed to update current item status:', currentItemResponse.error);
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const handleTwinItems = async (matchedItemId, twinId, twinState = true) => {
    if (!matchedItemId) {
      console.error('No matched item ID provided', { matchedItemId });
      return { success: false, error: 'ID de l\'objet correspondant manquant' };
    }

    setIsTwinning(true);
    try {
      console.log('Twinning items:', {
        currentItemId: id,
        matchedItemId,
        twinId,
        twinState,
        initiatedBy: currentUser._id
      });
      
      const response = await itemsService.twinItems(
        matchedItemId,  // first item ID
        twinId || id,   // second item ID (use twinId if provided, otherwise use current item id)
        twinState       // twin state (true for twinning, false for untwinning)
      );
      
      if (response.success) {
        // Update the current item with the fresh data
        const updatedItem = response.data.item1;
        if (updatedItem) {
          setItem(updatedItem);
          setIsTwinned(updatedItem.twin?.isTwinned || false);
        }

        // Refresh notifications
        console.log('Refreshing notifications after twin action');
        try {
          await fetchNotifications();
          console.log('Notifications refreshed successfully');
        } catch (error) {
          console.error('Error refreshing notifications:', error);
        }

        return { success: true, data: response.data };
      } else {
        console.error('Twinning error:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error in handleTwinItems:', error);
      return { success: false, error: error.message };
    } finally {
      setIsTwinning(false);
    }
  };

  const renderSecretAnswers = () => {
    if (!item.secretAnswers?.length) {
      return <div className="text-sm text-gray-500">Aucune réponse soumise</div>;
    }

    return (
      <div className="space-y-4">
        {item.secretAnswers.map((answer) => (
          <SecretAnswerVerification
            key={answer._id}
            answer={answer}
            item={item}
            onVerificationComplete={handleVerificationComplete}
          />
        ))}
      </div>
    );
  };

  const handleVerificationComplete = async (verified) => {
    if (verified) {
      await fetchItemDetails();
    }
  };

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const response = await itemsService.getItemById(id);
      if (response.success) {
        setItem(response.data);
      } else {
        console.error('Failed to refresh item details');
      }
    } catch (err) {
      console.error('Error fetching item details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = (scannedItem) => {
    setVerificationResult({
      success: true,
      item: scannedItem
    });
  };

  const handleVerificationFailure = (scannedItem, error) => {
    setVerificationResult({
      success: false,
      item: scannedItem,
      error: error?.message
    });
  };

  // Add this as a direct button component that will always show for all users
  const ScannerButton = () => {
    return (
      <div className="fixed right-6 bottom-6 z-50" style={{ zIndex: 1000 }}>
        <button
          type="button"
          onClick={() => setShowVerificationScanner(true)}
          style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            borderRadius: '9999px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: 'none',
            cursor: 'pointer',
            width: '56px',
            height: '56px'
          }}
        >
          <CameraIcon style={{ height: '24px', width: '24px' }} />
        </button>
      </div>
    );
  };

  // Replace the verification section with this simplified version - available for all users
  const renderVerificationSection = () => {
    if (showVerificationScanner) {
      return (
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="p-4">
            <ItemVerificationScanner
              currentItemId={id}
              onVerificationSuccess={handleVerificationSuccess}
              onVerificationFailure={handleVerificationFailure}
              onClose={() => setShowVerificationScanner(false)}
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Scanner de vérification</h2>
        </div>
        <div className="p-6 text-center">
          <p className="mb-4 text-gray-600">
            Cliquez sur le bouton ci-dessous pour scanner un code QR et vérifier s'il correspond à cet objet.
          </p>
          <button
            type="button"
            onClick={() => setShowVerificationScanner(true)}
            style={{
              backgroundColor: '#4f46e5',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <CameraIcon style={{ height: '20px', width: '20px', marginRight: '8px' }} />
            <span>Activer le scanner</span>
          </button>
        </div>
      </div>
    );
  };

  // Fonction pour obtenir l'icône de la catégorie
  const getCategoryIcon = (category) => {
    if (!category || !CATEGORIES_CONFIG[category]) return null;
    
    const IconComponent = CATEGORIES_CONFIG[category].icon;
    return IconComponent ? <IconComponent className="h-5 w-5 text-gray-600" /> : null;
  };

  // Fonction pour obtenir l'icône de la sous-catégorie
  const getSubcategoryIcon = (category, subcategory) => {
    if (!category || !subcategory || !CATEGORIES_CONFIG[category]?.subcategories[subcategory]) {
      return null;
    }
    
    const IconComponent = CATEGORIES_CONFIG[category].subcategories[subcategory].icon;
    return IconComponent ? <IconComponent className="h-5 w-5 text-gray-600 mr-2" /> : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-yellow-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des détails de l'objet...</p>
          <p className="mt-1 text-sm text-gray-500">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    const isUnauthorized = error && error.includes('not authorized');
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {isUnauthorized ? (
            // Unauthorized Access UI
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
              {/* Header with icon */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-center">
                <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <EyeSlashIcon className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Accès Restreint</h1>
                <p className="text-amber-100 mt-2">Cette page n'est pas accessible</p>
              </div>
              
              {/* Content */}
              <div className="px-6 py-8">
                <div className="text-center mb-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <ShieldExclamationIcon className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-amber-800 text-sm font-medium">
                      Seul le propriétaire de l'objet peut consulter ces détails
                    </p>
                  </div>
                  
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Pour des raisons de confidentialité et de sécurité, vous ne pouvez voir que les objets que vous avez déclarés.
                  </p>
                </div>
                
                {/* Action buttons */}
                <div className="space-y-3">
                  <Link
                    to="/items"
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Retour à la liste des objets
                  </Link>
                  
                  <Link
                    to="/dashboard"
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <HomeIcon className="h-5 w-5 mr-2" />
                    Aller au tableau de bord
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            // General Error UI
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
              {/* Header with icon */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center">
                <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <ExclamationTriangleIcon className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Erreur de Chargement</h1>
                <p className="text-red-100 mt-2">Impossible de charger les détails</p>
              </div>
              
              {/* Content */}
              <div className="px-6 py-8">
                <div className="text-center mb-6">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {error || "L'objet demandé n'existe pas ou n'est plus disponible."}
                  </p>
                </div>
                
                {/* Action buttons */}
                <div className="space-y-3">
                  <Link
                    to="/items"
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Retour à la liste des objets
                  </Link>
                  
                  <Link
                    to="/dashboard"
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <HomeIcon className="h-5 w-5 mr-2" />
                    Aller au tableau de bord
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const typeColors = {
    lost: 'bg-red-100 text-red-800',
    found: 'bg-green-100 text-green-800'
  };

  const statusColors = {
    posted: 'bg-gray-100 text-gray-800',
    authenticating: 'bg-yellow-100 text-yellow-800',
    authenticated: 'bg-blue-100 text-blue-800',
    returning: 'bg-purple-100 text-purple-800',
    returned: 'bg-green-100 text-green-800'
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };

  // Get the base URL from the current location
  const baseUrl = window.location.origin;

  const QRCodeModal = ({ value, title, reference, onClose }) => {
    if (!value) return null;
    
    return (
      <div 
        className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="relative bg-white rounded-lg p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title || 'QR Code'}</h3>
            {reference && <p className="text-sm text-gray-500 mb-4">Référence: {reference}</p>}
            <div className="flex justify-center mb-4 QRCodeModal">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                <QRCodeGenerator 
                  value={value}
                  size={250}
                  itemId={id}
                  itemTitle={title}
                  reference={reference}
                  hideButtons={true}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Ce code QR contient un lien direct vers les détails de cet objet.
            </p>
            <button
              onClick={printQRCode}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PrinterIcon className="h-4 w-4 mr-1.5" />
              Imprimer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Function to print QR code
  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    
    // Create a QR code SVG data URL instead of using an image URL
    const qrCodeSvg = document.querySelector(".QRCodeModal svg");
    let qrCodeHtml = '';
    
    if (qrCodeSvg) {
      // If we can find the SVG in the DOM, use it directly
      const svgData = new XMLSerializer().serializeToString(qrCodeSvg);
      qrCodeHtml = svgData;
    } else {
      // Fallback to an API endpoint that generates QR codes if available
      qrCodeHtml = `<img src="${baseUrl}/api/items/${item._id}/qrcode?size=300" alt="QR Code" style="width:300px;height:300px;" />`;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${item.title || item.reference || 'Item'}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 8px;
            }
            .qr-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              text-align: center;
            }
            .qr-reference {
              font-size: 14px;
              margin-bottom: 15px;
              text-align: center;
            }
            .qr-instructions {
              font-size: 12px;
              color: #666;
              margin-top: 15px;
              text-align: center;
              max-width: 300px;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <button class="no-print" onclick="window.print()" style="position:fixed; top:20px; right:20px; padding:10px; background:#4f46e5; color:white; border:none; border-radius:4px; cursor:pointer;">
            Imprimer
          </button>
          <div class="qr-container">
            <div class="qr-title">${item.title || 'Objet perdu/trouvé'}</div>
            ${item.reference ? `<div class="qr-reference">Réf: ${item.reference}</div>` : ''}
            <div style="margin: 20px 0;">
              ${qrCodeHtml}
            </div>
            <div class="qr-instructions">
              Scannez ce code QR pour accéder aux détails de l'objet
              ${item.reference ? `<br>Référence: ${item.reference}` : ''}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    // Give a moment to load before printing
    setTimeout(() => {
      printWindow.focus();
    }, 300);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Navigation and Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <Link
          to="/items"
          className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
        >
          <ArrowLeftIconSolid className="h-4 w-4 mr-2" />
          Retour à la liste
        </Link>
        {currentUser && (
          <Link
            to={`/items/${item._id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 shadow-sm transition-colors duration-200"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Modifier
          </Link>
        )}
      </div>

      {/* ROW 1: Item Details and QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Item Details Card - Takes full row if no images, otherwise 2/3 of the row on large screens */}
        <div className={`${item.images && item.images.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl shadow-md overflow-hidden`}>
          {/* Status Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeColors[item.type]}`}>
                {item.type === 'lost' ? 'Objet perdu' : 'Objet trouvé'}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[item.status]}`}>
                {item.status === 'posted' ? 'Publié' : 
                 item.status === 'authenticating' ? 'En vérification' : 
                 item.status === 'authenticated' ? 'Authentifié' : 
                 item.status === 'returning' ? 'En restitution' : 
                 item.status === 'returned' ? 'Restitué' : 
                 item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
              <span className="ml-auto inline-flex items-center text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1 rounded-md border border-gray-200">
                Réf: {item.reference}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Title with subcategory icon */}
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
              {getSubcategoryIcon(item.category, item.subcategory)}
              {item.title}
            </h1>
            
            {/* Publication date - small text under title */}
            <div className="flex items-center text-xs text-gray-500 mb-4">
              <ClockIcon className="h-3.5 w-3.5 mr-1 text-gray-400" />
              <span>Publié {formatRelativeDate(item.createdAt)}</span>
            </div>
            
            {/* Publication Date, Found/Lost Date, and QR Code Side-by-Side */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
              {/* Dates Section */}
              <div className="flex flex-col gap-2">
                {/* Publication date moved above, removing from here */}
                <div className="inline-flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-md">
                  <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                  <span>
                    {item.type === 'lost' ? 'Perdu le ' : 'Trouvé le '} 
                    {formatDate(item.date)}
                  </span>
                </div>
                {/* Location moved here, close to dates */}
                {item.location && (
                  <div className="inline-flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-md">
                    <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    <span>{item.location.address}</span>
                  </div>
                )}
              </div>
              
              {/* Compact QR Code */}
              <div className="flex items-center bg-gray-50 rounded-md p-2 gap-3">
                <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200">
                  <QRCodeGenerator 
                    value={`${baseUrl}/items/${item._id}`}
                    size={70}
                    itemId={item._id}
                    itemTitle={item.title}
                    reference={item.reference}
                    hideButtons={true}
                  />
                </div>
                <div className="flex flex-col">
                  <button
                    onClick={() => setShowFullQR(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <QrCodeIcon className="h-3 w-3 mr-1" />
                    Agrandir
                  </button>
                  <button
                    onClick={() => setShowVerificationScanner(true)}
                    className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <CameraIcon className="h-3 w-3 mr-1" />
                    Scanner
                  </button>
                </div>
              </div>
            </div>
            
            {/* Reward Banner for Lost Items */}
            {item.type === 'lost' && item.reward && (
              <div className="mb-6">
                <div className="inline-block bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  <div className="flex items-center">
                    <span className="text-amber-500 text-xl mr-2">🎁</span>
                    <span className="text-amber-700 font-medium">
                      Récompense: {item.reward.amount} {item.reward.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description with heading */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
              <div className="prose max-w-none text-gray-600">
                {item.description}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              {/* Category - Only use TagIcon (no subcategory icon here) */}
              <div className="flex items-center text-sm text-gray-600">
                <TagIcon className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" />
                <span>
                  {CATEGORIES_CONFIG[item.category]?.label}
                  {item.subcategory && (
                    <>
                      {' - '}
                      {CATEGORIES_CONFIG[item.category]?.subcategories[item.subcategory]?.label}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Subcategory Fields - With subcategory icon */}
            {item.subcategoryFields && Object.keys(item.subcategoryFields).length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  {getSubcategoryIcon(item.category, item.subcategory)}
                  <span>Détails spécifiques</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(item.subcategoryFields).map(([key, value]) => (
                    <div key={key} className="flex flex-col bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-500 capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm text-gray-900">
                        {Array.isArray(value) ? value.join(', ') : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information (if user is authorized) */}
            {currentUser && (currentUser.role === 'business' || currentUser._id === item.reportedBy) && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Contact</h2>
                <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                  {item.reportedBy && (
                    <div className="flex items-center text-sm text-gray-700">
                      <UserIcon className="h-5 w-5 mr-3 text-blue-500" />
                      <span>{item.reportedBy.firstName} {item.reportedBy.lastName}</span>
                    </div>
                  )}
                  {item.contact?.email && (
                    <div className="flex items-center text-sm text-gray-700">
                      <EnvelopeIcon className="h-5 w-5 mr-3 text-blue-500" />
                      <span>{item.contact.email}</span>
                    </div>
                  )}
                  {item.contact?.phone && (
                    <div className="flex items-center text-sm text-gray-700">
                      <PhoneIcon className="h-5 w-5 mr-3 text-blue-500" />
                      <span>{item.contact.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Images - Only show if there are images */}
        {item.images && item.images.length > 0 ? (
          <div className="lg:col-span-1 space-y-6">
            {/* Images Section with Slider */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-medium text-gray-900">Photos ({item.images.length})</h2>
              </div>
              <div className="p-4">
                {/* Image Slider */}
                <ImageSlider 
                  images={item.images} 
                  onImageClick={setSelectedImage} 
                />
                
                {/* Miniatures des images */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {item.images.slice(0, 8).map((image, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-90 border-2 border-transparent hover:border-yellow-500"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={`data:${image.contentType};base64,${image.data}`}
                        alt={`${item.title} - Miniature ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ROW 2: Secret Answer Verification */}
      {(() => {
        const isFoundItem = item.type === 'found';
        const hasSecretAnswers = !!item.secretAnswers;
        const hasAnswersLength = item.secretAnswers && item.secretAnswers.length > 0;
        const hasCurrentUser = !!currentUser;
        const isReporter = currentUser && item.reportedBy && (
          typeof item.reportedBy === 'object' 
            ? currentUser.id.toString() === item.reportedBy._id.toString() 
            : currentUser.id.toString() === item.reportedBy.toString()
        );
        
        return isFoundItem && hasSecretAnswers && hasAnswersLength && hasCurrentUser && isReporter && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-medium text-gray-900">Réponses à la question secrète</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {item.secretAnswers.map((answer) => (
                    <SecretAnswerVerification
                      key={answer._id}
                      answer={answer}
                      item={item}
                      onVerificationComplete={handleVerificationComplete}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ROW 3: Matches Section */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5 text-yellow-600" />
                <h2 className="font-medium text-gray-900">Objets potentiellement correspondants</h2>
              </div>
            </div>
          </div>
          <div className="p-4">
            <MatchesList 
              itemId={id} 
              isTwinned={!!item.twin}
              twinnedItemId={item.twin?._id}
              onMatchedItemStatusUpdate={handleMatchedItemsStatusUpdate} 
              onStatusUpdate={handleStatusUpdate} 
              onTwinItems={handleTwinItems} 
            />
          </div>
        </div>
      </div>

      {/* Verification Scanner Modal */}
      {showVerificationScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-medium text-gray-900">Scanner de vérification QR</h2>
              <button 
                onClick={() => setShowVerificationScanner(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <ItemVerificationScanner
                currentItemId={id}
                onVerificationSuccess={handleVerificationSuccess}
                onVerificationFailure={handleVerificationFailure}
                onClose={() => setShowVerificationScanner(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showFullQR && (
        <QRCodeModal
          value={`${baseUrl}/items/${item._id}`}
          title={item.title}
          reference={item.reference}
          onClose={() => setShowFullQR(false)}
        />
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
