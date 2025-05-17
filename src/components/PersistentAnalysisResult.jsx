import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAnalysisStore from '../store/analysisStore';
import Tooltip from './Tooltip';

const PersistentAnalysisResult = () => {
  const { uploadedImage, result, speciesInfo, showNotification, hideNotification } = useAnalysisStore();
  const [imageSrc, setImageSrc] = useState(null);
  
  // Handle image conversion in useEffect to properly handle cleanup
  useEffect(() => {
    let objectUrl = null;
    
    // Safely convert to a usable image source
    if (!uploadedImage) {
      setImageSrc(null);
      return;
    }
    
    try {
      if (typeof uploadedImage === 'string') {
        // If it's a string path or data URL
        if (uploadedImage.startsWith('data:')) {
          // It's a data URL, use directly
          console.log("Using data URL for image");
          setImageSrc(uploadedImage);
        } else if (uploadedImage.startsWith('http')) {
          // It's a remote URL, use directly
          console.log("Using remote URL for image");
          setImageSrc(uploadedImage);
        } else if (uploadedImage.startsWith('E:') || 
                  uploadedImage.startsWith('C:') || 
                  uploadedImage.startsWith('/') || 
                  uploadedImage.startsWith('\\')) {
          // It's a local file path, which may not load in browser
          console.log("Local file path detected, attempt to use:", uploadedImage);
          setImageSrc(uploadedImage);
        } else {
          // Other string format
          console.log("Other string format for image:", uploadedImage);
          setImageSrc(uploadedImage);
        }
      } else if (uploadedImage instanceof File || uploadedImage instanceof Blob) {
        // If it's a File or Blob object, create an object URL
        console.log("Creating object URL from File/Blob");
        objectUrl = URL.createObjectURL(uploadedImage);
        setImageSrc(objectUrl);
      } else if (uploadedImage && typeof uploadedImage === 'object') {
        if (uploadedImage._type === 'local_path') {
          // Handle our special local path format
          console.log("Local file path object detected:", uploadedImage.path);
          setImageSrc(uploadedImage.path);
        } else if (uploadedImage.type && uploadedImage.size) {
          // Handle serialized File-like objects from localStorage
          try {
            console.log("Creating blob from serialized File-like object");
            const blob = new Blob([uploadedImage], { type: uploadedImage.type });
            objectUrl = URL.createObjectURL(blob);
            setImageSrc(objectUrl);
          } catch (err) {
            console.error('Failed to create Blob from stored image:', err);
            setImageSrc(null);
          }
        } else {
          // Unknown object format
          console.warn('Unknown object format for image:', uploadedImage);
          setImageSrc(null);
        }
      } else {
        // Fallback to placeholder if image format is unrecognized
        console.warn('Unrecognized image format in analysis results:', typeof uploadedImage);
        setImageSrc(null);
      }
    } catch (error) {
      console.error("Error processing image source:", error);
      setImageSrc(null);
    }
    
    // Cleanup function to revoke object URL when component unmounts or image changes
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [uploadedImage]);
  
  // Format confidence as percentage
  const confidencePercent = Math.round(result?.confidence * 100) || 0;
  
  // If no results are available or no valid image source, don't render anything
  if (!uploadedImage || !result || !speciesInfo || !imageSrc || !showNotification) {
    return null;
  }
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-green-100 dark:border-green-900 max-w-xs z-50"
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className={`${result.confidence < 0.90 ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 dark:from-yellow-700 dark:to-yellow-800' : 'bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800'} px-3 py-2 text-white flex justify-between items-center`}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              {result.confidence < 0.90 ? (
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              )}
            </svg>
            <h3 className="text-sm font-semibold">{result.confidence < 0.90 ? 'Warning' : 'Analysis Results'}</h3>
          </div>
          
          <Tooltip content="Close notification" position="left">
            <button
              onClick={hideNotification}
              className="text-white/80 hover:text-white focus:outline-none p-1 transition-colors"
              aria-label="Close notification"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </Tooltip>
        </div>
        
        <div className="p-3">
          {result.confidence < 0.90 ? (
            <motion.div 
              className="text-yellow-800 dark:text-yellow-300 text-xs ring-1 ring-yellow-300 dark:ring-yellow-600 bg-yellow-50/70 dark:bg-yellow-800/20 p-2 rounded-lg shadow-sm"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="flex items-start">
                <div className="bg-yellow-100 dark:bg-yellow-800/60 rounded-full p-1 mr-2 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-600 dark:text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">The uploaded image might not be a valid wood cross-section or lacks sufficient anatomical detail.</p>
                  <p className="mb-2">Please upload a clearer, well-lit wood core image with visible structure.</p>
                  <div className="flex justify-end">
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="flex gap-3">
                <div className="relative flex-shrink-0">
                  <Tooltip content="Analyzed image" position="top">
                    <div className="h-20 w-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                      <img 
                        src={imageSrc} 
                        alt="Analyzed tree" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', imageSrc);
                          e.target.onerror = null; // Prevent infinite error loop
                          
                          // Use a custom SVG as placeholder for failed images
                          e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100">
                              <rect width="100%" height="100%" fill="#f0f0f0" />
                              <path d="M30,70 L50,30 L70,70 Z" fill="#ccc" />
                              <circle cx="50" cy="45" r="8" fill="#ccc" />
                              <text x="50%" y="85%" font-family="Arial" font-size="8" text-anchor="middle" fill="#888">Image unavailable</text>
                            </svg>
                          `)}`;
                        }}
                      />
                    </div>
                  </Tooltip>
                </div>
                
                <div className="flex flex-col justify-between flex-grow">
                  <div>
                    <Tooltip content={`Scientific name: ${speciesInfo.scientific_name}`} position="top">
                      <h3 className="font-bold text-gray-800 dark:text-white text-base truncate">
                        {speciesInfo.name}
                      </h3>
                    </Tooltip>
                    
                    <Tooltip content="Family classification" position="top">
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">
                        {speciesInfo.family}
                      </p>
                    </Tooltip>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{confidencePercent}%</span>
                    </div>
                    
                    <Tooltip content={`Identification confidence: ${confidencePercent}%`} position="bottom">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full" 
                          style={{ width: `${confidencePercent}%` }}
                        ></div>
                      </div>
                    </Tooltip>
                  </div>
                </div>
              </div>
              
              <Tooltip content="Brief description" position="top">
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 line-clamp-2 overflow-hidden">
                  {speciesInfo.description?.substring(0, 120)}...
                </p>
              </Tooltip>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PersistentAnalysisResult; 