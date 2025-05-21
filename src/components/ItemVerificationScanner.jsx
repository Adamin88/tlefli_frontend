import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { XMarkIcon, CheckCircleIcon, CameraIcon } from '@heroicons/react/24/outline';
import itemsService from '../services/itemsService';
import { useAuth } from '../contexts/AuthContext';

function ItemVerificationScanner({ 
  currentItemId,
  onVerificationSuccess,
  onVerificationFailure,
  onClose,
  vibrate = true
}) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [camera, setCamera] = useState(null);
  const scannerRef = useRef(null);
  const htmlScannerRef = useRef(null);
  const { user } = useAuth();

  // Bail out early if missing required props
  if (!currentItemId) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">ID d'objet manquant pour la vérification</p>
        <button 
          onClick={onClose} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Fermer
        </button>
      </div>
    );
  }

  useEffect(() => {
    // Set up the scanner when component mounts
    if (scannerRef.current && !htmlScannerRef.current) {
      htmlScannerRef.current = new Html5Qrcode(scannerRef.current.id);
    }

    // Clean up on unmount
    return () => {
      if (htmlScannerRef.current && scanning) {
        try {
          htmlScannerRef.current.stop().catch(error => console.error("Error stopping scanner:", error));
        } catch (error) {
          console.error("Error in cleanup:", error);
        }
      }
    };
  }, [scanning]);

  const startScanner = async () => {
    if (!htmlScannerRef.current) {
      setError("Scanner not initialized");
      return;
    }

    try {
      setError(null);
      setScanResult(null);
      setScanning(true);

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        setCamera(cameras[0].id);
        
        await htmlScannerRef.current.start(
          { deviceId: cameras[0].id },
          { fps: 10, qrbox: 250 },
          onScanSuccess,
          onScanFailure
        );
      } else {
        setError("No cameras found");
        setScanning(false);
      }
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError(`Failed to start scanner: ${err.message}`);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (htmlScannerRef.current && scanning) {
      try {
        await htmlScannerRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      setScanning(false);
    }
  };

  const onScanSuccess = async (decodedText) => {
    if (!decodedText) return;
    
    try {
      // Stop the scanner
      await stopScanner();
      
      // Vibrate if browser supports it
      if (vibrate && navigator.vibrate) {
        navigator.vibrate(200);
      }
      
      // Extract the item ID from the scanned QR code URL
      // Example format: https://tlefli.ma/items/12345
      const urlPattern = /items\/([a-zA-Z0-9]+)/;
      const match = decodedText.match(urlPattern);
      
      if (match && match[1]) {
        const scannedItemId = match[1];
        
        if (scannedItemId === currentItemId) {
          // Self-verification
          setScanResult({
            success: true,
            message: "Code QR valide! Ceci est le même objet.",
            isSameItem: true
          });
        } else {
          // Verify if the items match
          await verifyItems(scannedItemId);
        }
      } else {
        setScanResult({
          success: false,
          message: "QR code invalide. Format non reconnu."
        });
        
        if (typeof onVerificationFailure === "function") {
          onVerificationFailure(null, { message: "QR code format invalid" });
        }
      }
    } catch (err) {
      console.error("Error processing scan:", err);
      setScanResult({
        success: false,
        message: `Erreur lors du traitement: ${err.message}`
      });
      
      if (typeof onVerificationFailure === "function") {
        onVerificationFailure(null, err);
      }
    }
  };

  const onScanFailure = (error) => {
    // This is just for QR code scanning errors, not for verification errors
    // We don't want to show these errors to the user - they're expected during scanning
    console.debug("Scan error (not shown to user):", error);
  };

  const verifyItems = async (scannedItemId) => {
    if (!currentItemId || !scannedItemId) {
      setScanResult({
        success: false,
        message: "Information manquante pour la vérification"
      });
      return;
    }
    
    try {
      setVerifying(true);
      const response = await itemsService.verifyItems(currentItemId, scannedItemId);
      
      if (response.success) {
        setScanResult({
          success: true,
          message: "Vérification réussie! Les objets correspondent.",
          data: response.data
        });
        
        if (typeof onVerificationSuccess === "function") {
          onVerificationSuccess(response.data);
        }
      } else {
        setScanResult({
          success: false,
          message: response.error || "Les objets ne correspondent pas."
        });
        
        if (typeof onVerificationFailure === "function") {
          onVerificationFailure(null, { message: response.error });
        }
      }
    } catch (err) {
      console.error("Verification error:", err);
      setScanResult({
        success: false,
        message: `Erreur lors de la vérification: ${err.message}`
      });
      
      if (typeof onVerificationFailure === "function") {
        onVerificationFailure(null, err);
      }
    } finally {
      setVerifying(false);
    }
  };

  // Render result view if we have a scan result
  if (scanResult) {
    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${scanResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-start">
            {scanResult.success ? (
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
            ) : (
              <XMarkIcon className="h-6 w-6 text-red-500 mr-2 flex-shrink-0" />
            )}
            <div>
              <p className={`font-medium ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {scanResult.success ? 'Succès!' : 'Échec'}
              </p>
              <p className={`text-sm ${scanResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {scanResult.message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setScanResult(null);
              startScanner();
            }}
            className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            Scanner à nouveau
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // Render scanner view
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      <div 
        ref={scannerRef} 
        id="qr-reader"
        className="overflow-hidden rounded-lg"
        style={{ width: '100%', minHeight: '300px' }}
      ></div>
      
      <div className="flex gap-2">
        {!scanning ? (
          <button
            onClick={startScanner}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center"
          >
            <CameraIcon className="h-5 w-5 mr-2" />
            Activer la caméra
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Arrêter la caméra
          </button>
        )}
        
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Fermer
        </button>
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        Positionnez un code QR dans le cadre pour le scanner
      </p>
    </div>
  );
}

export default ItemVerificationScanner;
