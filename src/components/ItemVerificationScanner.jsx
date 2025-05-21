import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, CameraIcon, QrCodeIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';
import itemsService from '../services/itemsService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Item Verification Scanner Component
 * Specifically designed to verify if a scanned item matches the current item being viewed
 * Only works when activated from ItemDetails.jsx
 */
const ItemVerificationScanner = ({ 
  currentItemId, 
  onVerificationSuccess, 
  onVerificationFailure,
  onClose,
  vibrate = true 
}) => {
  console.log('ItemVerificationScanner initialized with currentItemId:', currentItemId);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scanning, setScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null); // 'success', 'error', or null
  const [scannedItem, setScannedItem] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrScanner, setQrScanner] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const scannerRef = useRef(null);

  // Validate the component is being used in the right context
  useEffect(() => {
    // Debug log for validation
    console.log('Validating scanner context', {
      currentItemId,
      pathname: location.pathname,
      isItemDetailsPage: location.pathname.includes('/items/'),
      isVerifyPage: location.pathname.includes('/verify')
    });

    // Check that we have a currentItemId and we're on a valid page
    // Now accept BOTH item details page AND verify page as valid contexts
    const isValidPage = location.pathname.includes('/items/');
    
    if (!currentItemId) {
      console.error('Scanner missing currentItemId parameter');
      if (onClose) {
        onClose();
      } else {
        // If no close handler, navigate back to items list
        navigate('/items');
      }
      return;
    }
    
    // Path validation is now optional - only log it but don't enforce
    if (!isValidPage) {
      console.warn('Scanner activated from unexpected page, but will continue anyway');
    }
  }, [currentItemId, navigate, location, onClose]);

  // Detect if user is on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()));
    };
    
    checkMobile();
  }, []);

  // Extract item ID from a scanned QR code value
  const extractItemId = (scannedValue) => {
    if (!scannedValue) return null;
    
    try {
      // Check if it's a URL
      if (scannedValue.startsWith('http')) {
        // Extract ID from URLs like /items/abc123 or /qr/abc123
        const url = new URL(scannedValue);
        const pathParts = url.pathname.split('/');
        return pathParts[pathParts.length - 1]; // Get the last part of the URL path
      }
      
      // If it's already an ID (e.g. just "abc123")
      return scannedValue;
    } catch (err) {
      console.error('Error extracting item ID:', err);
      return scannedValue; // Return original value if URL parsing fails
    }
  };

  // Get available cameras
  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setCameraList(devices);
        // On desktop, default to the first camera
        if (!isMobile && devices.length > 0) {
          setSelectedCamera(devices[0].id);
        }
        // On mobile, let the system choose (environment facing camera by default)
        else {
          setSelectedCamera(null);
        }
      } else {
        setErrorMessage('No cameras detected on your device');
      }
    } catch (err) {
      console.error('Error getting cameras:', err);
      setErrorMessage('Failed to access cameras');
    }
  };

  // Initialize scanner when component mounts
  useEffect(() => {
    // Clean up scanner when component unmounts
    return () => {
      if (qrScanner && qrScanner.isScanning) {
        qrScanner.stop().catch(err => console.error("Error stopping scanner:", err));
      }
    };
  }, []);

  // Verify if the scanned item matches the current item
  const verifyItem = async (scannedId) => {
    if (!scannedId || !currentItemId) {
      setErrorMessage('Invalid item ID');
      return false;
    }

    setLoading(true);
    try {
      // Fetch the scanned item details to show comparison
      const response = await itemsService.getItemById(scannedId);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch scanned item details');
      }
      
      setScannedItem(response.data);
      
      // Check if items match (either by ID or by reference)
      const isMatch = scannedId === currentItemId || 
                      response.data.reference === currentItemId ||
                      (response.data.twin && response.data.twin.item && 
                       response.data.twin.item._id === currentItemId);
      
      setVerificationResult(isMatch ? 'success' : 'error');
      
      // Provide haptic feedback if supported and enabled
      if (vibrate && 'vibrate' in navigator) {
        if (isMatch) {
          navigator.vibrate([100, 50, 100]); // Success pattern: short-pause-short
        } else {
          navigator.vibrate(400); // Error pattern: long vibration
        }
      }
      
      // Call appropriate callback
      if (isMatch) {
        if (onVerificationSuccess) {
          onVerificationSuccess(response.data);
        }
      } else {
        if (onVerificationFailure) {
          onVerificationFailure(response.data);
        }
      }
      
      return isMatch;
    } catch (error) {
      console.error('Error verifying item:', error);
      setErrorMessage(error.message || 'Failed to verify item');
      setVerificationResult('error');
      
      if (vibrate && 'vibrate' in navigator) {
        navigator.vibrate(400); // Error pattern
      }
      
      if (onVerificationFailure) {
        onVerificationFailure(null, error);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initialize scanner on start scan button click
  const initializeScanner = async () => {
    console.log('Initializing QR scanner');
    try {
      // Clear any previous error messages
      setErrorMessage('');
      setPermissionDenied(false);
      
      // Verify the DOM element exists before proceeding
      const scannerElement = document.getElementById("verification-qr-reader");
      if (!scannerElement) {
        console.error('Scanner element not found in the DOM');
        setErrorMessage('Scanner initialization failed: Element not found');
        return;
      }
      
      console.log('Scanner element found in DOM:', scannerElement);
      
      // Get available cameras first
      try {
        await getCameras();
      } catch (cameraError) {
        console.warn('Failed to get cameras, will try with default:', cameraError);
        // Don't fail initialization - continue with default camera
      }
      
      // Don't create a new scanner if one already exists
      if (qrScanner) {
        if (qrScanner.isScanning) {
          console.log('Scanner is already running');
          return;
        }
        
        // If scanner exists but isn't scanning, start scanning
        startScanning(qrScanner);
        return;
      }
      
      // Create scanner instance with explicit DOM element reference
      console.log('Creating Html5Qrcode instance for element "verification-qr-reader"');
      const scanner = new Html5Qrcode("verification-qr-reader");
      setQrScanner(scanner);
      
      // Start scanning
      startScanning(scanner);
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setErrorMessage(`Failed to initialize scanner: ${err.message || 'Unknown error'}`);
    }
  };

  // Start scanning using the initialized scanner
  const startScanning = async (scanner) => {
    if (!scanner) {
      console.error('Scanner instance is null or undefined');
      setErrorMessage('Failed to start scanner: Scanner not initialized');
      return;
    }
    
    // Configure QR code scanner options
    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1
    };
    
    try {
      setScanning(true);
      console.log('Starting scanner with config:', config);
      
      // Try different camera configurations in sequence until one works
      let successfulStart = false;
      
      // Attempt 1: Try with selected or default camera config
      try {
        // Create a valid camera config - always ensure there's at least one key
        let cameraConfig;
        
        if (isMobile) {
          // For mobile devices, use environment facing camera
          cameraConfig = { facingMode: "environment" }; // Removed 'exact' constraint which is problematic
          console.log('Using mobile camera config:', cameraConfig);
        } else if (selectedCamera) {
          // For desktop with selected camera ID
          cameraConfig = { deviceId: selectedCamera }; // Simplified - the exact constraint often fails
          console.log('Using desktop camera with selected ID:', cameraConfig);
        } else {
          // Fallback with a simple config that always has one key
          cameraConfig = { facingMode: "user" };
          console.log('Using default user-facing camera config:', cameraConfig);
        }
        
        console.log('Attempting camera config:', cameraConfig);
        
        await scanner.start(
          cameraConfig,
          config,
          handleScan,
          handleScanError
        );
        
        successfulStart = true;
        console.log('Scanner started successfully with primary config');
      } catch (firstAttemptError) {
        console.error("First camera attempt failed:", firstAttemptError);
        // Continue to the next attempt
      }
      
      // Attempt 2: If first attempt failed, try with simplest possible constraints
      if (!successfulStart) {
        try {
          console.log('Trying second camera configuration...');
          const simpleConfig = isMobile 
            ? { facingMode: "environment" } 
            : { facingMode: "user" };
            
          console.log('Using simplified camera config:', simpleConfig);
          
          await scanner.start(
            simpleConfig,
            config,
            handleScan,
            handleScanError
          );
          
          successfulStart = true;
          console.log('Scanner started successfully with fallback config');
        } catch (secondAttemptError) {
          console.error("Second camera attempt failed:", secondAttemptError);
          // Continue to the final attempt
        }
      }
      
      // Attempt 3: Last resort - try with no constraints but valid object structure
      if (!successfulStart) {
        try {
          console.log('Trying final camera configuration...');
          // This ensures we ALWAYS have at least one key in the config
          const lastResortConfig = { facingMode: { ideal: "environment" } };
          
          console.log('Using last resort camera config:', lastResortConfig);
          
          await scanner.start(
            lastResortConfig,
            config,
            handleScan,
            handleScanError
          );
          
          console.log('Scanner started successfully with last resort config');
        } catch (finalAttemptError) {
          // If all attempts fail, throw the error
          throw finalAttemptError;
        }
      }
    } catch (err) {
      console.error("All camera configuration attempts failed:", err);
      
      // Handle permission denied errors specifically
      if (err.name === 'NotAllowedError' || 
          (err.message && (
            err.message.includes('Permission denied') || 
            err.message.includes('permission')
          ))
      ) {
        setPermissionDenied(true);
        setErrorMessage("Camera access denied. Please allow camera permissions.");
      } else {
        setErrorMessage(`Error starting camera: ${err.message || 'Unknown error'}`);
      }
      
      setScanning(false);
    }
  };

  // Handle successful QR code scan
  const handleScan = async (decodedText) => {
    if (!decodedText) return;
    
    try {
      // Stop scanning
      if (qrScanner && qrScanner.isScanning) {
        await qrScanner.stop().catch(err => console.error("Error stopping scanner:", err));
      }
      
      setScanning(false);
      
      // Extract item ID from scanned value
      const scannedId = extractItemId(decodedText);
      console.log('Scanned QR code:', decodedText, '→ Extracted ID:', scannedId);
      
      if (!scannedId) {
        setErrorMessage('Invalid QR code format');
        setVerificationResult('error');
        return;
      }
      
      // Verify the scanned item
      await verifyItem(scannedId);
    } catch (error) {
      console.error('Error in handleScan:', error);
      setErrorMessage('Error processing scan result');
      setVerificationResult('error');
    }
  };

  // Handle scan errors
  const handleScanError = (error) => {
    // Don't show an error for every frame that doesn't have a QR code
    if (error === 'No QR code found' || (typeof error === 'string' && error.includes('No QR code found'))) {
      return;
    }
    
    console.error('QR scan error:', error);
    // Don't set error message for non-critical errors to avoid flickering UI
  };

  // Reset the scanner state
  const resetScanner = () => {
    if (qrScanner && qrScanner.isScanning) {
      qrScanner.stop().catch(err => console.error("Error stopping scanner:", err));
    }
    setQrScanner(null);
    setScanning(false);
    setVerificationResult(null);
    setScannedItem(null);
    setErrorMessage('');
    setPermissionDenied(false);
  };

  // Navigate to scanned item details
  const navigateToScannedItem = () => {
    if (scannedItem && scannedItem._id) {
      navigate(`/items/${scannedItem._id}`);
    }
  };

  // Helper functions for displaying data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'posted': return 'bg-gray-100 text-gray-800';
      case 'authenticating': return 'bg-yellow-100 text-yellow-800';
      case 'authenticated': return 'bg-blue-100 text-blue-800';
      case 'returning': return 'bg-purple-100 text-purple-800';
      case 'returned': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Ensure we always return something
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md mx-auto">
      {/* Header with visible debug info */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Scanner de vérification {currentItemId ? `(ID: ${currentItemId.substring(0, 6)}...)` : ""}</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {scanning ? (
        <div className="mb-4">
          <div className="relative overflow-hidden rounded-lg border-2 border-yellow-400">
            {/* Change the div to have both ID and ref */}
            <div id="verification-qr-reader" className="w-full" style={{ height: '300px' }} ref={scannerRef}></div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-1/2 h-1/2 border-2 border-yellow-400 rounded-lg"></div>
            </div>
            <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs font-medium py-2 px-2 text-center z-10">
              {isMobile 
                ? 'Pointez votre caméra vers le QR code' 
                : 'Alignez le QR code dans le cadre'}
            </div>
          </div>

          {/* Camera selector for desktop */}
          {!isMobile && cameraList.length > 1 && (
            <div className="mb-2 mt-2">
              <select
                value={selectedCamera || ''}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
              >
                {cameraList.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${camera.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <button
            onClick={() => resetScanner()}
            className="w-full mt-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Annuler
          </button>
        </div>
      ) : verificationResult ? (
        <div className="mb-6 animate-fadeIn">
          <div className={`p-4 rounded-lg ${verificationResult === 'success' ? 'bg-green-50' : 'bg-red-50'} mb-4`}>
            <div className="flex items-center">
              {verificationResult === 'success' ? (
                <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
              ) : (
                <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
              )}
              <div>
                <h3 className={`font-bold ${verificationResult === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {verificationResult === 'success' ? 'Vérification réussie!' : 'Non correspondant!'}
                </h3>
                <p className={`text-sm ${verificationResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {verificationResult === 'success' 
                    ? "L'objet scanné correspond bien à l'objet actuel." 
                    : "L'objet scanné ne correspond pas à l'objet actuel."}
                </p>
              </div>
            </div>
          </div>

          {scannedItem && (
            <div className="border rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Détails de l'objet scanné:</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Titre:</span>
                  <span className="font-medium">{scannedItem.title}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Référence:</span>
                  <span className="font-medium">{scannedItem.reference}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium capitalize">{scannedItem.type}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(scannedItem.status)}`}>
                    {scannedItem.status.charAt(0).toUpperCase() + scannedItem.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span>{formatDate(scannedItem.date)}</span>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={navigateToScannedItem}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Voir détails
                </button>
                
                <button
                  onClick={initializeScanner}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Scanner un autre
                </button>
              </div>
            </div>
          )}
          
          {errorMessage && (
            <div className="text-sm text-red-600 mb-4">
              {errorMessage}
            </div>
          )}
        </div>
      ) : permissionDenied ? (
        <div className="text-center py-6 space-y-4">
          <div className="mb-4">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 font-medium text-red-700">Accès caméra refusé</h3>
            <p className="mt-2 text-sm text-gray-500">
              Vous devez autoriser l'accès à votre caméra pour scanner un QR code.
              Vérifiez les paramètres de votre navigateur et réessayez.
            </p>
          </div>
          
          <button
            onClick={initializeScanner}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Réessayer
          </button>
        </div>
      ) : (
        <div className="text-center py-6 space-y-4">
          <div className="mb-4">
            {isMobile ? (
              <DevicePhoneMobileIcon className="mx-auto h-16 w-16 text-gray-400" />
            ) : (
              <ComputerDesktopIcon className="mx-auto h-16 w-16 text-gray-400" />
            )}
            <p className="mt-4 text-sm text-gray-500">
              {isMobile 
                ? 'Scannez le code QR de l\'objet pour vérifier s\'il correspond à celui que vous consultez.' 
                : 'Utilisez votre webcam pour scanner le code QR d\'un objet et vérifier s\'il correspond.'}
            </p>
          </div>
          
          {/* Add an ID to ensure we can find this button */}
          <button
            id="start-scanner-button"
            onClick={() => {
              console.log('Scanner button clicked');
              initializeScanner();
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <CameraIcon className="h-5 w-5 mr-2" />
            Commencer à scanner
          </button>
          
          {/* Add an error message display area that's always visible */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              {errorMessage}
            </div>
          )}
        </div>
      )}
      
      {/* Add the scanner container when not scanning to ensure the element exists */}
      {!scanning && (
        <div 
          id="verification-qr-reader" 
          className="hidden" 
          style={{ width: '300px', height: '300px' }}
        ></div>
      )}
      
      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        #verification-qr-reader {
          width: 100%;
          height: 100%;
        }
        
        #verification-qr-reader video {
          object-fit: cover;
          width: 100%;
          height: 100%;
        }
        
        #verification-qr-reader__dashboard {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ItemVerificationScanner;
