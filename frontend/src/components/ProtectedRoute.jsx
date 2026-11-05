import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, token, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-orange to-brand-gold flex items-center justify-center shadow-lg shadow-brand-orange/30 animate-pulse">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs font-semibold text-cream-300 tracking-wider uppercase animate-pulse">
          Loading Restaurant System...
        </p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="p-8 text-center bg-charcoal-900 border border-charcoal-800 rounded-2xl m-6">
        <h2 className="text-xl font-bold text-red-400">Access Restricted</h2>
        <p className="text-sm text-cream-300 mt-2">
          Your current role (<span className="text-brand-gold font-semibold">{user.role}</span>) does not have permission to access this module.
        </p>
      </div>
    );
  }

  return children;
}
