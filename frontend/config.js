// Expose API base URL as a global for plain script usage across pages
(function() {
  // Check if already defined
  if (window.API_BASE_URL) {
    console.log('API_BASE_URL already defined:', window.API_BASE_URL);
    return;
  }

  // Allow manual override via localStorage for flexibility
  const storedOverride = localStorage.getItem('API_BASE_URL_OVERRIDE');
  if (storedOverride) {
    window.API_BASE_URL = storedOverride;
    console.log('Using API_BASE_URL from localStorage:', window.API_BASE_URL);
    return;
  }

  // Determine environment
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  const isLocalHost = ['localhost', '127.0.0.1', ''].includes(hostname);
  const isFileProtocol = protocol === 'file:';
  const isLiveServer = isLocalHost && (port === '5500' || port === '3000');

  if (isLocalHost || isFileProtocol || isLiveServer) {
    // Local development
    window.API_BASE_URL = 'http://localhost:5000';
  } else {
    // Production (Vercel)
    // Vercel injects env vars via process.env during build
    // Use window._env_ if using an env injection library, else hardcode your deployed backend URL
    window.API_BASE_URL = window._env_?.API_BASE_URL || 'https://mealmender-backend.vercel.app';
  }

  console.log('API_BASE_URL configured:', window.API_BASE_URL);
})();

// Fallback check - if still undefined after 100ms, set default
setTimeout(function() {
  if (typeof window.API_BASE_URL === 'undefined' || !window.API_BASE_URL) {
    console.warn('API_BASE_URL was undefined, setting fallback');
    window.API_BASE_URL = 'http://localhost:5000';
  }
}, 100);
