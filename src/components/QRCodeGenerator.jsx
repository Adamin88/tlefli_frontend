import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  PrinterIcon, 
  ArrowDownTrayIcon,
  ShareIcon 
} from '@heroicons/react/24/outline';

/**
 * QR Code Generator Component
 * 
 * @param {Object} props
 * @param {string} props.value - URL or data to encode in QR code
 * @param {string} props.size - Size of QR code (default: 128)
 * @param {string} props.level - Error correction level (L, M, Q, H) (default: 'M')
 * @param {string} props.bgColor - Background color (default: '#ffffff')
 * @param {string} props.fgColor - Foreground color (default: '#000000')
 * @param {boolean} props.includeMargin - Whether to include a margin (default: true)
 * @param {string} props.itemId - Item ID for download filename
 * @param {string} props.itemTitle - Item title for download filename
 * @param {boolean} props.hideButtons - Whether to hide the action buttons (default: false)
 * @param {boolean} props.printOnly - Whether to show only the print button (default: false)
 */
const QRCodeGenerator = ({ 
  value, 
  size = 128, 
  level = 'M',
  bgColor = '#ffffff',
  fgColor = '#000000',
  includeMargin = true,
  itemId,
  itemTitle,
  reference,
  hideButtons = false,
  printOnly = false
}) => {
  const qrCodeRef = useRef(null);

  // Create logo image for QR code center
  const logoImage = () => {
    // Create the logo as an SVG for better quality
    return (
      <svg
        width={size * 0.2}
        height={size * 0.2}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" rx="20" fill="#ffffff" />
        <text
          x="50"
          y="55"
          fontFamily="Arial, sans-serif"
          fontSize="20"
          fontWeight="bold"
          fill="#333333"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          TLEFLI
        </text>
      </svg>
    );
  };

  // Function to download QR code as PNG
  const downloadQRCode = () => {
    const canvas = document.createElement('canvas');
    const svg = qrCodeRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Convert to data URL
      const pngFile = canvas.toDataURL('image/png');
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${itemTitle ? itemTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : itemId || 'item'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  // Function to print QR code
  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    const svg = qrCodeRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${itemTitle || reference || itemId || 'Item'}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 8px;
            }
            .qr-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              text-align: center;
            }
            .qr-reference {
              font-size: 14px;
              margin-bottom: 15px;
              text-align: center;
            }
            .qr-instructions {
              font-size: 12px;
              color: #666;
              margin-top: 15px;
              text-align: center;
              max-width: 300px;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <button class="no-print" onclick="window.print()" style="position:fixed; top:20px; right:20px; padding:10px; background:#4f46e5; color:white; border:none; border-radius:4px; cursor:pointer;">
            Imprimer
          </button>
          <div class="qr-container">
            <div class="qr-title">${itemTitle || 'Objet perdu/trouvé'}</div>
            ${reference ? `<div class="qr-reference">Réf: ${reference}</div>` : ''}
            ${svgData}
            <div class="qr-instructions">
              Scannez ce code QR pour accéder aux détails de l'objet
              ${reference ? `<br>Référence: ${reference}` : ''}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    // Give a moment to load before printing
    setTimeout(() => {
      printWindow.focus();
    }, 300);
  };

  // Function to share QR code (mobile only)
  const shareQRCode = async () => {
    if (!navigator.share) {
      alert('Le partage n\'est pas pris en charge sur ce navigateur');
      return;
    }

    try {
      await navigator.share({
        title: `QR Code - ${itemTitle || reference || 'Objet'}`,
        text: `Scannez ce code QR pour accéder aux détails de l'objet ${reference ? `(Réf: ${reference})` : ''}`,
        url: value,
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div ref={qrCodeRef} className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
        <QRCodeSVG
          value={value}
          size={size}
          level={level} // Using 'H' for high error correction to support the logo
          bgColor={bgColor}
          fgColor={fgColor}
          includeMargin={includeMargin}
          // Add TLEFLI logo in the center
          imageSettings={{
            src: "data:image/svg+xml;base64," + btoa(`<svg width="${size * 0.2}" height="${size * 0.2}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="20" fill="#ffffff"/><text x="50" y="55" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#333333" text-anchor="middle" dominant-baseline="middle">TLEFLI</text></svg>`),
            width: size * 0.2,
            height: size * 0.2,
            excavate: true
          }}
        />
      </div>
      
      {!hideButtons && (
        <div className="mt-3 flex space-x-2">
          {printOnly ? (
            <button
              onClick={printQRCode}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <PrinterIcon className="h-4 w-4 mr-1.5" />
              Imprimer
            </button>
          ) : (
            <>
              <button
                onClick={downloadQRCode}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                Télécharger
              </button>
              
              <button
                onClick={printQRCode}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <PrinterIcon className="h-4 w-4 mr-1.5" />
                Imprimer
              </button>
              
              {navigator.share && (
                <button
                  onClick={shareQRCode}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <ShareIcon className="h-4 w-4 mr-1.5" />
                  Partager
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
