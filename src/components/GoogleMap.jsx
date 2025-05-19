import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap as ReactGoogleMap, InfoWindow, Marker } from '@react-google-maps/api';
import axios from 'axios';
import useGoogleMapsScript from '../hooks/useGoogleMapsScript';

// Define libraries as a static constant outside the component to prevent rerenders
const GOOGLE_MAPS_LIBRARIES = ['places'];

// Create a map loading component to handle loading state
const MapLoading = ({ height }) => (
  <div 
    style={{ height, width: '100%', borderRadius: '0.75rem' }}
    className="flex items-center justify-center bg-gray-100"
  >
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-yellow-500 mb-2"></div>
      <p className="text-gray-600">Chargement de la carte...</p>
    </div>
  </div>
);

const GoogleMap = ({ 
  initialLocation, 
  onLocationChange,
  height = '300px',
  country = 'MA', // Default to Morocco
  selectedCity = '',
  selectedNeighborhood = '',
  onCitySelect = () => {},
  onNeighborhoodSelect = () => {},
  highlightNeighborhood = false
}) => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  // Use our custom hook instead of LoadScript component
  const { loaded, loading, error: scriptError } = useGoogleMapsScript(
    googleMapsApiKey, 
    { libraries: GOOGLE_MAPS_LIBRARIES, language: 'fr', region: 'MA' }
  );
  
  // Fix: Memoize the initial state for mapCenter to prevent recalculations
  const initialMapCenter = useRef(
    initialLocation?.coordinates 
      ? { lat: initialLocation.coordinates[1], lng: initialLocation.coordinates[0] } // Correctly map [lng, lat] to {lat, lng}
      : { lat: 33.5731, lng: -7.5898 } // Default to Casablanca coordinates
  ).current;

  const [mapInstance, setMapInstance] = useState(null);
  const [marker, setMarker] = useState(null);
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [infoContent, setInfoContent] = useState('<div>Chargement de l\'adresse...</div>');
  const [mapCenter, setMapCenter] = useState(initialMapCenter);
  const [error, setError] = useState(null);
  
  const geocodeTimeoutRef = useRef(null);
  const styleElementRef = useRef(null);
  const mapContainerRef = useRef(null);
  // Track previous props to avoid unnecessary updates
  const prevPropsRef = useRef({ initialLocation });

  // Set error from script loading failure - with proper dependency
  useEffect(() => {
    if (scriptError && !error) {
      setError(`Failed to load Google Maps: ${scriptError.message}`);
    }
  }, [scriptError, error]);

  // Map styling options - simplified to match Google Maps defaults
  const mapOptions = {
    mapTypeControl: false, // Remove the Map/Satellite switch
    mapTypeId: 'roadmap',  // Ensure the default view is "Plan" (roadmap)
    streetViewControl: false, // Remove street view controls and Pegman
    fullscreenControl: false, // Remove fullscreen button
    zoomControl: true,
    gestureHandling: 'greedy',
    styles: [] // Remove POI visibility restrictions to show Points of Interest
  };

  // Calculate appropriate zoom level based on context - memoized
  const getZoomLevel = useCallback(() => {
    if (initialLocation?.zoomLevel) {
      return initialLocation.zoomLevel;
    } else if (selectedCity) {
      return 13; // Medium zoom for city
    }
    return 6; // Default zoom for Morocco
  }, [initialLocation?.zoomLevel, selectedCity]);

  // Debounce function to prevent too many geocoding requests
  const debounce = (func, wait) => {
    return function(...args) {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
      geocodeTimeoutRef.current = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    };
  };
  
  // Debounced reverse geocode function
  const debouncedReverseGeocode = useCallback(
    debounce(async (position) => {
      // Store info content but don't automatically show InfoWindow
      setInfoContent(`
        <div class="google-bubble">
          <div class="bubble-loading">
            <div class="spinner"></div>
            <span>Chargement...</span>
          </div>
        </div>
      `);
      
      try {
        // Use backend proxy for reverse geocoding
        const response = await axios.get(`${apiUrl}/geocode/reverse`, {
          params: {
            lat: position.lat,
            lon: position.lng
          }
        });
        
        let formattedAddress = 'Adresse introuvable';
        let cityName = '';
        let countryName = 'Morocco'; // Default to Morocco
        // We'll still process neighborhood but won't show it in the UI
        let neighborhoodName = '';
        
        if (response.data.success && response.data.data) {
          formattedAddress = response.data.data.address || 'Adresse non disponible';
          cityName = response.data.data.city || '';
          // Get country from response if available, otherwise default to Morocco
          countryName = response.data.data.country || 'Morocco';
          neighborhoodName = response.data.data.district || response.data.data.neighborhood || '';
          
          if (cityName && cityName !== selectedCity) {
            onCitySelect(cityName);
          }
          
          // Keep neighborhood handling in case it's used elsewhere
          if (neighborhoodName && neighborhoodName !== selectedNeighborhood) {
            onNeighborhoodSelect(neighborhoodName);
          }
          
          // Update with the new location information - store coordinates as [lng, lat] to match DB schema
          onLocationChange({
            coordinates: [position.lng, position.lat], // Store as [longitude, latitude]
            address: formattedAddress,
            country: countryName,
            city: cityName,
            neighborhood: neighborhoodName // Keep for compatibility
          });
        } else {
          console.warn("Reverse geocoding failed or returned no data:", response.data);
        }
        
        // Update info window content but don't show it automatically
        setInfoContent(`
          <div class="google-bubble">
            <div class="google-bubble-address">${formattedAddress}</div>
            ${cityName ? `<div class="google-bubble-city">${cityName}, ${countryName}</div>` : ''}
          </div>
        `);
      } catch (error) {
        console.error('Error in reverse geocoding:', error);
        setInfoContent(`
          <div class="google-bubble">
            <div class="google-bubble-error">Erreur lors de la récupération de l'adresse</div>
          </div>
        `);
      }
    }, 500),
    [apiUrl, onCitySelect, onNeighborhoodSelect, onLocationChange, selectedCity]
  );

  // Handle map click event
  const handleMapClick = useCallback((event) => {
    if (!event || !event.latLng) return;
    
    try {
      const position = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      
      setMapCenter(position);
      debouncedReverseGeocode(position);
    } catch (error) {
      console.error("Error handling map click:", error);
    }
  }, [debouncedReverseGeocode]);

  // Handle marker drag end event
  const handleMarkerDragEnd = useCallback((event) => {
    if (!event || !event.latLng) return;
    
    try {
      const position = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      
      setMapCenter(position);
      debouncedReverseGeocode(position);
    } catch (error) {
      console.error("Error handling marker drag:", error);
    }
  }, [debouncedReverseGeocode]);

  // Handle marker click - show info window only when marker is clicked
  const handleMarkerClick = useCallback(() => {
    setInfoWindowOpen(true);
  }, []);

  // Handle map load event with extra error handling
  const onMapLoad = useCallback((map) => {
    if (!map) {
      console.error("Map instance is undefined in onMapLoad");
      return;
    }
    
    try {
      // Store the map instance
      setMapInstance(map);
      
      // Show initial location info if available
      if (initialLocation?.coordinates && 
          initialLocation.coordinates[0] !== 0 && 
          initialLocation.coordinates[1] !== 0) {
        
        if (initialLocation.address) {
          setInfoContent(`
            <div class="google-bubble">
              <div class="google-bubble-address">${initialLocation.address}</div>
              ${initialLocation.city ? `<div class="google-bubble-city">${initialLocation.city}</div>` : ''}
            </div>
          `);
          // Don't automatically show the info window
          setInfoWindowOpen(false);
        } else {
          debouncedReverseGeocode({
            lat: initialLocation.coordinates[1],
            lng: initialLocation.coordinates[0]
          });
        }
      }
    } catch (error) {
      console.error('Error in onMapLoad:', error);
      setError('Erreur lors du chargement de la carte');
    }
  }, [initialLocation, debouncedReverseGeocode]);

  // Handle marker load event
  const onMarkerLoad = useCallback((markerInstance) => {
    if (markerInstance) {
      setMarker(markerInstance);
    }
  }, []);

  // FIX: Use object comparison for initialLocation coordinates to prevent infinite loops
  useEffect(() => {
    // Skip if map not ready or coordinates not available
    if (!mapInstance || !initialLocation?.coordinates) return;
    
    // Skip update if coordinates are invalid
    if (initialLocation.coordinates[0] === 0 && initialLocation.coordinates[1] === 0) return;
    
    // Skip if initialLocation hasn't actually changed
    const prevInitialLocation = prevPropsRef.current.initialLocation;
    const coordsMatch = prevInitialLocation?.coordinates?.length === 2 &&
      initialLocation?.coordinates?.length === 2 &&
      prevInitialLocation.coordinates[0] === initialLocation.coordinates[0] &&
      prevInitialLocation.coordinates[1] === initialLocation.coordinates[1];
    
    if (coordsMatch && 
        prevInitialLocation.address === initialLocation.address && 
        prevInitialLocation.setZoom === initialLocation.setZoom &&
        prevInitialLocation.zoomLevel === initialLocation.zoomLevel) {
      return; // Skip if no actual changes
    }
    
    try {
      // Update reference to track changes
      prevPropsRef.current.initialLocation = initialLocation;
      
      // Create coordinates object for Google Maps - convert [lng, lat] to {lat, lng} object
      const coords = {
        lat: initialLocation.coordinates[1], // lat is at index 1
        lng: initialLocation.coordinates[0]  // lng is at index 0
      };
      
      // Update map center only if coordinates changed
      if (!coordsMatch) {
        setMapCenter(coords);
      }
      
      // Determine if we should change the zoom level
      if (initialLocation.setZoom) {
        const zoomLevel = initialLocation.zoomLevel || 
                        (initialLocation.city ? 13 : 10);
        mapInstance.setZoom(zoomLevel);
      }
      
      // Update info window content if address is available
      if (initialLocation.address) {
        setInfoContent(`
          <div class="google-bubble">
            <div class="google-bubble-address">${initialLocation.address}</div>
            ${initialLocation.city ? `<div class="google-bubble-city">${initialLocation.city}</div>` : ''}
          </div>
        `);
      }
    } catch (err) {
      console.warn("Error updating map with initialLocation:", err);
    }
  }, [initialLocation, mapInstance]);
  
  // Add custom styles for info window
  useEffect(() => {
    if (styleElementRef.current) {
      // Style element already exists, no need to recreate it
      return;
    }
    
    const styleEl = document.createElement('style');
    styleElementRef.current = styleEl;
    
    // Simplified styling to match Google Maps native appearance
    styleEl.textContent = `
      .google-bubble {
        font-family: Roboto, Arial, sans-serif;
        font-size: 14px;
        padding: 8px;
        color: #222;
      }
      .google-bubble-address {
        font-weight: 500;
        margin-bottom: 4px;
      }
      .google-bubble-city {
        font-size: 12px;
        color: #5B5B5B;
      }
      .google-bubble-error {
        color: #C5221F;
      }
      .bubble-loading {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .spinner {
        width: 12px;
        height: 12px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #4285F4;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(styleEl);
    
    // Return cleanup function with improved error handling
    return () => {
      try {
        if (styleElementRef.current && document.head.contains(styleElementRef.current)) {
          document.head.removeChild(styleElementRef.current);
          styleElementRef.current = null;
        }
      } catch (error) {
        console.warn("Error removing style element:", error);
      }
    };
  }, []);

  // Function to retry loading when there's an error
  const retryLoading = useCallback(() => {
    setError(null);
    // Force reload the page to reload the script
    window.location.reload();
  }, []);

  return (
    <div className="google-map-container">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-red-500 mt-1">Essayez de rafraîchir la page ou contactez le support.</p>
          <div className="flex justify-center mt-3 gap-2">
            <button 
              onClick={retryLoading}
              className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors duration-200"
            >
              Réessayer
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      ) : (
        <>
          {loading && <MapLoading height={height} />}
          
          {loaded && (
            <div 
              className="google-map"
              style={{ width: '100%', height, borderRadius: '0.75rem' }}
            >
              <ReactGoogleMap
                mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
                center={mapCenter}
                zoom={getZoomLevel()}
                options={mapOptions}
                onClick={handleMapClick}
                onLoad={onMapLoad}
                onUnmount={() => setMapInstance(null)}
              >
                <Marker
                  key={`marker-${mapCenter.lat}-${mapCenter.lng}`}
                  position={mapCenter}
                  draggable={true}
                  onDragEnd={handleMarkerDragEnd}
                  onClick={handleMarkerClick}
                  onLoad={onMarkerLoad}
                  animation={window.google?.maps?.Animation?.DROP}
                />
                
                {infoWindowOpen && (
                  <InfoWindow
                    position={mapCenter}
                    onCloseClick={() => setInfoWindowOpen(false)}
                  >
                    <div 
                      dangerouslySetInnerHTML={{ __html: infoContent }}
                    />
                  </InfoWindow>
                )}
              </ReactGoogleMap>
            </div>
          )}
          
          <div className="map-instructions text-xs text-gray-600 text-center mt-1 italic">
            Cliquez sur la carte pour sélectionner un emplacement précis
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleMap;
