import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { setAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while initial refresh runs

  // Silent token refresh on app mount
  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const res = await apiClient.post('/auth/refresh');
        if (res.data?.data?.accessToken) {
          setAccessToken(res.data.data.accessToken);
          const { user: refreshedUser } = res.data.data;
          if (refreshedUser) {
            setUser(refreshedUser);
            localStorage.setItem('anicart_user', JSON.stringify(refreshedUser));
          } else {
            // If no user in refresh response, try to restore from localStorage
            const saved = localStorage.getItem('anicart_user');
            if (saved) setUser(JSON.parse(saved));
          }
        }
      } catch {
        // Refresh failed — user is not authenticated
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem('anicart_user');
      } finally {
        setIsLoading(false);
      }
    };
    silentRefresh();
  }, []);

  const login = useCallback((userData, token) => {
    if (token) setAccessToken(token);
    const enriched = { ...userData };
    setUser(enriched);
    localStorage.setItem('anicart_user', JSON.stringify(enriched));
  }, []);

  const logout = useCallback(async () => {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('anicart_user');
    localStorage.removeItem('anicart_cart');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('anicart_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export default AuthContext;
