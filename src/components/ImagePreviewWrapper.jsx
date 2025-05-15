import React from 'react';
import PropTypes from 'prop-types';

const ImagePreviewWrapper = ({ 
  src, 
  alt = "Image preview",
  isProcessing = false,
  processingMessage = "Processing...",
  aspectRatio = "4/3",
  maxWidth = "100%",
  maxHeight = "auto",
  containerClassName = "",
}) => {
  // Create default SVG placeholder for failed images
  const fallbackImageUrl = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100">
      <rect width="100%" height="100%" fill="#f0f0f0" />
      <path d="M30,70 L50,30 L70,70 Z" fill="#ccc" />
      <circle cx="50" cy="45" r="8" fill="#ccc" />
      <text x="50%" y="85%" font-family="Arial" font-size="8" text-anchor="middle" fill="#888">Image unavailable</text>
    </svg>
  `)}`;

  return (
    <div 
      className={`relative overflow-hidden rounded-lg ${containerClassName}`}
      style={{ 
        aspectRatio,
        maxWidth,
        maxHeight: maxHeight === "auto" ? "none" : maxHeight
      }}
    >
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-white font-medium">{processingMessage}</p>
          </div>
        </div>
      )}
      
      {/* Image */}
      <img
        src={src || fallbackImageUrl}
        alt={alt}
        className="w-full h-full object-contain"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = fallbackImageUrl;
        }}
      />
    </div>
  );
};

ImagePreviewWrapper.propTypes = {
  src: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.instanceOf(File),
    PropTypes.instanceOf(Blob)
  ]),
  alt: PropTypes.string,
  isProcessing: PropTypes.bool,
  processingMessage: PropTypes.string,
  aspectRatio: PropTypes.string,
  maxWidth: PropTypes.string,
  maxHeight: PropTypes.string,
  containerClassName: PropTypes.string,
};

export default ImagePreviewWrapper; 