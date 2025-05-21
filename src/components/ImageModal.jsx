import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ImageModal = ({ image, onClose }) => {
  // Return null instead of undefined if no image is provided
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
        {image.data && image.contentType ? (
          <img
            src={`data:${image.contentType};base64,${image.data}`}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
          />
        ) : (
          <div className="bg-gray-200 rounded-lg p-8 flex items-center justify-center">
            <span className="text-gray-500">Image non disponible</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
