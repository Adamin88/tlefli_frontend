import { useState, useEffect } from 'react';

// Global state to track if the script is already loading or loaded
const scriptState = {
  loaded: false,
  loading: false,
  error: null,
  promise: null
};

/**
 * Custom hook to load the Google Maps script once and handle its state
 * @param {string} apiKey - Google Maps API Key
 * @param {Object} options - Additional options like libraries, language, etc.
 * @returns {Object} - The loading state of the script
 */
const useGoogleMapsScript = (apiKey, options = {}) => {
  const [state, setState] = useState({
    loaded: scriptState.loaded,
    loading: scriptState.loading,
    error: scriptState.error
  });

  useEffect(() => {
    // If the script is already loaded, just update state
    if (window.google && window.google.maps) {
      scriptState.loaded = true;
      scriptState.loading = false;
      scriptState.error = null;
      setState({
        loaded: true,
        loading: false,
        error: null
      });
      return;
    }

    // Function to load the script
    const loadScript = () => {
      // If already loading, return the existing promise
      if (scriptState.loading && scriptState.promise) {
        return scriptState.promise;
      }

      // Create a new promise for loading
      const scriptPromise = new Promise((resolve, reject) => {
        // Set global loading state
        scriptState.loading = true;
        scriptState.loaded = false;
        scriptState.error = null;

        // Update component state
        setState({
          loading: true,
          loaded: false,
          error: null
        });

        // Check if script already exists in DOM
        const existingScript = document.getElementById('google-maps-script');
        if (existingScript) {
          // Script exists, but Google Maps object might not be ready yet
          if (window.google && window.google.maps) {
            scriptState.loaded = true;
            scriptState.loading = false;
            setState({
              loaded: true,
              loading: false,
              error: null
            });
            resolve(window.google);
            return;
          }
        }

        // Create script element
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;

        // Build the script URL with parameters
        const libraries = options.libraries ? options.libraries.join(',') : '';
        const language = options.language || 'en';
        const region = options.region || '';

        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}&language=${language}&region=${region}&callback=googleMapsCallback`;

        // Define the callback
        window.googleMapsCallback = () => {
          scriptState.loaded = true;
          scriptState.loading = false;
          setState({
            loaded: true,
            loading: false,
            error: null
          });
          resolve(window.google);
        };

        // Handle script load errors
        script.onerror = (error) => {
          scriptState.loading = false;
          scriptState.error = error;
          setState({
            loading: false,
            loaded: false,
            error
          });
          reject(error);
        };

        // Add script to document
        document.head.appendChild(script);
      });

      scriptState.promise = scriptPromise;
      return scriptPromise;
    };

    // Load the script
    loadScript().catch(error => {
      console.error('Error loading Google Maps script:', error);
    });

    // Cleanup
    return () => {
      // We don't remove the script on unmount because it should be used globally
    };
  }, [apiKey, options.libraries, options.language, options.region]);

  return state;
};

export default useGoogleMapsScript;
