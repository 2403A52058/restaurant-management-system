import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid3X3,
  CalendarDays,
  ClipboardList,
  ChefHat,
  Receipt,
  Users,
  Briefcase,
  Boxes,
  BarChart3,
  Settings,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Menu Items', href: '/menu', icon: UtensilsCrossed },
  { name: 'Tables', href: '/tables', icon: Grid3X3 },
  { name: 'Reservations', href: '/reservations', icon: CalendarDays },
  { name: 'Orders', href: '/orders', icon: ClipboardList },
  { name: 'Kitchen', href: '/kitchen', icon: ChefHat },
  { name: 'Billing & POS', href: '/billing', icon: Receipt },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Employees', href: '/employees', icon: Briefcase },
  { name: 'Inventory', href: '/inventory', icon: Boxes },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout, settings } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColorMap = {
    ADMIN: 'bg-brand-orange/20 text-brand-orange border-brand-orange/30',
    MANAGER: 'bg-brand-gold/20 text-brand-gold border-brand-gold/30',
    CHEF: 'bg-red-500/20 text-red-400 border-red-500/30',
    WAITER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    CASHIER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-charcoal-900 border-r border-charcoal-800 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-charcoal-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-orange-dark to-brand-gold flex items-center justify-center shadow-lg shadow-brand-orange/20">
            <Sparkles className="w-5 h-5 text-cream-50" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg text-cream-50 tracking-wide leading-tight">
              {settings.restaurantName || 'Telangana Ruchulu'}
            </h1>
            <p className="text-[11px] font-medium text-cream-400/70 tracking-wider uppercase">
              Kakatiya Military Kitchen
            </p>
          </div>
        </div>

        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-cream-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User Badge */}
      <div className="px-5 py-3.5 bg-charcoal-850 border-b border-charcoal-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-charcoal-750 flex items-center justify-center text-xs font-bold text-cream-100 border border-charcoal-700">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-cream-100 truncate">
              {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.username}
            </p>
            <span
              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${
                roleColorMap[user?.role] || 'bg-gray-500/20 text-gray-300'
              }`}
            >
              {user?.role || 'STAFF'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-orange-dark/25 to-brand-orange/10 text-brand-orange font-semibold border-l-4 border-brand-orange'
                    : 'text-cream-300 hover:text-white hover:bg-charcoal-800/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 mr-3 transition-colors ${
                      isActive ? 'text-brand-orange' : 'text-cream-400 group-hover:text-cream-100'
                    }`}
                  />
                  <span>{item.name}</span>
                  {item.name === 'Kitchen' && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-charcoal-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all border border-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen fixed left-0 top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
