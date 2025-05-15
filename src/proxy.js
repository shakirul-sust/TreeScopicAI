// This file contains utility functions to handle API requests with CORS proxies

// Check if we're in development mode
const isDev = import.meta.env.DEV;
const baseApiUrl = import.meta.env.VITE_API_URL || 'https://shakirul-sust-treescopy-api.hf.space';

// Direct API URL for desktop app
const DIRECT_API_URL = 'https://shakirul-sust-treescopy-api.hf.space';

/**
 * Utility to create proxied URLs for API requests
 * @param {string} baseUrl - The original API URL
 * @param {string} path - The API path
 * @returns {string} - The proxied URL
 */
export const getProxiedUrl = (baseUrl, path) => {
  // In development, use the local proxy
  if (isDev) {
    return `/api${path}`;
  }
  
  // List of CORS proxies to try in production
  const corsProxies = [
    (url) => url, // Direct URL (no proxy)
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://cors-anywhere.herokuapp.com/${url}`
  ];
  
  // If we already have a working proxy stored, use it
  if (window.WORKING_PROXY_INDEX !== undefined) {
    const proxyFn = corsProxies[window.WORKING_PROXY_INDEX];
    return proxyFn(`${baseUrl}${path}`);
  }
  
  // Otherwise return the direct URL and let the caller handle fallbacks
  return `${baseUrl}${path}`;
};

/**
 * Check if the API is available
 * @param {Object} axios - Axios instance
 * @returns {Promise<boolean>} - Promise resolving to true if API is available
 */
export const checkApiAvailability = async (axios) => {
  // In development, check the local proxy
  if (isDev) {
    try {
      // Use GET request to /species as it's more likely to work than HEAD
      const response = await axios.get('/api/species');
      console.log('Development API is available');
      return true;
    } catch (error) {
      console.warn('Development API check failed:', error.message);
      return false;
    }
  }
  
  // In production, try different approaches
  const corsProxies = [
    (url) => url, // Direct URL (no proxy)
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://cors-anywhere.herokuapp.com/${url}`
  ];
  
  // Try each proxy with the /species endpoint (more reliable than /predict)
  for (let i = 0; i < corsProxies.length; i++) {
    try {
      const proxyFn = corsProxies[i];
      const url = proxyFn(`${DIRECT_API_URL}/species`);
      console.log(`Checking API with proxy ${i}: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Origin': window.location.origin,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      // If we get here, this proxy works
      window.WORKING_PROXY_INDEX = i;
      console.log(`API check successful with proxy ${i}`);
      return true;
    } catch (error) {
      console.warn(`API check with proxy ${i} failed:`, error.message);
    }
  }
  
  // If all checks fail, API is not available
  return false;
};

/**
 * Make an API request with proper error handling and CORS proxy support
 * @param {Object} axios - Axios instance
 * @param {string} method - HTTP method (get, post, etc.)
 * @param {string} baseUrl - Base API URL
 * @param {string} path - API endpoint path
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Promise resolving to response data
 */
export const makeApiRequest = async (axios, method, baseUrl, path, options = {}) => {
  // Try direct request first
  try {
    const url = getProxiedUrl(baseUrl, path);
    console.log(`Sending Request: ${method.toUpperCase()} ${path}`);
    
    const response = await axios({
      method,
      url,
      ...options,
      headers: {
        ...(options.headers || {}),
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    console.log(`Received Response from: ${path} ${response.status}`);
    return response;
  } catch (directError) {
    const status = directError.response?.status;
    const statusText = directError.response?.statusText || '';
    console.warn(`Direct API request failed: ${path} (${status} ${statusText}) - ${directError.message}`);
    
    // Log more detailed information
    if (directError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error response data:", directError.response.data);
      console.error("Error response status:", directError.response.status);
      console.error("Error response headers:", directError.response.headers);
    } else if (directError.request) {
      // The request was made but no response was received
      console.error("Error request:", directError.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error message:", directError.message);
    }
    
    // If we have a working proxy index, don't try others
    if (window.WORKING_PROXY_INDEX !== undefined) {
      throw directError;
    }
    
    // Try each CORS proxy in sequence
    const corsProxies = [
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url) => `https://cors-anywhere.herokuapp.com/${url}`
    ];
    
    for (let i = 0; i < corsProxies.length; i++) {
      try {
        const proxyFn = corsProxies[i];
        const proxyUrl = proxyFn(`${baseUrl}${path}`);
        console.log(`Trying proxy ${i}: ${method.toUpperCase()} ${proxyUrl}`);
        
        const response = await axios({
          method,
          url: proxyUrl,
          ...options,
          headers: {
            ...(options.headers || {}),
            'Origin': window.location.origin,
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        // Store the working proxy index
        window.WORKING_PROXY_INDEX = i;
        console.log(`Proxy ${i} worked successfully: ${response.status}`);
        return response;
      } catch (proxyError) {
        const status = proxyError.response?.status;
        const statusText = proxyError.response?.statusText || '';
        console.warn(`Proxy ${i} failed: ${status} ${statusText} - ${proxyError.message}`);
      }
    }
    
    // If all proxies fail, throw the original error
    throw directError;
  }
}; 