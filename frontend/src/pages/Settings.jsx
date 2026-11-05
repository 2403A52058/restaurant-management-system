import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  DollarSign,
  Percent,
  MapPin,
  Phone,
  Mail,
  Clock,
  Receipt,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { settings, setSettings, hasRole } = useAuth();
  const [formData, setFormData] = useState({
    restaurantName: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    currencySymbol: '$',
    currencyCode: 'USD',
    defaultTaxRate: 5.0,
    openingHours: '',
    invoiceFooter: '',
  });

  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.success && res.data?.data) {
          setFormData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavedSuccess(false);
    try {
      const res = await api.put('/settings', formData);
      if (res.data?.success) {
        setSettings(res.data.data);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update settings');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-cream-400 text-xs">Loading system configurations...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-orange-dark to-brand-gold flex items-center justify-center text-white shadow-lg">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-cream-50">
              Restaurant Profile & System Configurations
            </h1>
            <p className="text-xs text-cream-400 mt-0.5">
              Business branding, localized tax rate policies, currency symbols, and invoice receipts
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Restaurant Identity */}
        <div className="p-6 rounded-2xl bg-charcoal-900 border border-charcoal-800 space-y-4">
          <h2 className="font-serif font-bold text-base text-cream-50 pb-2 border-b border-charcoal-800 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <span>Brand Identity & Contact</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Restaurant Name *</label>
              <input
                type="text"
                required
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Official Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-cream-300 mb-1">Physical Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>
        </div>

        {/* Financial & Tax Configurations */}
        <div className="p-6 rounded-2xl bg-charcoal-900 border border-charcoal-800 space-y-4">
          <h2 className="font-serif font-bold text-base text-cream-50 pb-2 border-b border-charcoal-800 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-brand-orange" />
            <span>Currency & Tax Policies</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                placeholder="e.g. $ or ₹ or € or £"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Currency ISO Code</label>
              <input
                type="text"
                value={formData.currencyCode}
                onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                placeholder="USD, INR, EUR, GBP"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Default Tax / GST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultTaxRate}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours & Bill Footnotes */}
        <div className="p-6 rounded-2xl bg-charcoal-900 border border-charcoal-800 space-y-4">
          <h2 className="font-serif font-bold text-base text-cream-50 pb-2 border-b border-charcoal-800 flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Service Hours & Bill Receipt Footer</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Operating Hours Schedule</label>
              <input
                type="text"
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                placeholder="e.g. 11:00 AM - 11:00 PM (Tue-Sun)"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Invoice Receipt Footer Greeting</label>
              <textarea
                rows={2}
                value={formData.invoiceFooter}
                onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
                placeholder="Thank you for dining with us! We appreciate your patronage."
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>
        </div>

        {hasRole(['ADMIN', 'MANAGER']) && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange-dark to-brand-orange hover:from-brand-orange text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-orange/20 transition-all transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Configurations</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
