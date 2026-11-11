import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import {
  Menu, X, Bell, User, LogOut, Download, CheckCircle,
  ShoppingBag, LayoutDashboard, Shield
} from 'lucide-react';

const Header = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Fetch notifications if logged in
  useEffect(() => {
    if (!token) return;
    const fetchNotifications = async () => {
      try {
        const data = await notificationsAPI.getAll();
        const list = data?.notifications || [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.isRead).length);
      } catch (err) {
        // Non-blocking notification error
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000); // 45s poll
    return () => clearInterval(interval);
  }, [token]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'FARM_OWNER') return '/farm-owner/dashboard';
    if (user.role === 'ADMIN') return '/admin';
    return '/customer/dashboard';
  };

  const getDashboardLabel = () => {
    if (!user) return 'Dashboard';
    if (user.role === 'FARM_OWNER') return 'Farm Dashboard';
    if (user.role === 'ADMIN') return 'Super Admin';
    return 'My Bookings';
  };

  const navLinks = [
    { label: 'Browse Farms', path: '/farms' },
    { label: 'Native Breeds', path: '/breeds' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'About', path: '/about' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Top Banner with Telugu Tagline */}
      <div className="bg-green-700 text-white text-xs py-1 px-4 text-center font-medium">
        <span>మన నాటి కోళ్లు – మన నమ్మకం • 100% Live Native Desi Hens • ₹0 Platform Transparency</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-3xl" role="img" aria-label="Hen">🐓</span>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-green-700 tracking-tight leading-none">
                KodiKart
              </span>
              <span className="text-[10px] text-gold font-semibold uppercase tracking-wider mt-0.5">
                Desi Hen Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-green-700 font-bold border-b-2 border-green-700 pb-1'
                    : 'text-brown hover:text-green-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Install App Button if PWA available */}
            {deferredPrompt && (
              <button
                onClick={handleInstallPWA}
                className="flex items-center gap-1.5 text-xs font-semibold bg-gold-light text-brown px-3 py-1.5 rounded-lg hover:bg-gold transition-colors"
                title="Install KodiKart App"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}

            {/* Notification Bell (Logged In) */}
            {token && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-brown hover:bg-cream transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                      <h4 className="font-bold text-sm text-brown">Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-green-700 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-4">No notifications yet</p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            className={`p-2 rounded-lg text-xs ${
                              n.isRead ? 'bg-gray-50 text-gray-600' : 'bg-green-50 text-green-900 font-medium'
                            }`}
                          >
                            <p className="font-semibold">{n.title}</p>
                            <p className="text-[11px] mt-0.5">{n.message}</p>
                            <span className="text-[9px] text-gray-400 block mt-1">
                              {new Date(n.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dashboard & Profile Buttons */}
            {token ? (
              <div className="flex items-center gap-2">
                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-1.5 bg-green-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors shadow-sm"
                >
                  {user?.role === 'FARM_OWNER' ? (
                    <LayoutDashboard className="w-4 h-4" />
                  ) : user?.role === 'ADMIN' ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <ShoppingBag className="w-4 h-4" />
                  )}
                  <span>{getDashboardLabel()}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {token && (
              <Link
                to={getDashboardPath()}
                className="text-xs bg-green-700 text-white px-2.5 py-1.5 rounded-md font-semibold"
              >
                {getDashboardLabel()}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-brown hover:bg-cream"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-brown hover:bg-cream"
            >
              {link.label}
            </Link>
          ))}

          {deferredPrompt && (
            <button
              onClick={() => {
                handleInstallPWA();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-gold text-white px-4 py-2 rounded-lg"
            >
              <Download className="w-4 h-4" />
              <span>Install App on Phone</span>
            </button>
          )}

          <div className="pt-2 border-t border-gray-100">
            {token ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center bg-green-700 text-white font-semibold py-2.5 rounded-lg text-sm"
                >
                  {getDashboardLabel()}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-center text-red-600 font-medium py-2 rounded-lg text-sm hover:bg-red-50"
                >
                  Sign Out ({user?.name || user?.phone})
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center bg-green-700 text-white font-semibold py-2.5 rounded-lg text-sm"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
