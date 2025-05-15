# TreeScopeAI Web Application Setup

This document explains how to properly set up and run the TreeScopeAI web application to ensure it works correctly with the API.

## Latest Fixes

The web application has been completely revamped to ensure it works properly with the API:

1. **Fixed 405 Method Not Allowed errors** - The application now uses GET requests instead of HEAD for API checks
2. **Added unified API client** - Both desktop and web versions now use the same API client for consistency
3. **Improved CORS handling** - Multiple CORS proxies and fallback mechanisms are now in place
4. **Added Mahogany species data** - Mock data now includes Mahogany (Sweitenia mahogoni) for testing
5. **Better error handling** - The application now gracefully handles API errors and provides useful feedback

## Development Setup

To run the web application in development mode with proper API connectivity:

1. Create a `.env.local` file in the project root with:

```
VITE_API_URL=https://shakirul-sust-treescopy-api.hf.space
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The development server includes a built-in proxy that will handle CORS issues automatically.

## Production Setup

For production deployment, make sure to set the correct API URL:

1. Create a `.env.production` file in the project root:

```
VITE_API_URL=https://shakirul-sust-treescopy-api.hf.space
```

2. Build the application:

```bash
npm run build
```

3. Deploy the contents of the `dist` folder to your web server.

## API Connectivity

The web application now uses multiple strategies to ensure reliable API connectivity:

1. **Development Proxy**: In development mode, all API requests are routed through the Vite development server's proxy to avoid CORS issues.

2. **Unified API Client**: Both desktop and web versions use the same API client, ensuring consistent behavior.

3. **CORS Proxies**: In production, the application tries multiple CORS proxy services if direct API access fails:
   - Direct connection (no proxy)
   - api.allorigins.win
   - corsproxy.io
   - cors-anywhere.herokuapp.com

4. **Fallback Data**: If all API connection attempts fail, the application will use local mock data to ensure a good user experience.

## Troubleshooting

If you experience API connection issues:

1. Check that the API server is running and accessible
2. Verify that your `.env.local` or `.env.production` file has the correct API URL
3. If using a custom API server, ensure it has proper CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

4. Check browser console for specific error messages
5. Try clearing your browser cache and reloading the page

## Testing API Connectivity

To test if the API connection is working:

1. Open the application in your browser
2. Upload an image for analysis
3. Check if you get proper species information rather than "This is a local fallback" messages
4. Verify in the browser console that API requests are successful

## Common Issues and Solutions

### 405 Method Not Allowed
The application now automatically converts HEAD requests to GET requests when 405 errors occur.

### CORS Errors
Multiple CORS proxies are now tried in sequence to ensure at least one works.

### Slow API Response
Timeouts have been increased to 60 seconds for image analysis to accommodate larger images 