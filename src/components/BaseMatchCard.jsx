import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  MapPinIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { CATEGORIES_CONFIG } from '../config/categoriesConfig';
// Import the icons for use in category display
import * as CategoryIcons from '../config/categoriesConfig';

// Enhanced Image Modal Component with navigation
const ImageModal = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Added null check to prevent undefined return
  if (!images || images.length === 0) {
    return null;
  }
  
  // Ensure currentIndex is valid
  const safeIndex = currentIndex >= 0 && currentIndex < images.length ? currentIndex : 0;
  const currentImage = images[safeIndex];
  
  // Ensure currentImage exists before using it
  if (!currentImage) {
    return null;
  }
  
  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 focus:outline-none"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6 text-gray-900" />
        </button>
        
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 bg-white/70 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="h-6 w-6 text-gray-900" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 bg-white/70 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
              aria-label="Next image"
            >
              <ChevronRightIcon className="h-6 w-6 text-gray-900" />
            </button>
          </>
        )}
        
        <img
          src={`data:${currentImage.contentType};base64,${currentImage.data}`}
          alt="Full size"
          className="max-h-[85vh] max-w-full object-contain rounded-lg"
        />
        
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="bg-black/30 rounded-full px-3 py-1.5 backdrop-blur-sm">
              <div className="flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={`w-2.5 h-2.5 rounded-full ${
                      index === safeIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BaseMatchCard = ({
  match,
  showDetails,
  setShowDetails,
  itemReference,
  forceRender,
  children,
  renderHeader,
  renderDetailsContent,
  renderFooter,
  renderActionButtons,
  onVerificationComplete,
  renderHeaderExtras
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [detailsAnimating, setDetailsAnimating] = useState(false);

  // Modern status badges with meaningful colors
  const statusBadges = {
    posted: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Publié' },
    authenticating: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'En authentification' },
    authenticated: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Authentifié' },
    returning: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En retour' },
    returned: { bg: 'bg-green-100', text: 'text-green-800', label: 'Retourné' }
  };

  const typeBadges = {
    lost: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Perdu' },
    found: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Trouvé' }
  };

  useEffect(() => {
    // Animate score counter on mount
    // Default to 0 if match.score is undefined
    const scoreTarget = match?.score ? Math.round(match.score) : 0;
    let start = 0;
    const duration = 1500;
    const frameRate = 1000 / 60; // 60fps
    const increment = scoreTarget / (duration / frameRate);
    
    // Entrance animation
    setIsVisible(true);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= scoreTarget) {
        setAnimatedScore(scoreTarget);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, frameRate);
    
    return () => clearInterval(timer);
  }, [match?.score]);
  
  // Enhanced toggle details with animation management
  const toggleDetails = () => {
    if (!showDetails) {
      // Opening details
      setShowDetails(true);
      setDetailsAnimating(true);
      setTimeout(() => setDetailsAnimating(false), 300); // Match transition duration
    } else {
      // Closing details
      setDetailsAnimating(true);
      setTimeout(() => {
        setShowDetails(false);
        setDetailsAnimating(false);
      }, 300);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date to relative time (e.g., "il y a 5 minutes", "il y a 2 jours")
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // Less than a minute
    if (diffInSeconds < 60) {
      return 'à l\'instant';
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    
    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
    
    // Less than a month (approximation)
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }
    
    // Less than a year (approximation)
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `il y a ${months} mois`;
    }
    
    // More than a year
    const years = Math.floor(diffInSeconds / 31536000);
    return `il y a ${years} an${years > 1 ? 's' : ''}`;
  };

  // Get category and subcategory icons with enhanced error handling
  const getCategoryIcon = (category) => {
    if (!category || !CATEGORIES_CONFIG[category] || !CATEGORIES_CONFIG[category].icon) {
      return null;
    }
    const IconComponent = CATEGORIES_CONFIG[category].icon;
    return IconComponent ? React.createElement(IconComponent, { className: "h-5 w-5 text-gray-500" }) : null;
  };

  const getSubcategoryIcon = (category, subcategory) => {
    if (!category || !subcategory || 
        !CATEGORIES_CONFIG[category] || 
        !CATEGORIES_CONFIG[category].subcategories || 
        !CATEGORIES_CONFIG[category].subcategories[subcategory] ||
        !CATEGORIES_CONFIG[category].subcategories[subcategory].icon) {
      return null;
    }
    
    const iconName = CATEGORIES_CONFIG[category].subcategories[subcategory].icon.name;
    if (!iconName || !CategoryIcons[iconName]) {
      return null;
    }
    
    return React.createElement(CategoryIcons[iconName], { className: "h-5 w-5 text-gray-500 mr-1.5" });
  };

  // Enhanced error handling for invalid match data
  if (!match || !match.item) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4">
          <div className="text-red-500">Données de correspondance invalides</div>
        </div>
      </div>
    );
  }

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 45) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const scoreColorClass = getScoreColor(animatedScore);
  const scoreRingColorClass = scoreColorClass.replace('text-', 'ring-');

  // Safely get type and status values with fallbacks
  const itemType = match.item.type || 'found';
  const itemStatus = match.item.status || 'posted';
  
  // Safe values for type and status badges
  const typeBadge = typeBadges[itemType] || typeBadges.found;
  const statusBadge = statusBadges[itemStatus] || statusBadges.posted;

  // Safe category and subcategory values
  const categoryKey = match.item.category && CATEGORIES_CONFIG[match.item.category] ? match.item.category : null;
  const subcategoryKey = categoryKey && match.item.subcategory && CATEGORIES_CONFIG[categoryKey]?.subcategories[match.item.subcategory] ? match.item.subcategory : null;

  return (
    <div 
      className={`bg-white rounded-xl shadow-lg hover:shadow-xl border border-gray-100 
                  transition-all duration-300 ease-in-out mb-5 overflow-hidden 
                  transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      key={`match-${match.item._id}-${forceRender}`}
    >
      {/* Card Header with enhanced styling */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {/* Show subcategory icon or fall back to category icon before title */}
            {(categoryKey && subcategoryKey) ? (
              getSubcategoryIcon(categoryKey, subcategoryKey) || getCategoryIcon(categoryKey)
            ) : null}
            
            <h3 className="text-lg font-medium text-gray-900 truncate max-w-[200px]">
              {match.item.title || 'Sans titre'}
            </h3>
            
            {/* Type and status badges */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}>
              {typeBadge.label}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
              {statusBadge.label}
            </span>
          </div>
          
          {/* Publication date moved under the title */}
          <div className="flex items-center text-xs text-gray-500">
            <ClockIcon className="h-3.5 w-3.5 mr-1" />
            Publié {formatRelativeTime(match.item.createdAt)}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* THIS IS THE KEY CHANGE: Render the distance UI alongside the score */}
          {renderHeaderExtras && renderHeaderExtras()}
          
          {/* Animated circular score indicator */}
          <div className="relative inline-flex flex-col items-center justify-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              {/* Background circle */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle 
                  className="text-gray-200" 
                  strokeWidth="8" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="42" 
                  cx="50" 
                  cy="50" 
                />
                {/* Animated progress circle */}
                <circle 
                  className={`${scoreColorClass} transform origin-center -rotate-90 transition-all duration-1000 ease-out`} 
                  strokeWidth="8" 
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * animatedScore / 100)} 
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="42" 
                  cx="50" 
                  cy="50" 
                />
              </svg>
              <span className={`text-lg font-bold ${scoreColorClass}`}>{animatedScore}%</span>
            </div>
            <span className="text-xs text-gray-500 mt-1">Match</span>
          </div>
          
          {/* Reference badge */}
          <div className="text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1 rounded-md border border-gray-200">
            Réf: {itemReference || match.item.reference || 'N/A'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left column with item details */}
          <div className="flex-1 space-y-3">
            {renderHeader ? renderHeader() : (
              match.item.type === 'lost' ? (
                <>
                  {/* Location for lost items */}
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Emplacement</p>
                      <p className="text-sm text-gray-600">
                        {match.item.location?.address || match.item.location?.name || 'Emplacement non spécifié'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Date when the item was lost */}
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Date de perte</p>
                      <p className="text-sm text-gray-600">{formatShortDate(match.item.date)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Date when the item was found */}
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Date de découverte</p>
                      <p className="text-sm text-gray-600">{formatShortDate(match.item.date)}</p>
                    </div>
                  </div>
                </>
              )
            )}
            
            {/* Category information with icon */}
            <div className="flex items-start">
              {/* Use category icon */}
              {getCategoryIcon(match.item.category) || <TagIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5 mr-2" />}
              <div className="flex-1 ml-2">
                <p className="text-sm font-medium text-gray-700">Catégorie</p>
                <p className="text-sm text-gray-600">
                  {categoryKey && subcategoryKey ? 
                    `${CATEGORIES_CONFIG[categoryKey]?.label || 'Catégorie'} - ${CATEGORIES_CONFIG[categoryKey]?.subcategories[subcategoryKey]?.label || 'Sous-catégorie'}` : 
                    'Catégorie non spécifiée'}
                </p>
              </div>
            </div>
            
            {/* Description - always visible */}
            <div className="pt-1">
              <p className="text-sm font-medium text-gray-700">Description</p>
              <p className="text-sm text-gray-600 line-clamp-2 hover:line-clamp-none transition-all duration-300">
                {match.item.description || 'Aucune description fournie'}
              </p>
            </div>
          </div>
          
          {/* Right column with image */}
          <div className="flex-shrink-0 w-full md:w-32">
            <div className="flex flex-col">
              {match.item.images && match.item.images.length > 0 ? (
                <div className="relative overflow-hidden rounded-lg group h-32 w-full md:w-32">
                  <img
                    src={`data:${match.item.images[0].contentType};base64,${match.item.images[0].data}`}
                    alt={match.item.title || 'Image de l\'objet'}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                  />
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      setSelectedImageIndex(0);
                      setShowImageModal(true);
                    }}
                  >
                    <EyeIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gray-100 rounded-lg h-32 w-full md:w-32 border border-gray-200">
                  <span className="text-xs text-gray-400">Pas d'image</span>
                </div>
              )}
              
              {/* Action buttons under the image */}
              {renderActionButtons && renderActionButtons()}
            </div>
          </div>
        </div>

        {/* Details toggle button */}
        <button
          className="w-full mt-4 group flex items-center justify-center py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors duration-200"
          onClick={toggleDetails}
        >
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200 mr-1">
            {showDetails ? 'Masquer les détails' : 'Voir plus de détails'}
          </span>
          {showDetails ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" />
          )}
        </button>
      </div>

      {/* Updated Image modal with navigation */}
      {showImageModal && match.item.images && match.item.images.length > 0 && (
        <ImageModal
          images={match.item.images}
          initialIndex={selectedImageIndex}
          onClose={() => setShowImageModal(false)}
        />
      )}

      {/* Details section with animation */}
      {showDetails && (
        <div 
          className={`px-5 py-4 border-t border-gray-100 
                    transition-all duration-300 ease-in-out 
                    ${detailsAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subcategory Fields */}
            {match.item.subcategoryFields && Object.keys(match.item.subcategoryFields).length > 0 && (
              <div className="col-span-2 mt-2">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  {/* Show subcategory icon in the details section header */}
                  {getSubcategoryIcon(match.item.category, match.item.subcategory)}
                  <span>Détails spécifiques</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  {Object.entries(match.item.subcategoryFields).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="mt-1 text-sm text-gray-900">
                        {Array.isArray(value) ? value.join(', ') : String(value || '')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom details content */}
            {renderDetailsContent && renderDetailsContent()}
          </div>

          {/* Footer with action buttons */}
          {renderFooter && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              {renderFooter()}
            </div>
          )}
        </div>
      )}

      {/* Additional content */}
      {children && (
        <div className={`px-5 py-4 ${showDetails ? 'border-t border-gray-100' : ''}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default BaseMatchCard;
export { ImageModal };
