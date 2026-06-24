import axios from 'axios';

// M6 Fix: export this so AuthContext and other modules can import it without duplication
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const API_URL = API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// In-memory GET cache (TTL: 30s)
const cache = new Map();
const CACHE_TTL = 30000;

// Request interceptor to add token and handle cache
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (config.method === 'get') {
    const key = `${config.url}?${JSON.stringify(config.params || {})}`;
    const cachedEntry = cache.get(key);
    
    // Only return cached response if it's within TTL and we don't have forceRefresh set
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL && !config.forceRefresh) {
      config.adapter = () => Promise.resolve({
        data: cachedEntry.data,
        status: 200,
        statusText: 'OK',
        headers: cachedEntry.headers,
        config,
        request: {}
      });
    }
  }

  return config;
});

// Response interceptor to handle 401s, cache storage, and global error toasts
apiClient.interceptors.response.use(
  (response) => {
    // Cache successful GET requests
    if (response.config.method === 'get') {
      const key = `${response.config.url}?${JSON.stringify(response.config.params || {})}`;
      cache.set(key, {
        data: response.data,
        headers: response.headers,
        timestamp: Date.now()
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Do not intercept or retry if the original request itself was the refresh endpoint
    if (originalRequest?.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token using httpOnly cookie
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        
        if (res.data?.data?.accessToken) {
          setAccessToken(res.data.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        setAccessToken(null);
        // Dispatch event to clear React state globally
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    } else if (error.response && error.response.status >= 400 && !originalRequest?.hideErrorToast) {
      // Global error handler for all non-401 errors, emits event so UIContext can display a toast
      const message = error.response.data?.message || 'An unexpected network error occurred.';
      window.dispatchEvent(new CustomEvent('api:error', { detail: message }));
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
