import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

/**
 * QR Code Scanner Component
 * Works on both mobile devices and desktop computers with a camera
 * 
 * @param {Object} props
 * @param {string} props.expectedItemId - The expected item ID to match against
 * @param {function} props.onSuccess - Optional callback when correct item is scanned
 * @param {function} props.onError - Optional callback when wrong item is scanned
 * @param {boolean} props.vibrate - Whether to vibrate on scan (default: true)
 * @param {number} props.successDuration - How long to show success message (ms)
 * @param {number} props.errorDuration - How long to show error message (ms)
 */
const QRScanner = ({ 
  expectedItemId, 
  onSuccess, 
  onError, 
  vibrate = true,
  successDuration = 3000,
  errorDuration = 3000
}) => {
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(null); // 'success', 'error', or null
  const [errorMessage, setErrorMessage] = useState('');
  const [qrScanner, setQrScanner] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const scannerRef = useRef(null);

  // Detect if user is on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()));
    };
    
    checkMobile();
  }, []);

  // Extract item ID from a scanned value (URL or direct ID)
  const extractItemId = (scannedValue) => {
    if (!scannedValue) return null;
    
    try {
      // Check if it's a URL
      if (scannedValue.includes('/')) {
        // Try to extract ID from URL paths like /items/abc123 or /qr/abc123
        const urlParts = scannedValue.split('/');
        return urlParts[urlParts.length - 1]; // Get the last part of the URL
      }
      
      // If not a URL, return as is (assuming it's a direct ID)
      return scannedValue;
    } catch (err) {
      console.error('Error extracting item ID:', err);
      return scannedValue; // Return original value if extraction fails
    }
  };

  // Compare extracted ID with expected ID
  const compareIds = (extractedId) => {
    if (!extractedId || !expectedItemId) return false;
    return extractedId.trim() === expectedItemId.trim();
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

  // Initialize scanner before starting scan
  const initializeScanner = async () => {
    if (!scannerRef.current) return;
    
    try {
      setErrorMessage('');
      setPermissionDenied(false);
      
      // Get available cameras first
      await getCameras();
      
      // Create scanner instance
      const scanner = new Html5Qrcode("qr-reader");
      setQrScanner(scanner);
      
      // Start scanning
      startScanning(scanner);
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setErrorMessage('Failed to initialize scanner');
    }
  };

  // Start scanning using the initialized scanner
  const startScanning = async (scanner) => {
    if (!scanner) return;
    
    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1
    };
    
    try {
      setScanning(true);
      
      // On mobile, use environment camera by default
      // On desktop, use the selected camera
      const cameraConfig = isMobile 
        ? { facingMode: "environment" } 
        : { deviceId: selectedCamera };
      
      await scanner.start(
        cameraConfig,
        config,
        handleScan,
        handleScanError
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      
      // Handle permission denied errors specifically
      if (err.name === 'NotAllowedError' || 
          err.message.includes('Permission denied') || 
          err.message.includes('permission')) {
        setPermissionDenied(true);
        setErrorMessage("Camera access denied. Please allow camera permissions.");
      } else {
        setErrorMessage(err.message || "Failed to start camera");
      }
      
      setScanStatus("error");
      setScanning(false);
    }
  };

  // Handle successful scan
  const handleScan = (decodedText) => {
    if (!decodedText) return;
    
    // Stop scanning after successful read
    if (qrScanner && qrScanner.isScanning) {
      qrScanner.stop().catch(err => console.error("Error stopping scanner:", err));
    }
    
    setScanning(false);
    setResult(decodedText);
    
    const extractedId = extractItemId(decodedText);
    const isMatch = compareIds(extractedId);
    
    if (isMatch) {
      setScanStatus('success');
      
      // Vibrate on success if supported and enabled
      if (vibrate && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]); // Success pattern: short-pause-short
      }
      
      // Call success callback if provided
      if (onSuccess) onSuccess(extractedId);
      
      // Reset after success duration
      setTimeout(() => {
        resetScanner();
      }, successDuration);
    } else {
      setScanStatus('error');
      
      // Vibrate on error if supported and enabled
      if (vibrate && 'vibrate' in navigator) {
        navigator.vibrate(400); // Error pattern: long vibration
      }
      
      // Call error callback if provided
      if (onError) onError(extractedId);
      
      // Reset after error duration
      setTimeout(() => {
        resetScanner();
      }, errorDuration);
    }
  };

  // Handle scan errors
  const handleScanError = (error) => {
    // Don't show an error for every frame that doesn't have a QR code
    if (error === 'No QR code found') return;
    
    console.error('QR scan error:', error);
    setErrorMessage(typeof error === 'string' ? error : 'Failed to scan QR code');
  };

  // Reset scanner state
  const resetScanner = () => {
    if (qrScanner && qrScanner.isScanning) {
      qrScanner.stop().catch(err => console.error("Error stopping scanner:", err));
    }
    
    // Clean up and reset the scanner
    setQrScanner(null);
    setScanning(false);
    setResult(null);
    setScanStatus(null);
    setErrorMessage('');
    setPermissionDenied(false);
  };

  // Clean up scanner when component unmounts
  useEffect(() => {
    return () => {
      if (qrScanner && qrScanner.isScanning) {
        qrScanner.stop().catch(err => console.error("Error stopping scanner:", err));
      }
    };
  }, [qrScanner]);

  // Start scanner when selected camera changes
  useEffect(() => {
    if (selectedCamera && qrScanner && !qrScanner.isScanning && scanning) {
      startScanning(qrScanner);
    }
  }, [selectedCamera, qrScanner, scanning]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
      {/* Start scan button */}
      {!scanning && !scanStatus && (
        <div className="text-center p-4 bg-white rounded-lg shadow-md w-full mb-4">
          <div className="mb-4">
            {isMobile ? (
              <DevicePhoneMobileIcon className="h-12 w-12 mx-auto text-gray-400" />
            ) : (
              <ComputerDesktopIcon className="h-12 w-12 mx-auto text-gray-400" />
            )}
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {isMobile ? 'Scanner un QR code' : 'Utilisez votre webcam pour scanner un QR code'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isMobile 
                ? 'Pointez votre caméra vers le QR code de l\'objet' 
                : 'Positionnez le QR code devant votre webcam'}
            </p>
          </div>
          
          <button
            onClick={initializeScanner}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Démarrer le scanner
          </button>
        </div>
      )}

      {/* Scanner video feed */}
      {scanning && (
        <div 
          className="relative w-full overflow-hidden rounded-lg shadow-md bg-black"
          style={{ maxWidth: '100vw' }}
        >
          <div className="w-full" style={{ aspectRatio: '1/1' }}>
            <div id="qr-reader" className="w-full h-full" ref={scannerRef}></div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2/3 h-2/3 border-2 border-yellow-400 rounded-lg"></div>
            </div>
          </div>
          
          {/* Overlay text */}
          <div className="absolute top-4 left-0 right-0 text-center z-10">
            <div className="bg-black bg-opacity-70 text-white text-sm font-medium py-2 px-4 rounded-lg mx-auto inline-block">
              {isMobile 
                ? 'Pointez votre caméra vers le QR code' 
                : 'Alignez le QR code dans le cadre'}
            </div>
          </div>
          
          {/* Camera selector for desktop */}
          {!isMobile && cameraList.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 text-center z-10">
              <select
                value={selectedCamera || ''}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="bg-black bg-opacity-70 text-white text-sm py-2 px-4 rounded-lg mx-auto inline-block border border-gray-600"
              >
                {cameraList.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${camera.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Cancel button */}
          <button
            onClick={resetScanner}
            className="absolute bottom-4 right-4 bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-red-700"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Permission denied message */}
      {permissionDenied && (
        <div className="w-full bg-red-50 p-6 rounded-lg shadow-md text-center border border-red-200 mt-4">
          <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-red-700">Accès caméra refusé</h3>
          <p className="text-sm text-red-600 mt-2 mb-4">
            Vous devez autoriser l'accès à votre caméra pour scanner un QR code.
          </p>
          
          {isMobile ? (
            <p className="text-sm text-gray-600 mb-4">
              Sur mobile, vérifiez les paramètres de votre navigateur et les permissions de l'application.
            </p>
          ) : (
            <p className="text-sm text-gray-600 mb-4">
              Sur votre ordinateur, cliquez sur l'icône de caméra ou de cadenas dans la barre d'adresse de votre navigateur.
            </p>
          )}
          
          <button
            onClick={initializeScanner}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md inline-flex items-center transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Réessayer
          </button>
        </div>
      )}

      {/* Result view */}
      {!scanning && scanStatus && (
        <div className="w-full bg-white p-6 rounded-lg shadow-md text-center">
          {scanStatus === 'success' && (
            <div className="flex flex-col items-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mb-2" />
              <h3 className="text-lg font-bold text-green-700">Objet correct!</h3>
              <p className="text-sm text-gray-600 mt-2">Le QR code correspond à l'objet attendu</p>
            </div>
          )}
          
          {scanStatus === 'error' && (
            <div className="flex flex-col items-center">
              <XCircleIcon className="w-16 h-16 text-red-500 mb-2" />
              <h3 className="text-lg font-bold text-red-700">Mauvais objet!</h3>
              <p className="text-sm text-gray-600 mt-2">
                {errorMessage || "Le QR code ne correspond pas à l'objet attendu"}
              </p>
            </div>
          )}
          
          <button
            onClick={resetScanner}
            className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md flex items-center justify-center mx-auto transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Scanner à nouveau
          </button>
        </div>
      )}

      {/* Add some basic styles for the HTML5QRCode library */}
      <style jsx="true">{`
        #qr-reader {
          width: 100%;
          height: 100%;
          background: black;
        }
        
        #qr-reader video {
          object-fit: cover;
          width: 100%;
          height: 100%;
        }
        
        #qr-reader__scan_region {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        #qr-reader__dashboard {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          z-index: 5;
        }
        
        #qr-reader__dashboard button {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
