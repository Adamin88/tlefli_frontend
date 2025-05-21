import React, { useState, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const ImageSlider = ({ images, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);

  // Return a placeholder if there are no images
  if (!images || images.length === 0) {
    return (
      <div className="h-64 w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Aucune image disponible</p>
      </div>
    );
  }

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

  // Ensure the current index is valid
  const safeCurrentIndex = currentIndex >= 0 && currentIndex < images.length ? currentIndex : 0;
  const currentImage = images[safeCurrentIndex];

  return (
    <div className="relative h-64 w-full">
      <div 
        className="h-full w-full relative overflow-hidden rounded-lg bg-gray-100"
        onClick={() => onImageClick && onImageClick(currentImage)}
      >
        {currentImage && (
          <img
            src={`data:${currentImage.contentType};base64,${currentImage.data}`}
            alt={`Image ${safeCurrentIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        )}
        {currentImage && currentImage.isMain && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              Principal
            </span>
          </div>
        )}
      </div>

      {/* Boutons de navigation - only show if we have more than 1 image */}
      {images.length > 1 && (
        <>
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
        </>
      )}

      {/* Indicateurs de position - only show if we have more than 1 image */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full ${
                index === safeCurrentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
