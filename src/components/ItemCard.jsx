import React from 'react';
import { 
  CalendarIcon, 
  MapPinIcon, 
  TagIcon, 
  PhotoIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  PaperAirplaneIcon,  // For "posted" - represents submission
  MagnifyingGlassIcon,  // For "authenticating" - represents verification process
  ShieldCheckIcon,  // For "authenticated" - represents security verification complete
  ArrowPathRoundedSquareIcon,  // For "returning" - represents exchange/return process
  CheckBadgeIcon  // For "returned" - represents successful completion with badge
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ItemCard({ item }) {
  const { user } = useAuth();
  const {
    _id,
    reference,
    title,
    description,
    status,
    date,
    location,
    category,
    tags,
    type,
    images,
    reportedBy,
    contact
  } = item;

  const statusIcons = {
    posted: PaperAirplaneIcon,
    authenticating: MagnifyingGlassIcon,
    authenticated: ShieldCheckIcon,
    returning: ArrowPathRoundedSquareIcon,
    returned: CheckBadgeIcon
  };

  const statusColors = {
    posted: 'bg-gray-100 text-gray-800',
    authenticating: 'bg-yellow-100 text-yellow-800',
    authenticated: 'bg-blue-100 text-blue-800',
    returning: 'bg-purple-100 text-purple-800',
    returned: 'bg-green-100 text-green-800'
  };

  const statusLabels = {
    posted: 'Annonce déposée',
    authenticating: 'Authentification en cours',
    authenticated: 'Authentification validée',
    returning: 'Restitution en cours',
    returned: 'Objet restitué'
  };

  const typeColors = {
    lost: 'bg-red-100 text-red-800',
    found: 'bg-green-100 text-green-800'
  };

  const typeLabels = {
    lost: 'Perdu',
    found: 'Trouvé'
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  const getMainImage = () => {
    if (!images || images.length === 0) return null;
    const mainImage = images.find(img => img.isMain) || images[0];
    return `data:${mainImage.contentType};base64,${mainImage.data}`;
  };

  const getStatusIcon = (status) => {
    const Icon = statusIcons[status];
    return Icon ? <Icon className="h-4 w-4 mr-1" /> : null;
  };

  return (
    <Link to={`/items/${_id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {/* Image Section */}
        <div className="aspect-w-16 aspect-h-9 relative">
          {getMainImage() ? (
            <img
              src={getMainImage()}
              alt={title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
              <PhotoIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
              {getStatusIcon(status)}
              {statusLabels[status]}
            </span>
          </div>
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type]}`}>
              {typeLabels[type]}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              #{reference}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          <div className="mb-2">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {truncateText(title, 40)}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {truncateText(description, 100)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {formatDate(date)}
            </div>
            
            {location?.address && (
              <div className="flex items-center text-sm text-gray-500">
                <MapPinIcon className="h-4 w-4 mr-2" />
                {truncateText(location.address, 50)}
              </div>
            )}

            {/* Reporter Info - Only show for business users */}
            {user?.role === 'business' && reportedBy && (
              <div className="flex items-center text-sm text-gray-500">
                <UserIcon className="h-4 w-4 mr-2" />
                {`${reportedBy.firstName} ${reportedBy.lastName}`}
              </div>
            )}

            {/* Contact Info - Only show for business users */}
            {user?.role === 'business' && contact && (
              <div className="space-y-1">
                {contact.email && (
                  <div className="flex items-center text-sm text-gray-500">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    {truncateText(contact.email, 30)}
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center text-sm text-gray-500">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {contact.phone}
                  </div>
                )}
              </div>
            )}

            {tags && tags.length > 0 && (
              <div className="flex items-center text-sm text-gray-500">
                <TagIcon className="h-4 w-4 mr-2" />
                <div className="flex flex-wrap gap-1">
                  {tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 px-2 py-0.5 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{tags.length - 3}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Button - Only for business users */}
          {user?.role === 'business' && status === 'posted' && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={(e) => {
                  e.preventDefault(); // Prevent navigation
                  // Add your action handler here
                }}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Marquer comme authentifié
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
