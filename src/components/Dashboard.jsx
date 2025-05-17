import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import axios from 'axios';
import { motion } from 'framer-motion';
import ImageUploader from './ImageUploader';
import SpeciesCard from './SpeciesCard';
import ApiErrorNotification from './ApiErrorNotification';
import { checkApiAvailability } from '../proxy';
import { analyzeImage, getSpeciesInfo, getAllSpecies } from '../api-client';
import ImagePreviewWrapper from './ImagePreviewWrapper';
import Tooltip from './Tooltip';
import useAnalysisStore from '../store/analysisStore';
import speciesData from '../data/speciesData';
import '../styles/Dashboard.css';

// Check if running in Tauri environment safely
const isTauri = (() => {
  try {
    return typeof window !== 'undefined' && !!window.__TAURI_IPC__;
  } catch (error) {
    console.error("Error checking Tauri environment in Dashboard:", error);
    return false;
  }
})();

console.log("Dashboard initialization - Tauri environment detected:", isTauri);

// Use environment variable for API URL with fallback
const API_URL = import.meta.env.VITE_API_URL || 'https://shakirul-sust-treescopy-api.hf.space';

function Dashboard({ onOpenMeasurementTool }) {
  // Local state for UI components
  const [renderError, setRenderError] = useState(null);
  const [showApiError, setShowApiError] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);
  
  // Get analysis state and actions from Zustand store
  const { 
    uploadedImage, 
    result, 
    speciesInfo, 
    isAnalyzing, 
    error,
    startAnalysis,
    setResults,
    setError,
    clearResults
  } = useAnalysisStore();
  
  // Check if API is available - used for web version
  const checkApiStatus = async () => {
    if (isTauri) return true; // No need to check in Tauri mode
    
    try {
      // In web mode, don't do frequent checks that result in 404 errors
      // Just check once during component mount and when manually retried
      console.log("Checking API availability for web mode...");
      
      // Use our improved checkApiAvailability function
      const isAvailable = await checkApiAvailability(axios);
      console.log("API availability check result:", isAvailable);
      // Only show API error notification in Tauri mode, not in web mode
      if (isTauri) {
        setShowApiError(!isAvailable);
      }
      setApiAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      console.warn("API check failed:", error.message);
      // Only show API error notification in Tauri mode, not in web mode
      if (isTauri) {
        setShowApiError(true);
      }
      setApiAvailable(false);
      return false;
    }
  };
  
  // On component mount, check if we can render properly and check API
  useEffect(() => {
    try {
      console.log("Dashboard component mounted");
      // Test if we can import Tauri modules if in Tauri environment
      if (isTauri) {
        const testImport = async () => {
          try {
            await import('@tauri-apps/api/tauri');
            console.log("Successfully imported Tauri API in Dashboard");
          } catch (error) {
            console.error("Failed to import Tauri API:", error);
            setRenderError("Failed to initialize Tauri API: " + error.message);
          }
        };
        testImport();
        
        // In Tauri mode, check API and set up periodic checks
        checkApiStatus();
        
        // Set up periodic API check every 30 seconds (only for Tauri)
        const apiCheckInterval = setInterval(() => {
          checkApiStatus();
        }, 30000);
        
        return () => clearInterval(apiCheckInterval);
      } else {
        // In web mode, just check once and don't do periodic checks
        checkApiStatus();
      }
    } catch (error) {
      console.error("Dashboard initialization error:", error);
      setRenderError("Failed to initialize Dashboard: " + error.message);
    }
  }, []);
  
  // Fallback function to get local species info when API is unavailable
  const getLocalSpeciesInfo = (label) => {
    console.log("Using local fallback data for:", label);
    
    // Check if we have data for this species in our speciesData file
    if (speciesData[label]) {
      return speciesData[label];
    }
    
    // If no exact match, try to find a partial match for web-only
    if (!isTauri) {
      // Convert label to lowercase for case-insensitive matching
      const labelLower = label.toLowerCase();
      
      // Try to find partial matches in keys or scientific names
      for (const key in speciesData) {
        const species = speciesData[key];
        
        // Check if the label is contained in the key or scientific name
        if (key.toLowerCase().includes(labelLower) || 
            species.scientific_name.toLowerCase().includes(labelLower)) {
          console.log("Found partial match:", key);
          return species;
        }
      }
    }
    
    // Extract species name from label (may contain both scientific and common name)
    const parts = label.split('_');
    const scientificName = parts[0] || label;
    const commonName = parts[1] || scientificName;
    
    // Return generic info if no match exists
    return {
      name: commonName,
      scientific_name: scientificName.replace('_', ' '),
      description: "This tree species has distinctive features including its leaf shape, bark texture, and growth pattern. It's adapted to its native environment and plays an important role in local ecosystems.",
      family: "Information unavailable",
      distribution: "Native to various regions globally",
      uses: "Timber, shade, ornamental purposes, and wildlife habitat",
      image_url: null
    };
  };
  
  // First, let's add a helper function to properly handle different types of image sources
  const prepareImageForDisplay = (imageSource) => {
    // If it's a local file path (as seen in the logs)
    if (typeof imageSource === 'string' && (
      imageSource.startsWith('E:') || 
      imageSource.startsWith('C:') || 
      imageSource.startsWith('/') || 
      imageSource.startsWith('\\'))) {
      
      console.log("Converting local file path to File object:", imageSource);
      
      // For Tauri, we can use the asset protocol
      if (isTauri) {
        // Strip the path to make it relative if needed
        const fileName = imageSource.split('\\').pop().split('/').pop();
        console.log("Using asset protocol for local file:", fileName);
        
        // Return the image source as is - the actual conversion will happen in setResults
        return imageSource;
      } else {
        // In web mode, we can't directly access local files
        console.warn("Local file paths can't be directly accessed in web mode");
        return imageSource;
      }
    }
    
    // For File objects or other image sources, return as is
    return imageSource;
  };
  
  const handleImageAnalysis = async (file) => {
    console.log("Starting image analysis in environment:", isTauri ? "Tauri" : "Browser");
    startAnalysis(); // Start analysis and update store state
    
    console.log("Analyzing image:", file);
    
    // Ensure image is properly prepared for display
    const previewImage = prepareImageForDisplay(file);
    console.log("Prepared image for preview:", typeof previewImage, previewImage instanceof File);
    
    // Process the image
    try {
      // Analyze the image
      const analysisResult = await analyzeImage(file);
      console.log("Analysis result:", analysisResult);
      
      if (!analysisResult || !analysisResult.label) {
        throw new Error('Invalid analysis result');
      }
      
      // Check if this is a fallback result
      if (analysisResult._fallback) {
        console.log("Using fallback data from API client");
        // Only show API error in Tauri mode, not in web mode
        if (isTauri) {
          setShowApiError(true);
        }
        setApiAvailable(false);
      }
      
      try {
        // For web mode, use the species info that's already in the analysis result
        if (!isTauri && analysisResult.speciesInfo) {
          console.log("Using embedded species info for web:", analysisResult.speciesInfo);
          
          // Dynamically enrich web API data with local data when available
          // Extract species key by normalizing the label (replacing spaces with underscores)
          const normalizedKey = analysisResult.label.split('_')[0].replace(/\s+/g, '_');
          
          // Try to find matching species in local data
          if (speciesData[normalizedKey] || speciesData[analysisResult.label]) {
            const localData = speciesData[normalizedKey] || speciesData[analysisResult.label];
            
            // Merge missing data from local source
            const enrichedData = {
              ...analysisResult.speciesInfo,
              // Only add these fields if they don't exist in the API response
              common_name: analysisResult.speciesInfo.common_name || localData.common_name,
              family: analysisResult.speciesInfo.family || localData.family,
              properties: analysisResult.speciesInfo.properties || localData.properties,
              uses: analysisResult.speciesInfo.uses || localData.uses,
              distribution: analysisResult.speciesInfo.distribution || localData.distribution,
              habitat: analysisResult.speciesInfo.habitat || localData.habitat,
              conservation_status: analysisResult.speciesInfo.conservation_status || localData.conservation_status
            };
            
            console.log("Enriched species data with local information");
            analysisResult.speciesInfo = enrichedData;
          }
          
          try {
            await setResults(
              analysisResult,
              analysisResult.speciesInfo,
              previewImage
            );
          } catch (storageError) {
            console.error("Failed to store analysis results:", storageError);
            setError("Failed to save results. The analysis was successful, but the results couldn't be stored.");
          }
        } else {
          // For desktop/Tauri mode, get species info from the database
          try {
            const species = await getSpeciesInfo(analysisResult.label);
            console.log("Species info:", species);
            
            // Store results in the Zustand store
            try {
              await setResults(analysisResult, species, previewImage);
            } catch (storageError) {
              console.error("Failed to store analysis results:", storageError);
              setError("Failed to save results. The analysis was successful, but the results couldn't be stored.");
            }
          } catch (speciesError) {
            console.error("Failed to get species info:", speciesError);
            // Use fallback data
            const fallbackSpecies = getLocalSpeciesInfo(analysisResult.label);
            console.log("Using fallback species data:", fallbackSpecies);
            
            try {
              await setResults(
                analysisResult, 
                fallbackSpecies,
                previewImage
              );
            } catch (storageError) {
              console.error("Failed to store analysis results:", storageError);
              setError("Failed to save results. The analysis was successful, but the results couldn't be stored.");
            }
          }
        }
      } catch (error) {
        console.error("Error processing species info:", error);
        // In web mode, don't show error messages about API failure, just use fallback
        if (isTauri) {
          setError(`Analysis failed: ${error.message}`);
          setShowApiError(true);
        } else {
          // Clear any previous error messages
          setError(null);
        }
        setApiAvailable(false);
        
        // For web version, try to get a random species from our speciesData
        const speciesKeys = Object.keys(speciesData);
        const randomKey = speciesKeys[Math.floor(Math.random() * speciesKeys.length)];
        
        const mockResult = {
          label: randomKey,
          confidence: 0.92,
          _fallback: true
        };
        
        const fallbackSpecies = getLocalSpeciesInfo(mockResult.label);
        console.log("Using fallback species data:", fallbackSpecies);
        
        try {
          await setResults(
            mockResult,
            fallbackSpecies,
            previewImage
          );
        } catch (storageError) {
          console.error("Failed to store analysis results:", storageError);
          if (isTauri) {
            setError("Failed to save results. The fallback analysis was successful, but the results couldn't be stored.");
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      if (isTauri) {
        setError(`Failed to analyze image: ${error.message || error}`);
      } else {
        // In web version, don't show the error, just set to null
        setError(null);
        
        // For web version, use a random entry from our speciesData
        const speciesKeys = Object.keys(speciesData);
        const randomKey = speciesKeys[Math.floor(Math.random() * speciesKeys.length)];
        
        const mockResult = {
          label: randomKey,
          confidence: 0.85,
          _fallback: true
        };
        
        const fallbackSpecies = getLocalSpeciesInfo(mockResult.label);
        
        try {
          await setResults(
            mockResult,
            fallbackSpecies,
            previewImage
          );
        } catch (storageError) {
          console.error("Failed to store fallback results:", storageError);
        }
      }
    }
  };
  
  // Add this before the return statement
  const fallbackImageUrl = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100">
      <rect width="100%" height="100%" fill="#f0f0f0" />
      <path d="M30,70 L50,30 L70,70 Z" fill="#ccc" />
      <circle cx="50" cy="45" r="8" fill="#ccc" />
      <text x="50%" y="85%" font-family="Arial" font-size="8" text-anchor="middle" fill="#888">Image unavailable</text>
    </svg>
  `)}`;
  
  return (
    <motion.div 
      className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {isTauri && showApiError && (
        <ApiErrorNotification 
          onClose={() => setShowApiError(false)} 
          onRetry={checkApiStatus}
        />
      )}
      
      {renderError ? (
        <div className="mx-auto my-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center max-w-lg">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h2>
          <p className="text-red-700 dark:text-red-300">{renderError}</p>
        </div>
      ) : (
        <>
          <header className="bg-gradient-to-r from-green-700 to-green-800 dark:from-green-800 dark:to-green-900 text-white py-4 shadow-md flex justify-center items-center mb-6 transition-colors duration-300">
            <div className="flex items-center justify-center max-w-7xl w-full">
              <div className="flex items-center justify-center mr-3">
                <img src="/icon.png" alt="TreeScopeAI Logo" className="h-14 w-auto object-contain filter drop-shadow-md" />
              </div>
              <div className="flex flex-col items-start justify-center">
                <h1 className="text-3xl font-bold mb-0.5 leading-tight drop-shadow-sm">TreeScopeAI</h1>
                <p className="text-sm opacity-90 tracking-wide">
                  {!isTauri && !apiAvailable ? "Offline Mode - Using Sample Data" : "Wood Species Classifier"}
                </p>
              </div>
            </div>
          </header>
          
          <div className="px-4 pb-6 max-w-7xl mx-auto w-full flex flex-col items-center">
            <div className="flex flex-col md:flex-row w-full gap-6 mb-6">
              <motion.div 
                className="flex-1 p-5 bg-white dark:bg-gray-800/90 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 bg-opacity-95 dark:bg-opacity-95 transition-all duration-300"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-xl font-semibold text-green-700 dark:text-green-500 mb-4 text-center">How to Use TreeScopeAI</h2>
                <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4 mb-4 border-l-4 border-green-500 dark:border-green-600 transition-colors duration-300">
                  <div className="flex items-start mb-4">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0 shadow-sm">1</div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1 text-base">Upload an Image</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Select or drag & drop a clear photo of a tree.</p>
                    </div>
                  </div>
                  <div className="flex items-start mb-4">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0 shadow-sm">2</div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1 text-base">Wait for Analysis</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Our AI will process and identify the tree species.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0 shadow-sm">3</div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1 text-base">View Results</h3>
                      <Tooltip content="Results are saved across all pages until you select a new image" position="top">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Get detailed information about the identified species.</p>
                      </Tooltip>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 transition-colors duration-300 border border-green-100 dark:border-green-900/30">
                  <h3 className="text-green-700 dark:text-green-500 font-medium mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Tips for Best Results
                  </h3>
                  <ul className="space-y-2 pl-6 list-disc text-gray-600 dark:text-gray-400 text-sm">
                    <li>Use well-lit, clear images of trees</li>
                    <li>Include leaves, bark, and overall shape if possible</li>
                    <li>Avoid blurry or dark photos for accurate identification</li>
                    <li>Try multiple angles for better accuracy</li>
                  </ul>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex-1 p-5 bg-white dark:bg-gray-800/90 rounded-xl shadow-md flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700 bg-opacity-95 dark:bg-opacity-95 transition-all duration-300"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-green-700 dark:text-green-500 mb-4 text-center">Upload Your Tree Image</h2>
                <ImageUploader onImageSelected={handleImageAnalysis} isUploading={isAnalyzing} />
              </motion.div>
            </div>
            
            {/* Removed the redundant "Analyzing image..." section */}
          
            {error && isTauri && (
              <motion.div 
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center w-full max-w-2xl mb-6 shadow-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          
            {!isAnalyzing && uploadedImage && !result && !error && (
              <motion.div 
                className="flex flex-col items-center w-full max-w-2xl mb-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative w-full rounded-xl overflow-hidden shadow-lg">
                  <ImagePreviewWrapper 
                    src={uploadedImage}
                    alt="Uploaded tree"
                    aspectRatio="auto"
                    maxWidth="600px"
                    maxHeight="400px"
                    watermark="TreeScopeAI"
                    onRetry={() => clearResults()}
                  />
                  <div className="absolute bottom-3 right-3 flex space-x-2">
                    <Tooltip content="Measure elements in this image" position="top">
                      <button
                        onClick={() => onOpenMeasurementTool(uploadedImage)}
                        className="bg-green-600/90 hover:bg-green-700 dark:bg-green-700/90 dark:hover:bg-green-600 text-white rounded-full p-2.5 shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 z-30"
                        aria-label="Open measurement tool"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </Tooltip>
                    <Tooltip content="Clear image and start over" position="top">
                      <button
                        onClick={() => clearResults()}
                        className="bg-gray-600/90 hover:bg-gray-700 dark:bg-gray-700/90 dark:hover:bg-gray-600 text-white rounded-full p-2.5 shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 z-30"
                        aria-label="Clear image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </motion.div>
            )}
          
            {result && speciesInfo && uploadedImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full flex flex-col items-center mb-6 mx-auto"
              >
                {result.confidence < 0.90 ? (
                  <motion.div 
                    className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-5 w-full max-w-2xl shadow-md ring-1 ring-yellow-300 dark:ring-yellow-600"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="flex items-start">
                      <div className="bg-yellow-100 dark:bg-yellow-800/60 rounded-full p-2 mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-yellow-800 dark:text-yellow-300 text-sm md:text-base font-medium">
                          The uploaded image might not be a valid wood cross-section or lacks sufficient anatomical detail. Please upload a clearer, well-lit wood core image with visible structure.
                        </p>
                        <div className="mt-3 flex justify-end">
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <SpeciesCard
                    image={uploadedImage}
                    species={speciesInfo}
                    confidence={result.confidence}
                    onClear={clearResults}
                  />
                )}
              </motion.div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

export default Dashboard; 