/**
 * Global fetch interceptor to inject the JWT token into all /api requests.
 * Since @workspace/api-client-react relies on a central custom-fetch that 
 * doesn't automatically read from localStorage, we intercept at the lowest level.
 */
export function setupFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    let [resource, config] = args;

    if (typeof resource === 'string' && resource.startsWith('/api')) {
      const token = localStorage.getItem('token');
      
      if (token) {
        config = config || {};
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }
    }

    return originalFetch(resource, config);
  };
}
