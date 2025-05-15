import React, { useState, useEffect } from 'react';
import '../styles/ActivationScreen.css';

function ActivationScreen({ onActivate }) {
  const [activationKey, setActivationKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [activationAttempts, setActivationAttempts] = useState(0);
  
  // Sample valid keys for user convenience
  const sampleKeys = [
    "eb9613ca2d9ac438553debfb77426ee8",
    "3eb7c8193d9a65cf5440090763a64ecf",
    "9d5240bb66cba84e5e2a55544c1ba431",
    "3755c9402da1b3525dbb3088dfb08084",
    "1befff97c87c21329365adda93b840a8"
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!activationKey.trim()) {
      setError('Please enter a valid activation key');
      return;
    }
    
    // Add validation for key format (typically 32 hex characters)
    const keyRegex = /^[0-9a-f]{32}$/i;
    if (!keyRegex.test(activationKey.trim()) && !sampleKeys.includes(activationKey.trim())) {
      setError('Invalid key format. Please check your activation key.');
      return;
    }

    setIsActivating(true);
    setError(null);
    
    try {
      const result = await onActivate(activationKey.trim());
      
      if (!result) {
        setActivationAttempts(prev => prev + 1);
        setError('Activation failed. Please verify your key and try again or contact support.');
      }
    } catch (error) {
      console.error('Activation error:', error);
      setActivationAttempts(prev => prev + 1);
      setError(`Activation failed: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsActivating(false);
    }
  };
  
  return (
    <div className="activation-screen">
      <div className="activation-container">
        <div className="logo">
          {!logoError ? (
            <img 
              src="/icon.png" 
              alt="TreeScopeAI Logo" 
              style={{ width: '64px', height: 'auto' }} 
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="logo-placeholder" style={{ width: '64px', height: '64px', backgroundColor: '#2e7d32', borderRadius: '8px' }}></div>
          )}
          <h1 style={{ marginLeft: '10px', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>TreeScopeAI</h1>
        </div>
        
        <div className="activation-form-container">
          <h2>Activate Your Software</h2>
          <p>
            Please enter your activation key to continue. If you don't have a key,
            please contact support.
          </p>
          
          <form onSubmit={handleSubmit} className="activation-form">
            <div className="form-group">
              <label htmlFor="activationKey">Activation Key</label>
              <input
                type="text"
                id="activationKey"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value)}
                placeholder="Enter your activation key"
                disabled={isActivating}
              />
            </div>
            
            {error && (
              <div className="error-message">
                {error}
                {activationAttempts > 2 && (
                  <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
                    <p>For testing, you can use these sample keys:</p>
                    <ul style={{ listStyleType: 'none', padding: '0', margin: '5px 0' }}>
                      {sampleKeys.map((key, index) => (
                        <li key={index} 
                            style={{ cursor: 'pointer', padding: '3px 0', color: '#0066cc' }}
                            onClick={() => setActivationKey(key)}>
                          {key}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <button
              type="submit"
              className="activate-button"
              disabled={isActivating || !activationKey.trim()}
            >
              {isActivating ? 'Activating...' : 'Activate'}
            </button>
          </form>
        </div>
        
        <div className="activation-footer">
          <p>
            &copy; {new Date().getFullYear()} TreeScopeAI. All rights reserved.
          </p>
          <p>
            Need help? Contact{' '}
            <a href="mailto:support@treescopeai.com">support@treescopeai.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ActivationScreen; 