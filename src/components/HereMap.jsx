import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

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
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const geocodeTimeoutRef = useRef(null);
  const mapInitializedRef = useRef(false);
  const scriptsLoadedRef = useRef(false);
  
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
      // Verify marker still exists
      if (!markerRef.current || !infoWindowRef.current) {
        console.log("Marker or infoWindow no longer available for reverse geocoding");
        return;
      }
      
      // Set loading message
      try {
        infoWindowRef.current.setContent(`
          <div class="google-bubble">
            <div class="bubble-loading">
              <div class="spinner"></div>
              <span>Chargement...</span>
            </div>
          </div>
        `);
        infoWindowRef.current.open(mapInstanceRef.current, markerRef.current);
      } catch (err) {
        console.warn("Error updating info window content:", err);
        return;
      }
      
      try {
        // Use backend proxy for reverse geocoding (still using TomTom through the backend)
        const response = await axios.get(`${apiUrl}/geocode/reverse`, {
          params: {
            lat: position.lat,
            lon: position.lng
          }
        });
        
        // Verify info window and marker still exist after async operation
        if (!infoWindowRef.current || !markerRef.current) {
          console.log("Info window or marker no longer available after geocoding");
          return;
        }
        
        let formattedAddress = 'Adresse introuvable';
        let cityName = '';
        let neighborhoodName = '';
        
        if (response.data.success && response.data.data) {
          formattedAddress = response.data.data.address || 'Adresse non disponible';
          cityName = response.data.data.city || '';
          neighborhoodName = response.data.data.district || response.data.data.neighborhood || '';
          
          if (cityName && cityName !== selectedCity) {
            onCitySelect(cityName);
          }
          
          if (neighborhoodName && neighborhoodName !== selectedNeighborhood) {
            onNeighborhoodSelect(neighborhoodName);
          }
          
          // Update with the new location information
          onLocationChange({
            coordinates: [position.lng, position.lat],
            address: formattedAddress,
            city: cityName,
            neighborhood: neighborhoodName
          });
        } else {
          console.warn("Reverse geocoding failed or returned no data:", response.data);
        }
        
        // Final check before updating info window content
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div class="google-bubble">
              <div class="google-bubble-address">${formattedAddress}</div>
              ${cityName ? `<div class="google-bubble-city">${cityName}</div>` : ''}
              ${neighborhoodName ? `<div class="google-bubble-neighborhood">${neighborhoodName}</div>` : ''}
            </div>
          `);
          infoWindowRef.current.open(mapInstanceRef.current, markerRef.current);
        }
      } catch (error) {
        console.error('Error in reverse geocoding:', error);
        // Only try to update info window if it still exists
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div class="google-bubble">
              <div class="google-bubble-error">Erreur lors de la récupération de l'adresse</div>
            </div>
          `);
          infoWindowRef.current.open(mapInstanceRef.current, markerRef.current);
        }
      }
    }, 500),
    [apiUrl, onCitySelect, onNeighborhoodSelect, onLocationChange, selectedCity, selectedNeighborhood]
  );

  // Function to check if Google Maps API is loaded
  const isGoogleMapsApiLoaded = () => {
    return window.google && window.google.maps;
  };
  
  // Function to load Google Maps API script
  const loadGoogleMapsApi = () => {
    return new Promise((resolve, reject) => {
      if (isGoogleMapsApiLoaded() || scriptsLoadedRef.current) {
        console.log('Google Maps API already loaded');
        resolve();
        return;
      }
      
      console.log('Loading Google Maps API script');
      
      // Create the script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        scriptsLoadedRef.current = true;
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('Error loading Google Maps API:', error);
        reject(new Error('Failed to load Google Maps API'));
      };
      
      document.head.appendChild(script);
    });
  };
  
  // Clean up the map instance properly
  const cleanupMap = useCallback(() => {
    console.log("Cleaning up Google Maps resources");
    
    try {
      // Clean up marker and info window
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
      
      // Google Maps doesn't have an explicit dispose method
      mapInstanceRef.current = null;
      mapInitializedRef.current = false;
    } catch (error) {
      console.error("Error during map cleanup:", error);
    }
  }, []);
  
  // Initialize map once container is ready and Google Maps API is loaded
  const initializeMap = useCallback(async () => {
    console.log("Initializing Google Maps...");
    
    // Only attempt initialization if the container is ready
    if (!mapRef.current) {
      console.log("Map container not available, skipping initialization");
      return;
    }
    
    try {
      // Load Google Maps API if not already loaded
      await loadGoogleMapsApi();
      
      // Verify API is properly loaded
      if (!window.google || !window.google.maps) {
        throw new Error("Google Maps API failed to initialize properly");
      }
      
      // Clean up any existing map first
      cleanupMap();
      
      // Double-check that container still exists after async operations
      if (!mapRef.current) {
        console.log("Map container no longer available after loading Google Maps API");
        return;
      }
      
      // Get container dimensions
      const container = mapRef.current;
      const rect = container.getBoundingClientRect();
      
      // Ensure the container has dimensions
      if (rect.width === 0 || rect.height === 0) {
        console.log("Map container has zero width or height");
        setTimeout(initializeMap, 500);
        return;
      }
      
      console.log("Creating Google Maps instance");
      
      // Default coordinates for center of Morocco: approx. -5.0 longitude, 31.8 latitude
      const defaultMoroccoCenter = { lat: 31.8, lng: -5.0 };      
      
      // Calculate appropriate zoom level based on context
      let initialZoomLevel = 5; // Default zoom for Morocco
      
      // Check if we should use explicitly requested zoom level from initialLocation
      if (initialLocation?.zoomLevel) {
        initialZoomLevel = initialLocation.zoomLevel;
      } else if (selectedNeighborhood && highlightNeighborhood) {
        // Higher zoom for neighborhood
        initialZoomLevel = 15;
      } else if (selectedCity) {
        // Medium zoom for city
        initialZoomLevel = 13;
      }
      
      console.log(`Initializing map with zoom level: ${initialZoomLevel}, neighborhood: ${selectedNeighborhood}`);
      
      // Use provided coordinates or fall back to Morocco center
      const coordinates = initialLocation?.coordinates 
        ? { lat: initialLocation.coordinates[1], lng: initialLocation.coordinates[0] }
        : defaultMoroccoCenter;
      
      // Create Google map with configurations
      const mapOptions = {
        center: coordinates,
        zoom: initialZoomLevel,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'greedy', // Makes the map easier to scroll on mobile
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      };
      
      const map = new window.google.maps.Map(container, mapOptions);
      mapInstanceRef.current = map;
      
      // Create a marker
      console.log("Creating marker");
      const marker = new window.google.maps.Marker({
        position: coordinates,
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP
      });
      
      markerRef.current = marker;
      
      // Create info window
      console.log("Creating info window");
      const infoWindow = new window.google.maps.InfoWindow({
        content: '<div>Chargement de l\'adresse...</div>',
        maxWidth: 300
      });
      
      infoWindowRef.current = infoWindow;
      
      // Add event listeners for map click
      map.addListener('click', (event) => {
        const position = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        
        // Update marker position
        marker.setPosition(position);
        
        // Update the info window and get the address
        debouncedReverseGeocode(position);
      });
      
      // Add event listeners for marker drag
      marker.addListener('dragend', () => {
        const position = {
          lat: marker.getPosition().lat(),
          lng: marker.getPosition().lng()
        };
        
        debouncedReverseGeocode(position);
      });
      
      // Set map as loaded
      setMapLoaded(true);
      mapInitializedRef.current = true;
      console.log("Google Maps initialization complete");
      
      // Show initial location info if available
      if (initialLocation?.address) {
        infoWindow.setContent(`
          <div class="google-bubble">
            <div class="google-bubble-address">${initialLocation.address}</div>
            ${initialLocation.city ? `<div class="google-bubble-city">${initialLocation.city}</div>` : ''}
            ${initialLocation.neighborhood ? `<div class="google-bubble-neighborhood">${initialLocation.neighborhood}</div>` : ''}
          </div>
        `);
        infoWindow.open(map, marker);
      } else if (initialLocation?.coordinates && initialLocation.coordinates[0] !== 0 && initialLocation.coordinates[1] !== 0) {
        debouncedReverseGeocode({
          lat: initialLocation.coordinates[1],
          lng: initialLocation.coordinates[0]
        });
      }
      
      // Handle window resize
      const handleResize = () => {
        if (mapInstanceRef.current) {
          const center = mapInstanceRef.current.getCenter();
          window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
          mapInstanceRef.current.setCenter(center);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Return cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setError(`Failed to initialize map: ${error.message}`);
    }
  }, [initialLocation, country, height, selectedCity, selectedNeighborhood, debouncedReverseGeocode, cleanupMap, googleMapsApiKey, highlightNeighborhood]);
  
  // Initialize map on component mount with retry logic
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const initWithRetry = async () => {
      try {
        await initializeMap();
      } catch (err) {
        console.error(`Map initialization attempt ${retryCount + 1} failed:`, err);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying map initialization (${retryCount}/${maxRetries})...`);
          setTimeout(initWithRetry, 1000); // Wait 1 second before retrying
        } else {
          console.error(`Failed to initialize map after ${maxRetries} attempts`);
          setError(`Map initialization failed after ${maxRetries} attempts. Please refresh the page.`);
        }
      }
    };
    
    // Add a short delay to ensure DOM is fully ready
    const initTimeout = setTimeout(() => {
      initWithRetry();
    }, 300);
    
    // Clean up on unmount
    return () => {
      clearTimeout(initTimeout);
      cleanupMap();
    };
  }, [initializeMap, cleanupMap]);

  // Update map when initialLocation changes
  useEffect(() => {
    // Skip if no location provided or map not ready
    if (!initialLocation?.coordinates || !mapLoaded || !mapInstanceRef.current) {
      return;
    }
    
    try {
      // Skip update if coordinates are invalid
      if (initialLocation.coordinates[0] === 0 && initialLocation.coordinates[1] === 0) {
        return;
      }
      
      // Create coordinates object for Google Maps
      const coords = {
        lat: initialLocation.coordinates[1],
        lng: initialLocation.coordinates[0]
      };
      
      // Update marker position
      if (markerRef.current) {
        markerRef.current.setPosition(coords);
      }
      
      // Determine if we should change the zoom level
      const shouldChangeZoom = initialLocation.fromNeighborhoodSelection ||
                              initialLocation.setZoom ||
                              initialLocation.focusNeighborhood;
      
      // Apply the center and zoom
      mapInstanceRef.current.setCenter(coords);
      if (shouldChangeZoom) {
        const zoomLevel = initialLocation.zoomLevel || 
                        (initialLocation.neighborhood ? 15 : 
                         initialLocation.city ? 13 : 
                         10);
        mapInstanceRef.current.setZoom(zoomLevel);
      }
      
      // Update the info window if address is available
      if (initialLocation.address && infoWindowRef.current) {
        infoWindowRef.current.setContent(`
          <div class="google-bubble">
            <div class="google-bubble-address">${initialLocation.address}</div>
            ${initialLocation.city ? `<div class="google-bubble-city">${initialLocation.city}</div>` : ''}
            ${initialLocation.neighborhood ? `<div class="google-bubble-neighborhood">${initialLocation.neighborhood}</div>` : ''}
          </div>
        `);
        infoWindowRef.current.open(mapInstanceRef.current, markerRef.current);
      }
    } catch (err) {
      console.warn("Error updating map with initialLocation:", err);
    }
  }, [initialLocation, mapLoaded]);
  
  // Function to zoom to a location with proper error handling
  const zoomToLocation = async (locationName, locationType) => {
    // Skip if map not ready
    if (!mapInstanceRef.current || !markerRef.current || !mapInitializedRef.current) {
      console.log("Map not ready for zoom operation");
      return;
    }
    
    console.log(`ZoomToLocation called: ${locationType} - ${locationName}`);
    
    try {
      // Create search string based on location type
      const searchQuery = locationType === 'city' 
        ? `${locationName}, Morocco`
        : `${locationName}, ${selectedCity}, Morocco`;
      
      console.log(`Zooming to ${locationType}: ${searchQuery}`);
      
      // Use a cached response if available
      const cacheKey = `zoomLocation_${searchQuery}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        console.log('Using cached location data:', parsedData);
        
        if (parsedData.lat && parsedData.lng) {
          const position = {
            lat: parsedData.lat,
            lng: parsedData.lng
          };
          
          // Update marker position
          markerRef.current.setPosition(position);
          
          // Set appropriate zoom based on location type
          const zoomLevel = locationType === 'city' ? 13 : 15;
          
          // Animate to the location
          mapInstanceRef.current.setCenter(position);
          mapInstanceRef.current.setZoom(zoomLevel);
          
          // Show the address in the info window
          if (infoWindowRef.current) {
            debouncedReverseGeocode({
              lat: position.lat,
              lng: position.lng
            });
          }
          
          return;
        }
      }
      
      // Fetch coordinates from API
      console.log(`Fetching coordinates for ${searchQuery} from API`);
      const response = await axios.get(`${apiUrl}/geocode/search`, {
        params: {
          query: searchQuery,
          limit: 1,
          countrySet: 'MA',
          entityType: locationType === 'city' ? 'Municipality' : 'Neighbourhood,MunicipalitySubdivision'
        },
        timeout: 5000
      });
      
      console.log("API response:", response.data);
      
      // Process response if successful
      if (response.data.success && response.data.data.length > 0) {
        const locationData = response.data.data[0];
        
        if (locationData.position) {
          const position = {
            lat: locationData.position.lat,
            lng: locationData.position.lon
          };
          
          // Cache the response
          sessionStorage.setItem(cacheKey, JSON.stringify(position));
          
          // Update marker position
          markerRef.current.setPosition(position);
          
          // Set appropriate zoom based on location type
          const zoomLevel = locationType === 'city' ? 13 : 15;
          
          // Animate to the location
          mapInstanceRef.current.setCenter(position);
          mapInstanceRef.current.setZoom(zoomLevel);
          
          // Show the address in the info window
          if (infoWindowRef.current) {
            debouncedReverseGeocode({
              lat: position.lat,
              lng: position.lng
            });
          }
        }
      } else {
        console.warn(`No location data found for ${searchQuery}`);
      }
    } catch (error) {
      console.warn(`Error finding ${locationType}:`, error);
      // Silently fail - no user visible error
    }
  };
  
  // Add custom styles for Google Maps info window
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .google-bubble {
        padding: 8px 12px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        min-width: 200px;
      }
      .google-bubble-address {
        font-weight: 500;
        margin-bottom: 4px;
        color: #333;
      }
      .google-bubble-city {
        font-size: 0.9em;
        color: #555;
      }
      .google-bubble-neighborhood {
        font-size: 0.85em;
        color: #666;
      }
      .google-bubble-error {
        color: #e53e3e;
        font-size: 0.9em;
      }
      .bubble-loading {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
      }
      .spinner {
        width: 12px;
        height: 12px;
        border: 2px solid #eee;
        border-top-color: #f59e0b;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .gm-style-iw-d {
        overflow: auto !important; 
      }
      .gm-style-iw-c {
        padding: 0 !important;
        border-radius: 8px !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <div className="google-map-container">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-red-500 mt-1">Essayez de rafraîchir la page ou contactez le support.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
          >
            Rafraîchir la page
          </button>
        </div>
      ) : (
        <>
          <div
            ref={mapRef}
            className={`google-map ${highlightNeighborhood && selectedNeighborhood ? 'neighborhood-view' : ''}`}
            style={{ height, width: '100%', borderRadius: '0.75rem' }}
          />
          
          {highlightNeighborhood && selectedNeighborhood && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md px-3 py-1.5 text-xs text-yellow-800 flex items-center mt-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Quartier: {selectedNeighborhood}
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