import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    restaurantName: 'Telangana Ruchulu — Kakatiya Kitchen',
    tagline: 'Authentic Telangana & Hyderabadi Royal Dastarkhwan',
    currencySymbol: '₹',
    defaultTaxRate: 5.0,
  });

  // Load user profile on mount
  useEffect(() => {
    const initAuth = async () => {
      // Load restaurant settings
      try {
        const res = await api.get('/settings');
        if (res.data?.success && res.data?.data) {
          setSettings(res.data.data);
        }
      } catch (err) {
        console.warn('Could not load settings:', err);
      }

      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Failed to authenticate token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (loginId, password) => {
    const res = await api.post('/auth/login', { login: loginId, password });
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    }
    return { success: false, message: res.data?.message || 'Login failed' };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole, settings, setSettings }}>
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
