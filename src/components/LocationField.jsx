import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaMapMarkerAlt, FaSpinner, FaMapMarked, FaSearch, FaCity } from '../config/categoriesConfig';
import axios from 'axios';
import GoogleMap from './GoogleMap';

// Modern UI Component borrowed from ReportItem
const ModernInput = ({ type, value, onChange, onFocus, onBlur, onKeyDown, placeholder, className = '', readOnly = false }) => {
  // Ensure value is always defined
  const safeValue = value === undefined || value === null ? '' : value;

  const baseClass = `w-full px-4 py-3 rounded-lg border bg-white transition-all duration-300 
    focus:ring-2 focus:ring-yellow-400 focus:border-transparent focus:shadow-sm ${className}`;

  return (
    <input
      type={type}
      value={safeValue}
      onChange={onChange || (() => {})}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={baseClass}
      readOnly={readOnly}
    />
  );
};

// Error message component
const ErrorMessage = ({ error }) => {
  if (!error) return null;
  return (
    <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fadeIn">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a 1 1 0 001 1h1a 1 1 0 100-2v-3a 1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
      {error}
    </p>
  );
};

const LocationField = ({ 
  location, 
  onChange, 
  onBlur: parentOnBlur, 
  validationState,
  title = "Lieu *" 
}) => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  
  // Location hierarchy state
  const [country] = useState('Morocco'); // Fixed to Morocco
  const [city, setCity] = useState('');
  const [cityOptions, setCityOptions] = useState([]);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [isCityFocused, setIsCityFocused] = useState(false);
  // Add state to track if city was selected from suggestions
  const [citySelectedFromSuggestion, setCitySelectedFromSuggestion] = useState(false);
  const [tempCityInput, setTempCityInput] = useState('');
  
  const [exactAddress, setExactAddress] = useState(location?.address || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showMap, setShowMap] = useState(false);
  
  // Add flags to prevent circular updates between map and fields
  const [updatingFromMap, setUpdatingFromMap] = useState(false);
  
  // Refs for debounced API calls
  const cityTimeoutRef = useRef(null);
  const searchTimeout = useRef(null);
  const resultsRef = useRef(null);
  const cityResultsRef = useRef(null);
  
  // Add refs to track previous values
  const prevAddressRef = useRef('');
  const isInitialRender = useRef(true);
  
  // Initialize city from location if available
  useEffect(() => {
    if (location?.city && !city) {
      setCity(location.city);
    }
  }, [location, city]);
  
  // Fetch city suggestions
  useEffect(() => {
    if (!tempCityInput || tempCityInput.length < 2) {
      setCityOptions([]);
      return;
    }
    
    if (cityTimeoutRef.current) {
      clearTimeout(cityTimeoutRef.current);
    }
    
    cityTimeoutRef.current = setTimeout(async () => {
      setIsCityLoading(true);
      try {
        const response = await axios.get(`${apiUrl}/geocode/search`, {
          params: {
            query: tempCityInput,
            countrySet: 'MA', // Morocco country code
            limit: 5,
            entityType: 'Municipality', // Specifically request cities/municipalities
            typeahead: true
          }
        });
        
        if (response.data.success) {
          // Process the city results to ensure they're unique city names
          const cities = response.data.data
            // Additional filtering to ensure only city-level results
            .filter(item => 
              !item.address.includes('quartier') && 
              !item.address.includes('hay') && 
              !item.address.includes('rue') && 
              !item.address.includes('avenue')
            )
            .map(item => ({
              ...item,
              // Clean up the display name for cities
              displayName: item.address.split(',')[0].trim()
            }));
          
          // Remove duplicates based on city name
          const uniqueCities = Array.from(new Map(
            cities.map(city => [city.displayName.toLowerCase(), city])
          ).values());
          
          setCityOptions(uniqueCities);
        } else {
          setCityOptions([]);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        setCityOptions([]);
      } finally {
        setIsCityLoading(false);
      }
    }, 300);
    
    return () => {
      if (cityTimeoutRef.current) {
        clearTimeout(cityTimeoutRef.current);
      }
    };
  }, [tempCityInput, apiUrl]);
  
  // Build full address when components change - FIX INFINITE LOOP
  useEffect(() => {
    // Skip on initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      prevAddressRef.current = location?.address || '';
      return;
    }
    
    // Skip if currently updating from map
    if (updatingFromMap) return;
    
    if (city) {
      let fullAddress = '';
      
      if (exactAddress) {
        fullAddress = exactAddress;
        if (!fullAddress.includes(city)) {
          fullAddress += `, ${city}`;
        }
      } else {
        fullAddress = `${city}, Morocco`;
      }
      
      setSearchQuery(fullAddress);
      
      // Only update location if address actually changed and not currently updating from map
      if (onChange && location && fullAddress !== prevAddressRef.current) {
        prevAddressRef.current = fullAddress; // Update ref before calling onChange
        
        onChange({
          ...location,
          address: fullAddress,
          country: 'Morocco', // Always set country explicitly
          city: city
        });
      }
    }
  }, [city, exactAddress]); // Remove onChange and location from dependencies
  
  // Rest of location search functionality for exact address
  const [searchQuery, setSearchQuery] = useState(location?.address || '');
  
  // Fetch exact address options with stricter city filtering
  const fetchExactAddresses = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1 || !city) {
      return [];
    }

    try {
      setIsLoading(true);
      console.log(`DEBUG: Searching for "${searchTerm}" in ${city}`);

      // Add street-specific terms to improve results
      let enhancedSearchTerm = searchTerm;
      if (!searchTerm.toLowerCase().includes('rue') && 
          !searchTerm.toLowerCase().includes('avenue') && 
          !searchTerm.toLowerCase().includes('boulevard')) {
        if (searchTerm.length <= 3) {
          enhancedSearchTerm = `rue ${searchTerm}`;
          console.log(`Enhanced search term to: "${enhancedSearchTerm}"`);
        }
      }

      // Create a more specific search term that includes the city
      let locationSpecificTerm = `${enhancedSearchTerm}, ${city}`;
      
      console.log(`Using location-specific search term: "${locationSpecificTerm}"`);

      const queryParams = {
        query: locationSpecificTerm,
        countrySet: 'MA', 
        limit: 15,
        municipalityFilter: city, // Strict filter by city
        entityType: 'Street,Address,StreetAddress',
        typeahead: true,
        resultType: 'street,address'
      };

      // First try - direct search
      let response = await axios.get(`${apiUrl}/geocode/search`, {
        params: queryParams,
        timeout: 8000 // 8 second timeout
      });

      console.log("DEBUG: API response received:", response.data);

      // Check for API errors and handle them
      if (!response.data.success || (response.data.error && response.data.data?.length === 0)) {
        console.error("API error:", response.data.error || response.data.message || "Unknown error");
        
        // Try with simpler query params but still enforce city filter
        console.log("API error detected, trying fallback search with simplified parameters");
        
        const fallbackParams = {
          query: searchTerm,
          countrySet: 'MA',
          municipalityFilter: city, // Still enforce city filter
          limit: 10
        };
        
        response = await axios.get(`${apiUrl}/geocode/search`, {
          params: fallbackParams,
          timeout: 8000
        });
        
        console.log("Fallback search response:", response.data);
        
        // If still no success, return mock results if we have a search term
        if (!response.data.success || !response.data.data || response.data.data.length === 0) {
          if (searchTerm.length >= 2) {
            // Return mock results based on the search term
            return generateMockAddressResults(searchTerm, city);
          }
          return [];
        }
      }

      // Stricter filtering of results to ensure they belong to the selected city
      const addresses = (response.data.data || [])
        .filter(item => {
          // Must have an address
          if (!item.address) return false;
          
          // Check if address belongs to the specified city
          const isInSelectedCity = item.city === city || 
                                  (item.address && item.address.toLowerCase().includes(city.toLowerCase()));
          
          if (!isInSelectedCity) {
            console.log(`Filtering out address not in ${city}:`, item.address);
            return false;
          }
          
          return true;
        })
        .map(item => {
          // Determine if it's a street
          const isStreet = item.entityType === 'Street' || 
                          (item.address && (
                            item.address.toLowerCase().includes('rue') || 
                            item.address.toLowerCase().includes('avenue') || 
                            item.address.toLowerCase().includes('boulevard')));

          return {
            ...item,
            isStreet,
            displayAddress: item.address
          };
        });

      console.log(`Found ${addresses.length} search results in ${city}`);

      // Sort results - streets first, then others
      return addresses.sort((a, b) => {
        if (a.isStreet && !b.isStreet) return -1;
        if (!a.isStreet && b.isStreet) return 1;
        return 0;
      });
    } catch (error) {
      console.error('Error fetching address data:', error);
      
      // If the API call fails completely, return mock results
      if (searchTerm.length >= 2) {
        return generateMockAddressResults(searchTerm, city);
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, city]);

  // Helper function to generate mock address results when API fails
  const generateMockAddressResults = (searchTerm, city) => {
    console.log(`Generating mock results for "${searchTerm}" in ${city}`);
    
    // Common street types in Morocco
    const streetTypes = ['Rue', 'Avenue', 'Boulevard', 'Impasse', 'Place'];
    const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
    
    // Clean up search term and capitalize first letter
    const cleanTerm = searchTerm.trim().replace(/^(rue|avenue|boulevard)\s+/i, '');
    const capitalizedTerm = cleanTerm.charAt(0).toUpperCase() + cleanTerm.slice(1);
    
    // Create mock results that explicitly include city name
    const mockAddresses = [
      {
        id: `mock-${Date.now()}-1`,
        address: `${streetType} ${capitalizedTerm}, ${city}`,
        isStreet: true,
        entityType: 'Street',
        city: city, // Explicitly include city
        isMockData: true,
        position: { lat: 0, lon: 0 }
      },
      {
        id: `mock-${Date.now()}-2`,
        address: `${streetType} ${capitalizedTerm} Nord, ${city}`,
        isStreet: true,
        entityType: 'Street',
        city: city, // Explicitly include city
        isMockData: true,
        position: { lat: 0, lon: 0 }
      }
    ];
    
    return mockAddresses;
  };

  // Update the exact address search handler to be more responsive
  const handleExactAddressSearch = useCallback(async (value) => {
    setExactAddress(value);
    
    // Clear previous results if input is empty
    if (!value || value.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    console.log(`Starting search for "${value}" (length: ${value.length})`);
    
    if (!city) {
      console.log("No city selected - cannot search for addresses");
      return;
    }

    // Clear any previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Use a slightly longer debounce for better resilience
    searchTimeout.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        console.log("Executing search...");
        
        // Add tracking for API errors
        let apiErrorOccurred = false;
        
        try {
          const addresses = await fetchExactAddresses(value);
          console.log(`Found ${addresses.length} results for "${value}"`);
          
          // Check if these are mock results
          if (addresses.length > 0 && addresses[0].isMockData) {
            apiErrorOccurred = true;
          }
          
          setSearchResults(addresses);
          
          if (addresses.length === 0) {
            console.log('No results found for streets search');
          }
        } catch (searchError) {
          console.error('Address search failed:', searchError);
          apiErrorOccurred = true;
          setSearchResults([]);
        }
        
        // Store API error state to show message to user
        setHasApiError(apiErrorOccurred);
        
      } catch (error) {
        console.error('Address search error:', error);
        setSearchResults([]);
        setHasApiError(true);
      } finally {
        setIsLoading(false);
      }
    }, 300);  // Use 300ms for better balance between responsiveness and API load
  }, [fetchExactAddresses, city]);

  // Handle selecting a city - update to prevent loops
  const handleSelectCity = (selectedCity) => {
    // Get clean city name without other address parts
    const cityName = selectedCity.displayName || selectedCity.address.split(',')[0].trim();
    setCity(cityName);
    setTempCityInput(cityName);
    setCitySelectedFromSuggestion(true);
    setCityOptions([]);
    setIsCityFocused(false);
    
    // Clear exact address when changing city
    setExactAddress('');
    
    // If we have coordinates, update the location
    if (selectedCity.position) {
      if (onChange) {
        const newAddress = `${cityName}, Morocco`;
        prevAddressRef.current = newAddress; // Update ref before calling onChange
        
        // Explicitly tell the map to center and zoom on this city
        onChange({
          ...location,
          coordinates: [selectedCity.position.lon, selectedCity.position.lat], // Store as [longitude, latitude]
          address: newAddress,
          country: 'Morocco', 
          city: cityName,
          neighborhood: '',
          setZoom: true,  // Instruct map to zoom
          zoomLevel: 13   // City-level zoom
        });
      }
    }
  };

  // Handle selecting a specific location
  const handleSelectLocation = (result) => {
    setSearchQuery(result.address);
    setSearchResults([]);
    setExactAddress(result.address);
    
    // Update location with new coords & address - keeping [longitude, latitude] format
    const newLocation = {
      ...location,
      coordinates: [result.position.lon, result.position.lat], // Store as [longitude, latitude]
      address: result.address,
      country: 'Morocco',
      city: city,
      neighborhood: ''
    };
    
    onChange(newLocation);
  };
  
  // Handle location change from map
  const handleMapLocationChange = (newLocation) => {
    setUpdatingFromMap(true);
    
    // Update fields with data from map
    setSearchQuery(newLocation.address);
    setExactAddress(newLocation.address);
    prevAddressRef.current = newLocation.address; // Update ref to prevent loops
    
    // Update city if provided from map
    if (newLocation.city && newLocation.city !== city) {
      setCity(newLocation.city);
      setTempCityInput(newLocation.city); // Update the input field display
      setCitySelectedFromSuggestion(true); // Mark as selected from suggestion
    }
    
    // Ensure we don't add zoom instructions unless specifically requested
    const locationUpdate = {
      ...newLocation,
      setZoom: newLocation.setZoom || false // Only preserve explicit setZoom flag
    };
    
    onChange(locationUpdate);
    
    // Reset flag after a short delay
    setTimeout(() => {
      setUpdatingFromMap(false);
    }, 100);
  };
  
  // Handler for city selection from map
  const handleMapCitySelect = (cityName) => {
    if (!updatingFromMap && cityName !== city) {
      setCity(cityName);
      setTempCityInput(cityName); // Update the input field display
      setCitySelectedFromSuggestion(true); // Mark as selected from suggestion
    }
  };
  
  // Handle keyboard navigation in search results
  const handleKeyDown = (e) => {
    if (!searchResults.length) return;
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSelectLocation(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setSearchResults([]);
        setIsFocused(false);
        break;
      default:
        break;
    }
  };
  
  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    // If we already have a value and no results, trigger a search
    if (searchQuery && searchQuery.length >= 3 && !searchResults.length) {
      // The useEffect will handle the actual search
      setSearchQuery(searchQuery);
    }
  };
  
  // Handle input blur
  const handleBlur = (e) => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      setIsFocused(false);
    }, 150);
    
    // Propagate blur event to parent if needed
    if (parentOnBlur) {
      parentOnBlur(e);
    }
  };
  
  // Handle changes to the search input
  const handleInputChange = (e) => {
    // Do nothing - prevent manual input
    // We're keeping the function for compatibility but not allowing changes
    return;
  };

  // Toggle map visibility
  const toggleMap = useCallback(() => {
    // Toggle map visibility
    setShowMap(prev => !prev);
  }, []);

  // Add click outside detector to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setSearchResults([]);
      }
      if (cityResultsRef.current && !cityResultsRef.current.contains(event.target)) {
        setCityOptions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Add state for API errors
  const [hasApiError, setHasApiError] = useState(false);

  // Handle city field clearing
  const handleClearCity = () => {
    setCity('');
    setTempCityInput('');
    setCitySelectedFromSuggestion(false);
    setCityOptions([]);
    setExactAddress('');
    setSearchResults([]);
    
    // Reset location to empty state
    if (onChange) {
      onChange({
        ...location,
        coordinates: [0, 0],
        address: '',
        country: 'Morocco', // Keep default country
        city: '',
        neighborhood: '' // Keep this field for backward compatibility
      });
    }
  };
  
  return (
    <div className="space-y-4 animate-fadeIn" style={{ animationDelay: "0.2s" }}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <FaMapMarkerAlt className="text-yellow-500" />
          {title}
        </h2>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-3">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Localisation au Maroc</h3>
            <p className="text-sm text-blue-600">Veuillez sélectionner la ville avant de préciser l'adresse exacte sur la carte.</p>
          </div>
        </div>
      </div>
      
      {!showMap ? (
        // Search input version with city selection
        <div className={`relative space-y-4 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl shadow-inner ${
          validationState.touched && validationState.error
            ? 'border-2 border-red-300'
            : ''
        }`}>
          {/* City Selection with clear button */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
            <div className="flex items-center">
              <FaCity className="absolute left-3 text-yellow-500" />
              <ModernInput
                type="text"
                value={tempCityInput}
                onChange={(e) => setTempCityInput(e.target.value)}
                onFocus={() => setIsCityFocused(true)}
                onBlur={() => setTimeout(() => setIsCityFocused(false), 150)}
                placeholder="Entrez le nom de la ville"
                className={`pl-10 ${citySelectedFromSuggestion ? 'bg-green-50 border-green-200' : ''}`}
              />
              {isCityLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-500 animate-spin">
                  <FaSpinner className="w-4 h-4" />
                </div>
              )}
              {/* Add clear button when city has value */}
              {city && !isCityLoading && (
                <button
                  type="button"
                  onClick={handleClearCity}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Effacer la ville"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Show selection status message */}
            {city && citySelectedFromSuggestion && (
              <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ville sélectionnée: {city}
              </p>
            )}
            
            {/* Help text if city not selected from suggestions */}
            {tempCityInput && !citySelectedFromSuggestion && !isCityFocused && (
              <p className="mt-1 text-sm text-orange-600 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Veuillez sélectionner une ville dans la liste
              </p>
            )}
            
            {/* City Autocomplete Results */}
            {isCityFocused && cityOptions.length > 0 && (
              <div 
                ref={cityResultsRef}
                className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto"
              >
                <ul className="py-1">
                  {cityOptions.map((cityOption, index) => (
                    <li 
                      key={cityOption.id || index}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSelectCity(cityOption)}
                    >
                      <div className="flex items-center gap-2">
                        <FaCity className="text-yellow-500 flex-shrink-0" />
                        <span>{cityOption.displayName || cityOption.address.split(',')[0]}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Exact Address - Only show if city is selected */}
          {city && citySelectedFromSuggestion && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex justify-between items-center">
                  <span>Adresse exacte</span>
                  {city && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                      {city}
                    </span>
                  )}
                </div>
              </label>
              <div className="flex items-center relative">
                <FaMapMarkerAlt className="absolute left-3 text-yellow-500" />
                <ModernInput
                  type="text"
                  value={exactAddress}
                  readOnly={true} // Make field read-only so it can't be typed into
                  onClick={toggleMap} // Clicking on the field opens the map
                  placeholder="Cliquez pour sélectionner une adresse précise sur la carte"
                  className={`pl-10 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-dashed 
                    border-gray-300 ${hasApiError ? 'border-orange-200' : ''}`}
                />
                <button
                  type="button"
                  onClick={toggleMap}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200"
                >
                  <div className="flex items-center gap-1.5">
                    <FaMapMarked className="text-xs" />
                    <span>Carte</span>
                  </div>
                </button>
              </div>
              
              {/* Current Selected Location shown as card */}
              {location?.address && (
                <div className="mt-3 py-2 px-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Adresse sélectionnée:</strong> {location.address}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Map version - Using updated GoogleMap
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl shadow-inner">
          {/* Back button to return to city selection */}
          <button 
            type="button"
            onClick={toggleMap}
            className="mb-3 flex items-center gap-2 py-2 px-4 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-yellow-300 hover:text-yellow-700 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à la sélection de ville
          </button>
          
          <GoogleMap 
            initialLocation={location} 
            onLocationChange={handleMapLocationChange} 
            height="350px"
            country="MA" // Set Morocco as default country
            selectedCity={city}
            selectedNeighborhood="" // Always empty as we removed neighborhood selection
            onCitySelect={handleMapCitySelect}
            onNeighborhoodSelect={() => {}} // Empty function as we removed neighborhood
            highlightNeighborhood={false} // No neighborhoods to highlight
          />
          <div className="mt-2">
            <label className="block text-sm text-gray-600 mb-1">Adresse sélectionnée:</label>
            <div className="p-2 bg-white rounded-lg border border-gray-200 text-sm">
              {location?.address || 'Aucune adresse sélectionnée'}
            </div>
          </div>
        </div>
      )}
      
      <ErrorMessage error={validationState.touched && validationState.error} />
      
      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out both;
        }
      `}</style>
    </div>
  );
};

export default LocationField;
