import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, MapPin, IndianRupee, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-brown-dark text-white pt-12 pb-8 border-t-4 border-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Tagline */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🐓</span>
              <span className="text-2xl font-black text-gold">KodiKart</span>
            </div>
            <p className="text-sm text-cream font-medium">
              Live Native Hens. Direct from Farms.
            </p>
            <p className="text-xs text-green-200 font-semibold italic">
              మన నాటి కోళ్లు – మన నమ్మకం
            </p>
            <p className="text-xs text-gray-300 leading-relaxed pt-2">
              The premier ethical marketplace for buying authentic female native Desi hens directly from verified local farms in Andhra Pradesh & Telangana.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-gold">
              <ShieldCheck className="w-4 h-4 text-gold" />
              <span>Strictly 100% Female Hens (Max 2.5 kg)</span>
            </div>
          </div>

          {/* Col 2: Marketplace Navigation */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gold mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm text-gray-200">
              <li>
                <Link to="/farms" className="hover:text-gold transition-colors">Browse Farms</Link>
              </li>
              <li>
                <Link to="/breeds" className="hover:text-gold transition-colors">Native Hen Breeds</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-gold transition-colors">How Booking Works</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-gold transition-colors">About Our Mission</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-gold transition-colors">Contact Support</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: For Farm Owners & Platform Transparency */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gold mb-3">Farm Owners</h4>
            <ul className="space-y-2 text-sm text-gray-200">
              <li>
                <Link to="/login" className="hover:text-gold transition-colors">Register Your Farm</Link>
              </li>
              <li>
                <Link to="/farm-owner/dashboard" className="hover:text-gold transition-colors">Farm Dashboard</Link>
              </li>
              <li>
                <span className="text-xs text-green-300 bg-green-900 bg-opacity-60 px-2 py-1 rounded inline-block mt-2">
                  3% Transparent Commission
                </span>
              </li>
              <li className="text-xs text-gray-300 pt-1">
                Zero hidden charges. Real-time earnings ledger. Direct bank/UPI withdrawals.
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Policies */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gold mb-3">Policies & Trust</h4>
            <ul className="space-y-2 text-sm text-gray-200">
              <li>
                <Link to="/terms" className="hover:text-gold transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-gold transition-colors">Refund & Cancellation</Link>
              </li>
              <li>
                <Link to="/delivery-policy" className="hover:text-gold transition-colors">Delivery & Pickup Policy</Link>
              </li>
              <li className="pt-2 text-xs text-gray-400">
                Operating in INR (₹) • Timezone: Asia/Kolkata
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} KodiKart. All rights reserved.</span>
            <span>• Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
            <span>for rural Indian poultry farmers.</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span className="bg-gray-800 text-gold px-2.5 py-1 rounded border border-gray-700 font-mono text-[11px]">
              ₹0 Cloud Infrastructure
            </span>
            <span className="text-gray-400">Cloudflare Pages + Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
