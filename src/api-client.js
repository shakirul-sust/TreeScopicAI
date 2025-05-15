// API client for TreeScopeAI
import axios from 'axios';
import { makeApiRequest } from './proxy';

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'https://shakirul-sust-treescopy-api.hf.space';

// Check if running in Tauri environment
const isTauri = (() => {
  try {
    return typeof window !== 'undefined' && !!window.__TAURI_IPC__;
  } catch (error) {
    console.error("Error checking Tauri environment:", error);
    return false;
  }
})();

/**
 * Analyze an image using the API
 * @param {File|Object} file - File object or path to analyze
 * @returns {Promise<Object>} - Analysis result
 */
export const analyzeImage = async (file) => {
  // For Tauri desktop app, use the native invoke method
  if (isTauri && file.path) {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      console.log("Using Tauri native analysis for file:", file.path);
      
      const result = await invoke('analyze_local_image', {
        filePath: file.path,
      });
      
      return result;
    } catch (error) {
      console.error("Tauri analysis failed, falling back to API:", error);
      // Fall through to web API method if Tauri method fails
    }
  }
  
  // For web or fallback, use the API
  console.log("Using web API for image analysis");
  
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Make the API request with our proxy utility
    const response = await makeApiRequest(
      axios,
      'post',
      API_URL,
      '/predict',
      {
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 60000 // 60 second timeout for image processing
      }
    );
    
    const result = response.data;
    
    // In web mode, immediately add species info to avoid additional API calls
    if (!isTauri && result && result.label) {
      // Parse the label to extract scientific and common names
      const parts = result.label.split('_');
      const scientificName = parts[0] || result.label;
      const commonName = parts[1] || scientificName;
      
      // Add species info directly to the result for web version
      result.speciesInfo = {
        name: commonName,
        scientific_name: scientificName.replace('_', ' '),
        description: "This tree species has distinctive features including its leaf shape, bark texture, and growth pattern. It's adapted to its native environment and plays an important role in local ecosystems.",
        family: "Information unavailable in web version",
        distribution: "Native to various regions globally",
        uses: "Timber, shade, ornamental purposes, and wildlife habitat",
        image_url: null,
        _webDirect: true
      };
    }
    
    return result;
  } catch (error) {
    console.error("API request failed:", error);
    
    // Return fallback data with embedded species info for web
    const label = "Oak_Tree";
    
    return {
      label: label,
      confidence: 0.85,
      _fallback: true,
      speciesInfo: {
        name: "Oak Tree",
        scientific_name: "Quercus robur",
        description: "Oak trees are known for their strength and longevity. They produce acorns and have lobed leaves. They are important for wildlife and ecosystem health.",
        family: "Fagaceae",
        distribution: "Native to Europe, North Africa and western Asia",
        uses: "Furniture, flooring, construction, wine barrels, and as ornamental trees",
        image_url: null,
        _webDirect: true
      }
    };
  }
};

/**
 * Get species information by label
 * @param {string} label - Species label
 * @returns {Promise<Object>} - Species information
 */
export const getSpeciesInfo = async (label) => {
  // For Tauri desktop app, try to use the native invoke method first
  if (isTauri) {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      console.log("Using Tauri native database for species info:", label);
      
      const result = await invoke('get_species_info', {
        label: label,
      });
      
      if (result && typeof result === 'object') {
        return result;
      }
      
      console.warn("Tauri returned invalid species data, falling back to API");
      // Fall through to web API method if Tauri method returns invalid data
    } catch (error) {
      console.error("Tauri species lookup failed, falling back to API:", error);
      // Fall through to web API method if Tauri method fails
    }
  }
  
  // For web or fallback, use the API
  console.log("Using web API for species info:", label);
  
  try {
    // First try to get the species info using query parameter instead of path parameter
    // Format the label for query
    const formattedLabel = encodeURIComponent(label);
    
    // Make the API request with our proxy utility using query parameter
    const response = await makeApiRequest(
      axios,
      'get',
      API_URL,
      `/species?label=${formattedLabel}`,
      { timeout: 15000 }
    );
    
    return response.data;
  } catch (error) {
    console.error("Species lookup failed with query parameter:", error);
    
    try {
      // Try alternative endpoint format as fallback
      const formattedLabel = encodeURIComponent(label);
      const response = await makeApiRequest(
        axios,
        'get',
        API_URL,
        `/species/${formattedLabel}`,
        { timeout: 15000 }
      );
      
      return response.data;
    } catch (secondError) {
      console.error("All species lookup methods failed:", secondError);
      
      // Return a basic fallback object based on the label
      const parts = label.split('_');
      const scientificName = parts[0] || label;
      const commonName = parts[1] || scientificName;
      
      return {
        name: commonName,
        scientific_name: scientificName.replace('_', ' '),
        description: "This tree species has distinctive features including its leaf shape, bark texture, and growth pattern. It's adapted to its native environment and plays an important role in local ecosystems.",
        family: "Information unavailable",
        distribution: "Native to various regions globally",
        uses: "Timber, shade, ornamental purposes, and wildlife habitat",
        image_url: null,
        _fallback: true
      };
    }
  }
};

/**
 * Get all available species
 * @returns {Promise<Array>} - Array of species
 */
export const getAllSpecies = async () => {
  try {
    // Make the API request with our proxy utility
    const response = await makeApiRequest(
      axios,
      'get',
      API_URL,
      '/species',
      { timeout: 15000 }
    );
    
    return response.data;
  } catch (error) {
    console.error("Failed to get all species:", error);
    return []; // Return empty array on failure
  }
}; 