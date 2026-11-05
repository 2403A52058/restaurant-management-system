import React, { useState, useEffect } from 'react';
import { Menu, Bell, Search, Utensils, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Navbar({ setMobileOpen, pageTitle }) {
  const { user, settings } = useAuth();
  const [time, setTime] = useState(new Date());
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchQuickAlerts = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data?.success) {
          const { lowStockCount, activeKitchenOrders, pendingReservations } = res.data.data;
          setAlertCount(lowStockCount + (pendingReservations > 0 ? 1 : 0));
        }
      } catch (err) {
        // silent
      }
    };
    fetchQuickAlerts();
    const interval = setInterval(fetchQuickAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-charcoal-900/90 backdrop-blur-md border-b border-charcoal-800 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left Side: Mobile toggle + Page Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-cream-300 hover:text-white hover:bg-charcoal-800 focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-serif font-bold text-cream-50 capitalize tracking-tight">
              {pageTitle}
            </h2>
            <p className="text-[11px] text-cream-400/80 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-brand-orange" />
              <span>
                {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {time.toLocaleTimeString()}
              </span>
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action & Profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Create Order Button */}
          <Link
            to="/orders"
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-orange-dark to-brand-orange hover:from-brand-orange hover:to-brand-orange-light text-white text-xs font-semibold shadow-md shadow-brand-orange/20 transition-all transform active:scale-95"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>+ New Order</span>
          </Link>

          {/* Quick Alert Bell */}
          <Link
            to="/inventory"
            className="relative p-2 rounded-xl bg-charcoal-800 text-cream-300 hover:text-white hover:bg-charcoal-750 transition-colors"
            title="Low stock / Kitchen alerts"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-orange rounded-full ring-2 ring-charcoal-900 animate-pulse" />
            )}
          </Link>

          {/* User Avatar */}
          <div className="flex items-center space-x-2 pl-2 border-l border-charcoal-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-orange to-brand-gold flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-cream-100 leading-tight">
                {user?.employee ? `${user.employee.firstName}` : user?.username}
              </p>
              <p className="text-[10px] text-brand-gold font-medium uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
