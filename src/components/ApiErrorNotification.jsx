import React, { useState, useEffect } from 'react';

const ApiErrorNotification = ({ onClose, onRetry }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [dismissCountdown, setDismissCountdown] = useState(null);

  // Auto-dismiss after 10 seconds if user doesn't interact
  useEffect(() => {
    if (isVisible && !dismissCountdown) {
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);
      setDismissCountdown(timer);
      
      return () => {
        if (dismissCountdown) {
          clearTimeout(dismissCountdown);
        }
      };
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };
  
  const handleRetry = () => {
    if (onRetry) onRetry();
    // Don't close the notification yet - wait for retry result
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md animate-fadeIn">
      <div className="mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-yellow-200 dark:border-yellow-800 overflow-hidden">
        <div className="relative p-4">
          <button 
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xl" 
            onClick={handleClose}
          >
            ×
          </button>
          
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3 text-yellow-500 dark:text-yellow-400 text-2xl">
              ⚠️
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Using Offline Mode
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Working with locally stored data. Results will still be accurate.
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 
                        text-white rounded-md text-sm font-medium transition-colors duration-200"
              onClick={handleRetry}
            >
              Reconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiErrorNotification;
