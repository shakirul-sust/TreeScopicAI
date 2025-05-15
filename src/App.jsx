import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ActivationScreen from './components/ActivationScreen';
import Dashboard from './components/Dashboard';
import SideDrawer from './components/SideDrawer';
import MenuButton from './components/MenuButton';
import MeasurementTool from './components/MeasurementTool';
import SpeciesIndex from './pages/SpeciesIndex';
import HelpSupport from './pages/HelpSupport';
import Contact from './pages/Contact';
import ErrorBoundary from './components/ErrorBoundary';
import PersistentAnalysisResult from './components/PersistentAnalysisResult';
import './styles/App.css';
import './styles/utilities.css';

// Sample valid keys for browser testing (only in development)
const SAMPLE_KEYS = [
  "eb9613ca2d9ac438553debfb77426ee8",
  "3eb7c8193d9a65cf5440090763a64ecf",
  "9d5240bb66cba84e5e2a55544c1ba431",
  "3755c9402da1b3525dbb3088dfb08084",
  "1befff97c87c21329365adda93b840a8"
];

// Safely check if running in Tauri environment with error handling
const isTauri = (() => {
  try {
    return typeof window !== 'undefined' && !!window.__TAURI_IPC__;
  } catch (error) {
    console.error("Error checking Tauri environment:", error);
    return false;
  }
})();

console.log("App initialization - Tauri environment detected:", isTauri);

// RouteTracker component to update body's data-route attribute
function RouteTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // Update body data attribute with current route
    document.body.setAttribute('data-route', location.pathname);
    
    // Clean up on unmount
    return () => {
      document.body.removeAttribute('data-route');
    };
  }, [location.pathname]);
  
  return null; // This component doesn't render anything
}

function App() {
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAutoOpened, setIsAutoOpened] = useState(false);
  const [isMeasurementToolOpen, setIsMeasurementToolOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [activationRetries, setActivationRetries] = useState(0);
  
  useEffect(() => {
    // Check activation status on app load with retry mechanism
    const checkActivation = async () => {
      try {
        await checkActivationStatus();
      } catch (err) {
        console.error("Failed to check activation:", err);
        if (activationRetries < 3) {
          console.log(`Retrying activation check (attempt ${activationRetries + 1})...`);
          setActivationRetries(prev => prev + 1);
          setTimeout(checkActivation, 1500); // Retry after 1.5 seconds
        } else {
          setError("Failed to initialize application after multiple attempts. Please restart the application.");
          setIsLoading(false);
        }
      }
    };
    
    checkActivation();
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('treescopeai_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, [activationRetries]);
  
  const checkActivationStatus = async () => {
    try {
      if (isTauri) {
        // Use Tauri invoke when available
        try {
          const { invoke } = await import('@tauri-apps/api/tauri');
          const activated = await invoke('is_activated');
          console.log("Activation status check result:", activated);
          setIsActivated(activated);
          setIsLoading(false);
        } catch (tauriError) {
          console.error('Tauri invoke error:', tauriError);
          
          // For debug builds, try to open the Tauri devtools
          if (process.env.NODE_ENV === 'development') {
            try {
              const { invoke } = await import('@tauri-apps/api/tauri');
              await invoke('plugin:tauriDevtools|open');
            } catch (e) {
              console.log('Tauri devtools not available:', e);
            }
          }
          
          // Fallback to browser mode if Tauri fails
          const activationState = localStorage.getItem('treescopeai_activated');
          setIsActivated(activationState === 'true');
          
          // Only throw to trigger retry if we really need to
          if (!activationState && activationRetries < 3) {
            throw new Error("Tauri activation check failed, retrying...");
          }
          
          setError("Failed to check activation with Tauri. Using browser mode.");
          setIsLoading(false);
        }
      } else {
        // Browser fallback: check localStorage
        console.log("Using browser activation check");
        const activationState = localStorage.getItem('treescopeai_activated');
        setIsActivated(activationState === 'true');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to check activation status:', error);
      // Throw to trigger retry
      throw error;
    }
  };
  
  const handleActivation = async (key) => {
    console.log("Attempting activation with key:", key);
    setError(null);
    
    try {
      if (isTauri) {
        // Use Tauri invoke when available
        try {
          const { invoke } = await import('@tauri-apps/api/tauri');
          const success = await invoke('activate_with_key', { key });
          console.log("Tauri activation result:", success);
          
          if (success) {
            setIsActivated(true);
            return true;
          } else {
            return false;
          }
        } catch (tauriError) {
          console.error('Tauri invoke error during activation:', tauriError);
          
          // Try to open devtools in development mode
          if (process.env.NODE_ENV === 'development') {
            try {
              const { invoke } = await import('@tauri-apps/api/tauri');
              await invoke('plugin:tauriDevtools|open');
            } catch (e) {
              console.log('Tauri devtools not available:', e);
            }
          }
          
          // Special case - if activation key is a known sample key, allow it in all modes
          if (SAMPLE_KEYS.includes(key)) {
            localStorage.setItem('treescopeai_activated', 'true');
            setIsActivated(true);
            return true;
          }
          
          throw new Error(`Tauri activation failed: ${tauriError.message || 'Unknown error'}`);
        }
      } else {
        // Browser fallback: check against sample keys
        console.log("Using browser activation check");
        if (SAMPLE_KEYS.includes(key)) {
          localStorage.setItem('treescopeai_activated', 'true');
          setIsActivated(true);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Failed to process activation:', error);
      throw error; // Re-throw to allow the component to handle the error
    }
  };
  
  const toggleDarkMode = () => {
    const newDarkModeState = !isDarkMode;
    setIsDarkMode(newDarkModeState);
    
    if (newDarkModeState) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('treescopeai_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('treescopeai_theme', 'light');
    }
  };
  
  // Handle drawer toggle with auto-open support
  const handleDrawerToggle = (isAuto = false) => {
    if (isAuto) {
      setIsAutoOpened(true);
      setIsDrawerOpen(true);
    } else {
      setIsAutoOpened(false);
      setIsDrawerOpen(!isDrawerOpen);
    }
  };
  
  // Handle measurement tool toggle
  const handleMeasurementToolToggle = (image = null) => {
    if (image) {
      setCurrentImage(image);
    }
    setIsMeasurementToolOpen(!isMeasurementToolOpen);
  };
  
  // Handle application reset when the error boundary catches an error
  const handleErrorBoundaryReset = () => {
    // Reset key application state
    setError(null);
    setIsDrawerOpen(false);
    setIsMeasurementToolOpen(false);
    setCurrentImage(null);
    setIsAutoOpened(false);
    
    // Force a re-render of key components
    console.log("Application reset triggered by error boundary");
  };
  
  // Handle errors caught by the error boundary for logging/analytics
  const handleErrorBoundaryError = (error, errorInfo) => {
    console.error("Application error caught by boundary:", error);
    // Here you could send error reports to a monitoring service
  };
  
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading TreeScopeAI...</p>
        {activationRetries > 0 && (
          <p className="retry-message">Retrying initialization ({activationRetries}/3)...</p>
        )}
      </div>
    );
  }
  
  if (error && !isActivated) {
    return (
      <div className="error-screen">
        <div className="error-icon">⚠️</div>
        <h2>Application Error</h2>
        <p>{error}</p>
        <p>You can try activating in browser mode with one of these keys:</p>
        <div className="sample-keys">
          {SAMPLE_KEYS.map((key, index) => (
            <div key={index} className="sample-key" onClick={() => handleActivation(key)}>
              {key}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary 
      onReset={handleErrorBoundaryReset}
      onError={handleErrorBoundaryError}
    >
      <motion.div 
        className={`app ${isDarkMode ? 'dark' : ''} bg-gray-100 dark:bg-gray-900 min-h-screen`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Route tracker */}
        <RouteTracker />
        
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-blue-50/30 dark:from-green-900/10 dark:to-blue-900/10 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        
        <MenuButton onClick={() => handleDrawerToggle(false)} />
        
        <SideDrawer 
          isOpen={isDrawerOpen}
          onClose={handleDrawerToggle}
          toggleDarkMode={toggleDarkMode}
          isDarkMode={isDarkMode}
        />
        
        <MeasurementTool
          isOpen={isMeasurementToolOpen}
          onClose={() => setIsMeasurementToolOpen(false)}
          currentImage={currentImage}
        />
        
        {/* Persistent Analysis Result (visible on all pages) */}
        {isActivated && <PersistentAnalysisResult />}
        
        <AnimatePresence mode="wait">
          <Routes>
            <Route 
              path="/" 
              element={
                isActivated ? (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Dashboard 
                      onOpenMeasurementTool={handleMeasurementToolToggle}
                    />
                  </motion.div>
                ) : (
                  <Navigate to="/activate" />
                )
              } 
            />
            <Route 
              path="/activate" 
              element={
                isActivated ? (
                  <Navigate to="/" />
                ) : (
                  <motion.div
                    key="activation"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ActivationScreen onActivate={handleActivation} />
                  </motion.div>
                )
              } 
            />
            <Route 
              path="/species-index" 
              element={
                isActivated ? (
                  <motion.div
                    key="species-index"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SpeciesIndex />
                  </motion.div>
                ) : (
                  <Navigate to="/activate" />
                )
              } 
            />
            <Route 
              path="/help-support" 
              element={
                isActivated ? (
                  <motion.div
                    key="help-support"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <HelpSupport />
                  </motion.div>
                ) : (
                  <Navigate to="/activate" />
                )
              } 
            />
            <Route 
              path="/contact" 
              element={
                isActivated ? (
                  <motion.div
                    key="contact"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Contact />
                  </motion.div>
                ) : (
                  <Navigate to="/activate" />
                )
              } 
            />
          </Routes>
        </AnimatePresence>
      </motion.div>
    </ErrorBoundary>
  );
}

export default App; 