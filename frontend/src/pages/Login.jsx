import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Lock, Mail, User, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [loginId, setLoginId] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('WAITER');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(loginId, password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword,
          roleName: regRole,
          firstName: regFirstName,
          lastName: regLastName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsRegister(false);
        setLoginId(regUsername);
        setPassword(regPassword);
        setError('Registration successful! Please log in with your credentials.');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Registration error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (userStr, passStr) => {
    setLoginId(userStr);
    setPassword(passStr);
    setError('');
  };

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col lg:flex-row text-cream-100 selection:bg-brand-orange selection:text-white">
      {/* Left Column: Visual Showcase */}
      <div className="lg:w-1/2 relative overflow-hidden hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-black border-r border-charcoal-800">
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1600&q=80"
            alt="Telangana & Hyderabadi Royal Kitchen"
            className="w-full h-full object-cover scale-105 filter blur-[1px]"
          />
        </div>

        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-orange to-brand-gold flex items-center justify-center shadow-xl shadow-brand-orange/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-cream-50 tracking-wide">
              Telangana Ruchulu
            </h1>
            <p className="text-xs text-brand-gold font-medium tracking-widest uppercase">
              Kakatiya Kitchen & Royal Biryanis
            </p>
          </div>
        </div>

        <div className="relative z-10 my-auto space-y-6 max-w-lg">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-orange/15 text-brand-orange text-xs font-semibold border border-brand-orange/30">
            Academic Project • Software Engineering & System Design
          </span>
          <h2 className="text-4xl font-serif font-bold text-cream-50 leading-tight">
            Comprehensive Full-Stack Restaurant Operating System.
          </h2>
          <p className="text-sm text-cream-300/80 leading-relaxed font-normal">
            Streamlining table reservations, real-time kitchen display, multi-tier orders, point-of-sale invoicing, inventory supply tracking, and data-driven executive reporting.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-charcoal-800 text-center">
            <div className="p-3 rounded-xl bg-charcoal-900/80 border border-charcoal-800">
              <p className="text-xl font-bold font-serif text-brand-gold">15</p>
              <p className="text-[11px] text-cream-400">MySQL Tables</p>
            </div>
            <div className="p-3 rounded-xl bg-charcoal-900/80 border border-charcoal-800">
              <p className="text-xl font-bold font-serif text-brand-orange">13</p>
              <p className="text-[11px] text-cream-400">System Modules</p>
            </div>
            <div className="p-3 rounded-xl bg-charcoal-900/80 border border-charcoal-800">
              <p className="text-xl font-bold font-serif text-emerald-400">100%</p>
              <p className="text-[11px] text-cream-400">Live DB Powered</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-cream-400/60">
          Powered by React 18, Vite, Express, Prisma ORM, MySQL & Tailwind CSS.
        </div>
      </div>

      {/* Right Column: Auth Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-orange to-brand-gold flex items-center justify-center shadow-xl shadow-brand-orange/30 mx-auto">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-serif font-bold text-2xl text-cream-50">
              Telangana Ruchulu
            </h1>
            <p className="text-xs text-cream-400 uppercase tracking-wider">
              Restaurant Management System
            </p>
          </div>

          <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40">
            <div className="mb-6">
              <h3 className="text-xl font-serif font-bold text-cream-50">
                {isRegister ? 'Staff Registration' : 'Welcome Back'}
              </h3>
              <p className="text-xs text-cream-400 mt-1">
                {isRegister
                  ? 'Create a new staff member account'
                  : 'Enter your credentials to access the management portal'}
              </p>
            </div>

            {error && (
              <div className="p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {error}
              </div>
            )}

            {!isRegister ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-cream-300 uppercase tracking-wider mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-cream-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder="e.g. admin or admin@lepetitgourmet.com"
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-cream-100 placeholder-cream-400/40 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cream-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-cream-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-cream-100 placeholder-cream-400/40 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-cream-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-orange-dark to-brand-orange hover:from-brand-orange hover:to-brand-orange-light text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-orange/25 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <span className="animate-pulse">Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-cream-300 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-cream-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-cream-300 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-cream-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-cream-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-cream-300 mb-1">Assigned Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="CHEF">CHEF</option>
                    <option value="WAITER">WAITER</option>
                    <option value="CASHIER">CASHIER</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all"
                >
                  {loading ? 'Creating account...' : 'Complete Registration'}
                </button>
              </form>
            )}

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="text-xs text-brand-gold hover:underline font-medium"
              >
                {isRegister
                  ? 'Already have an account? Sign In'
                  : 'Need to register a new employee? Click here'}
              </button>
            </div>
          </div>

          {/* Quick Demo Logins for Examiner & Evaluation */}
          <div className="p-4 rounded-2xl bg-charcoal-900/60 border border-charcoal-800/80">
            <p className="text-[11px] font-bold text-cream-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
              <span>Quick Role Demo Logins</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin', 'admin123')}
                className="p-2 rounded-xl bg-charcoal-800 hover:bg-brand-orange/20 hover:border-brand-orange/40 border border-charcoal-700/60 text-left transition-all group"
              >
                <p className="text-xs font-bold text-cream-100 group-hover:text-brand-orange">Admin</p>
                <p className="text-[10px] text-cream-400/80">admin / admin123</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('manager_srinivas', 'manager123')}
                className="p-2 rounded-xl bg-charcoal-800 hover:bg-brand-gold/20 hover:border-brand-gold/40 border border-charcoal-700/60 text-left transition-all group"
              >
                <p className="text-xs font-bold text-cream-100 group-hover:text-brand-gold">Manager</p>
                <p className="text-[10px] text-cream-400/80">manager / manager123</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('chef_mallesh', 'chef123')}
                className="p-2 rounded-xl bg-charcoal-800 hover:bg-red-500/20 hover:border-red-500/40 border border-charcoal-700/60 text-left transition-all group"
              >
                <p className="text-xs font-bold text-cream-100 group-hover:text-red-400">Chef</p>
                <p className="text-[10px] text-cream-400/80">chef / chef123</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('waiter_shiva', 'waiter123')}
                className="p-2 rounded-xl bg-charcoal-800 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-charcoal-700/60 text-left transition-all group"
              >
                <p className="text-xs font-bold text-cream-100 group-hover:text-emerald-400">Waiter</p>
                <p className="text-[10px] text-cream-400/80">waiter / waiter123</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('cashier_ramya', 'cashier123')}
                className="p-2 rounded-xl bg-charcoal-800 hover:bg-blue-500/20 hover:border-blue-500/40 border border-charcoal-700/60 text-left transition-all group col-span-2 sm:col-span-1"
              >
                <p className="text-xs font-bold text-cream-100 group-hover:text-blue-400">Cashier</p>
                <p className="text-[10px] text-cream-400/80">cashier / cashier123</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
