import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('kk_token'));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('kk_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    try {
      const data = await authAPI.me();
      setUser(data.user || data);
    } catch {
      localStorage.removeItem('kk_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const requestOTP = async (phone, email, name, role) => {
    const data = await authAPI.requestOTP(phone, email, name, role);
    return data;
  };

  const verifyOTP = async (phone, email, otp) => {
    const data = await authAPI.verifyOTP(phone, email, otp);
    if (data.token) {
      localStorage.setItem('kk_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('kk_token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) return roles.includes(user.role);
    return user.role === roles;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, requestOTP, verifyOTP, logout, hasRole, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
