import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import sustLogo from '../assets/sust-logo.png';
import '../styles/SideDrawer.css';

const SideDrawer = ({ isOpen, onClose, toggleDarkMode, isDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on a full-page route that shouldn't have the hover trigger
  const isFullPageRoute = ['/species-index', '/help-support', '/contact'].includes(location.pathname);
  
  // Navigation handlers
  const navigateToSpeciesIndex = () => {
    navigate('/species-index');
    onClose(false);
  };
  
  const navigateToHelp = () => {
    navigate('/help-support');
    onClose(false);
  };
  
  const navigateToContact = () => {
    navigate('/contact');
    onClose(false);
  };

  return (
    <>
      {/* Trigger zone for hover detection - only show on main pages */}
      {!isFullPageRoute && (
        <div 
          className="fixed top-0 right-0 w-10 h-full"
          style={{
            zIndex: 'var(--z-drawer-trigger)',
            pointerEvents: isFullPageRoute ? 'none' : 'auto'
          }}
        />
      )}
      
      {/* Pulsing indicator when drawer is closed */}
      <AnimatePresence>
        {!isOpen && !isFullPageRoute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-10 right-5"
            style={{ zIndex: 'var(--z-drawer-trigger)' }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
              className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => onClose(false)}
            aria-hidden="true"
            style={{ zIndex: 'var(--z-drawer-backdrop)' }}
          />
        )}
      </AnimatePresence>
      
      {/* Side drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            initial={{ 
              x: 300, 
              opacity: 0.8
            }}
            animate={{ 
              x: 0, 
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
              }
            }}
            exit={{ 
              x: 300, 
              opacity: 0,
              transition: {
                ease: "easeInOut",
                duration: 0.3
              }
            }}
            className="fixed top-0 right-0 w-full sm:w-96 md:w-80 h-full
                      shadow-2xl overflow-y-auto
                      backdrop-blur-xl glassmorphism
                      rounded-l-3xl border-l dark:border-gray-700
                      bg-white dark:bg-gray-800
                      transition-all duration-300
                      flex flex-col"
            style={{ zIndex: 'var(--z-drawer)' }}
          >
            {/* Logo Section */}
            <div className="flex justify-center items-center p-6 border-b dark:border-gray-700/50">
              <img 
                src={sustLogo} 
                alt="Shahjalal University of Science and Technology (SUST)" 
                className="h-20 w-auto"
              />
            </div>
            
            {/* Theme Toggle */}
            <div className="py-6 flex flex-col items-center border-b dark:border-gray-700/50">
              <motion.div
                className="flex items-center bg-gray-100 dark:bg-gray-700 p-1.5 rounded-full w-16 h-8 cursor-pointer relative border-2 border-transparent dark:border-gray-400"
                onClick={toggleDarkMode}
                animate={{ 
                  backgroundColor: isDarkMode ? 'rgb(31, 41, 55)' : 'rgb(243, 244, 246)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                role="switch"
                aria-checked={isDarkMode}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleDarkMode();
                  }
                }}
              >
                <motion.div
                  className="w-6 h-6 rounded-full flex justify-center items-center absolute shadow-md"
                  animate={{ 
                    left: isDarkMode ? '53%' : '6%',
                    backgroundColor: isDarkMode ? '#5a86df' : '#f6b055'
                  }}
                >
                  {isDarkMode ? (
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="#fff"
                      viewBox="0 0 16 16"
                      initial={{ rotate: -15 }}
                      animate={{ rotate: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
                    </motion.svg>
                  ) : (
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="#fff"
                      viewBox="0 0 16 16"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8z"/>
                    </motion.svg>
                  )}
                </motion.div>
              </motion.div>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-2 text-center font-medium">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </p>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex-grow flex flex-col p-5 space-y-4">
              {/* Tree Species Index Button */}
              <motion.button
                onClick={navigateToSpeciesIndex}
                className="w-full py-3 px-4 bg-green-100 dark:bg-green-800/30 hover:bg-green-200 dark:hover:bg-green-700/50 
                          text-green-800 dark:text-green-200 rounded-lg transition-colors duration-200
                          flex items-center justify-center space-x-2 shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span className="font-medium">Tree Species Index</span>
              </motion.button>
              
              {/* Help & Support Button */}
              <motion.button
                onClick={navigateToHelp}
                className="w-full py-3 px-4 bg-blue-100 dark:bg-blue-800/30 hover:bg-blue-200 dark:hover:bg-blue-700/50 
                          text-blue-800 dark:text-blue-200 rounded-lg transition-colors duration-200
                          flex items-center justify-center space-x-2 shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Help & Support</span>
              </motion.button>
            </div>
            
            {/* Contact Button (at bottom) */}
            <div className="p-5 border-t dark:border-gray-700/50">
              <motion.button
                onClick={navigateToContact}
                className="w-full py-3 px-4 bg-purple-100 dark:bg-purple-800/30 hover:bg-purple-200 dark:hover:bg-purple-700/50 
                          text-purple-800 dark:text-purple-200 rounded-lg transition-colors duration-200
                          flex items-center justify-center space-x-2 shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="font-medium">Contact</span>
              </motion.button>
            </div>
            
            <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
              <p>TreeScopeAI v1.0.0</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SideDrawer; 