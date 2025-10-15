// Expose API base URL as a global for plain script usage across pages
// Detect common local dev hosts (localhost, 127.0.0.1, file://, Live Server)
(function() {
  // Check if already defined
  if (window.API_BASE_URL) {
    console.log('API_BASE_URL already defined:', window.API_BASE_URL);
    return;
  }

  const isLocalHost = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  const isFileProtocol = window.location.protocol === 'file:';
  const isLiveServer = isLocalHost && (window.location.port === '5500' || window.location.port === '3000');

  // Allow manual override via localStorage for flexibility
  const storedOverride = localStorage.getItem('API_BASE_URL_OVERRIDE');
  if (storedOverride) {
    window.API_BASE_URL = storedOverride;
    console.log('Using API_BASE_URL from localStorage:', window.API_BASE_URL);
    return;
  }

  if (isLocalHost || isFileProtocol || isLiveServer) {
    window.API_BASE_URL = 'http://localhost:5000';
  } else {
    // TODO: replace with your deployed backend URL when available
    window.API_BASE_URL = 'https://your-backend-url.herokuapp.com';
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
