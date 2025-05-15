import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './styles/index.css';

// Error handling for the application startup
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application error:", error);
    console.error("Error details:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message || "Unknown error"}</p>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Log environment information
console.log("Application starting...");
console.log("Environment:", {
  isTauri: typeof window !== 'undefined' && !!window.__TAURI_IPC__,
  userAgent: navigator.userAgent
});

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Router>
          <App />
        </Router>
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  console.log("Application rendered successfully");
} catch (error) {
  console.error("Failed to render application:", error);
  
  // Render simple error message if initial render fails
  document.body.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
      <h1>Application Failed to Start</h1>
      <p>${error.message}</p>
      <button onclick="window.location.reload()" style="padding: 8px 16px; margin-top: 20px; cursor: pointer;">
        Reload Application
      </button>
    </div>
  `;
} 