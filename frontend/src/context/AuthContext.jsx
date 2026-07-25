import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginApi,
  registerApi,
  refreshApi,
  logoutApi,
  setAccessToken,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Silent refresh on app mount to restore session from httpOnly refresh cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await refreshApi();
        if (data.accessToken && data.user) {
          setAccessToken(data.accessToken);
          setUser(data.user);
        }
      } catch (err) {
        // No valid session cookie found; user will remain logged out
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const data = await loginApi({ email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const register = async (email, password, name) => {
    const data = await registerApi({ email, password, name });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
