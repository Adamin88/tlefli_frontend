import React, { useState, useEffect } from 'react';
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
  PencilIcon,
  ChartBarIcon,
  XMarkIcon,
  PrinterIcon,
  ClockIcon,
  QrCodeIcon, 
  CameraIcon
} from '@heroicons/react/24/outline';
import { ArrowLeftIcon as ArrowLeftIconSolid } from '@heroicons/react/20/solid';
import itemsService from '../services/itemsService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { CATEGORIES_CONFIG } from '../config/categoriesConfig';
import MatchesList from '../components/MatchesList';
import SecretAnswerVerification from '../components/SecretAnswerVerification';
import QRCodeGenerator from '../components/QRCodeGenerator';
import ItemVerificationScanner from '../components/ItemVerificationScanner';

// Simplified ImageModal Component with fallbacks
const ImageModal = ({ image, onClose }) => {
  if (!image || !image.contentType || !image.data) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 bg-white rounded-full p-2 shadow-lg">
          {XMarkIcon ? <XMarkIcon className="h-6 w-6 text-gray-900" /> : <span>×</span>}
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

// Main component with simplified error handling
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
  const [showFullQR, setShowFullQR] = useState(false);
  const [showVerificationScanner, setShowVerificationScanner] = useState(false);

  // Basic data fetching
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await itemsService.getItemById(id);
        if (response.success) {
          setItem(response.data);
        } else {
          setError(response.error || 'Failed to fetch item details');
        }
      } catch (err) {
        console.error('Error in fetchItem:', err);
        setError('Failed to fetch item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // Simple loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  // Simple error state
  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-red-700 font-medium">Error loading item details</div>
          <div className="text-red-600 mt-1">{error || "Item not found"}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Basic formatter functions - defined outside of JSX render
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const formatRelativeDate = (dateString) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true, locale: fr });
    } catch {
      return dateString;
    }
  };

  const getCategoryLabel = (category) => {
    return CATEGORIES_CONFIG[category]?.label || category;
  };

  const getSubcategoryLabel = (category, subcategory) => {
    return CATEGORIES_CONFIG[category]?.subcategories[subcategory]?.label || subcategory;
  };

  // Simplified status and type colors
  const typeColor = item.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  const typeLabel = item.type === 'lost' ? 'Objet perdu' : 'Objet trouvé';
  
  const statusColorMap = {
    posted: 'bg-gray-100 text-gray-800',
    authenticating: 'bg-yellow-100 text-yellow-800',
    authenticated: 'bg-blue-100 text-blue-800',
    returning: 'bg-purple-100 text-purple-800',
    returned: 'bg-green-100 text-green-800'
  };
  
  const statusLabelMap = {
    posted: 'Publié',
    authenticating: 'En vérification',
    authenticated: 'Authentifié',
    returning: 'En restitution',
    returned: 'Restitué'
  };

  // Base URL for QR codes
  const baseUrl = window.location.origin;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Navigation Bar */}
      <div className="flex justify-between items-center mb-6">
        <Link
          to="/items"
          className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
        >
          {ArrowLeftIconSolid && <ArrowLeftIconSolid className="h-4 w-4 mr-2" />}
          Retour à la liste
        </Link>
        
        {currentUser && (
          <Link
            to={`/items/${item._id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
          >
            {PencilIcon && <PencilIcon className="h-4 w-4 mr-2" />}
            Modifier
          </Link>
        )}
      </div>

      {/* Item Details */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        {/* Status Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeColor}`}>
              {typeLabel}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColorMap[item.status] || 'bg-gray-100 text-gray-800'}`}>
              {statusLabelMap[item.status] || item.status}
            </span>
            <span className="ml-auto inline-flex items-center text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1 rounded-md border border-gray-200">
              Réf: {item.reference}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {item.title}
          </h1>
          
          {/* Publication date */}
          <div className="flex items-center text-xs text-gray-500 mb-4">
            {ClockIcon && <ClockIcon className="h-3.5 w-3.5 mr-1 text-gray-400" />}
            <span>Publié {formatRelativeDate(item.createdAt)}</span>
          </div>
          
          {/* Date & Location */}
          <div className="flex flex-col gap-2 mb-6">
            <div className="inline-flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-md">
              {CalendarIcon && <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />}
              <span>
                {item.type === 'lost' ? 'Perdu le ' : 'Trouvé le '} 
                {formatDate(item.date)}
              </span>
            </div>
            
            {item.location && (
              <div className="inline-flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-md">
                {MapPinIcon && <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400" />}
                <span>{item.location.address}</span>
              </div>
            )}
          </div>
          
          {/* QR Code Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowFullQR(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
            >
              {QrCodeIcon && <QrCodeIcon className="h-4 w-4 mr-1.5" />}
              Afficher le QR Code
            </button>
            <button
              onClick={() => setShowVerificationScanner(true)}
              className="ml-3 inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
            >
              {CameraIcon && <CameraIcon className="h-4 w-4 mr-1.5" />}
              Scanner
            </button>
          </div>
          
          {/* Reward Banner */}
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

          {/* Description */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <div className="prose max-w-none text-gray-600">
              {item.description}
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center text-sm text-gray-600 mb-6">
            {TagIcon && <TagIcon className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" />}
            <span>
              {getCategoryLabel(item.category)}
              {item.subcategory && (
                <> - {getSubcategoryLabel(item.category, item.subcategory)}</>
              )}
            </span>
          </div>

          {/* Subcategory Fields */}
          {item.subcategoryFields && Object.keys(item.subcategoryFields).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Détails spécifiques</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(item.subcategoryFields).map(([key, value]) => (
                  <div key={key} className="flex flex-col bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-500 capitalize mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm text-gray-900">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {currentUser && (currentUser.role === 'business' || currentUser._id === item.reportedBy) && item.contact && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Contact</h2>
              <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                {item.reportedBy && (
                  <div className="flex items-center text-sm text-gray-700">
                    {UserIcon && <UserIcon className="h-5 w-5 mr-3 text-blue-500" />}
                    <span>
                      {item.reportedBy.firstName} {item.reportedBy.lastName}
                    </span>
                  </div>
                )}
                {item.contact.email && (
                  <div className="flex items-center text-sm text-gray-700">
                    {EnvelopeIcon && <EnvelopeIcon className="h-5 w-5 mr-3 text-blue-500" />}
                    <span>{item.contact.email}</span>
                  </div>
                )}
                {item.contact.phone && (
                  <div className="flex items-center text-sm text-gray-700">
                    {PhoneIcon && <PhoneIcon className="h-5 w-5 mr-3 text-blue-500" />}
                    <span>{item.contact.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Images Grid */}
      {item.images && item.images.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-medium text-gray-900">Photos ({item.images.length})</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {item.images.map((image, index) => (
                <div 
                  key={index} 
                  className="aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-90"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={`data:${image.contentType};base64,${image.data}`}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Matches Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            {ChartBarIcon && <ChartBarIcon className="h-5 w-5 mr-2 text-yellow-600" />}
            <h2 className="font-medium text-gray-900">Objets potentiellement correspondants</h2>
          </div>
        </div>
        <div className="p-4">
          {MatchesList ? (
            <MatchesList
              itemId={id}
              isTwinned={!!item.twin}
              twinnedItemId={item.twin?._id}
            />
          ) : (
            <div className="text-gray-500 text-center py-4">
              Le composant de correspondances n'est pas disponible.
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showFullQR && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4" onClick={() => setShowFullQR(false)}>
          <div className="relative bg-white rounded-lg p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowFullQR(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
            >
              {XMarkIcon ? <XMarkIcon className="h-6 w-6" /> : <span>×</span>}
            </button>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title || 'QR Code'}</h3>
              {item.reference && <p className="text-sm text-gray-500 mb-4">Référence: {item.reference}</p>}
              <div className="flex justify-center mb-4">
                {QRCodeGenerator ? (
                  <QRCodeGenerator 
                    value={`${baseUrl}/items/${item._id}`}
                    size={250}
                    itemId={id}
                    itemTitle={item.title}
                    reference={item.reference}
                    hideButtons={true}
                  />
                ) : (
                  <div className="p-4 bg-gray-100 rounded">QR Code unavailable</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showVerificationScanner && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-medium text-gray-900">Scanner de vérification QR</h2>
              <button 
                onClick={() => setShowVerificationScanner(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {XMarkIcon ? <XMarkIcon className="h-5 w-5" /> : <span>×</span>}
              </button>
            </div>
            <div className="p-4">
              {ItemVerificationScanner ? (
                <ItemVerificationScanner
                  currentItemId={id}
                  onClose={() => setShowVerificationScanner(false)}
                />
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Le scanner n'est pas disponible
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* Scanner Button */}
      <div className="fixed right-6 bottom-6 z-50">
        <button
          type="button"
          onClick={() => setShowVerificationScanner(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
        >
          {CameraIcon ? <CameraIcon className="h-6 w-6" /> : "📷"}
        </button>
      </div>
    </div>
  );
}
