import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Leaf, Clock, Star, IndianRupee } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🐓</span>
            <span className="text-xl font-bold text-green-500">KodiKart</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/farms" className="text-brown hover:text-green-600 font-medium text-sm hidden sm:block">
              Browse Farms
            </Link>
            <Link to="/login" className="btn-primary text-sm px-4 py-2">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="kk-gradient text-white py-16 px-4 sm:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <span>🌾</span>
            <span>Farm-to-Home Native Hens</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight text-shadow">
            KodiKart
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-green-100 mb-2">
            Live Native Hens. Direct from Farms.
          </p>
          <p className="text-lg text-green-200 mb-10 font-medium">
            మన నాటి కోళ్లు – మన నమ్మకం
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/farms"
              className="inline-flex items-center justify-center gap-2 bg-gold text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-gold-dark transition-colors shadow-lg"
            >
              Browse Farms <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-green-700 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-green-50 transition-colors shadow-lg"
            >
              Get Started
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-green-100">
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Verified Farms</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" /> Quality Assured</span>
            <span className="flex items-center gap-1"><IndianRupee className="w-4 h-4" /> Transparent Pricing</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-brown text-center mb-3">Why Choose KodiKart?</h2>
          <p className="text-gray-500 text-center mb-12">The most trusted marketplace for native country hens</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: <Leaf className="w-8 h-8 text-green-500" />,
                bg: 'bg-green-50',
                title: 'Fresh from Farm',
                desc: 'Directly sourced from verified farms across Andhra Pradesh and Telangana. No middlemen, no cold storage.'
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-gold" />,
                bg: 'bg-yellow-50',
                title: 'Verified Farms',
                desc: 'Every farm is manually verified by our team. We check hygiene, breed authenticity, and ethical practices.'
              },
              {
                icon: <Truck className="w-8 h-8 text-brown" />,
                bg: 'bg-orange-50',
                title: 'Secure Handover',
                desc: 'OTP-based handover system ensures safe and confirmed delivery. Your advance is protected until handover.'
              }
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className={`${f.bg} rounded-xl w-14 h-14 flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-brown mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-cream">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-brown text-center mb-3">How It Works</h2>
          <p className="text-gray-500 text-center mb-12">Simple 4-step process to get fresh native hens</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { step: '1', emoji: '🔍', title: 'Browse Farms', desc: 'Search farms by location, breed, or price' },
              { step: '2', emoji: '📋', title: 'Book Hens', desc: 'Select breed, quantity, and delivery preference' },
              { step: '3', emoji: '💳', title: 'Pay Advance', desc: '20% advance secures your booking via PhonePe' },
              { step: '4', emoji: '🐓', title: 'Get Hens', desc: 'Collect with OTP handover. Pay remaining on spot' }
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 kk-gradient rounded-2xl flex items-center justify-center text-2xl shadow-md">
                    {s.emoji}
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-gold text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-bold text-brown text-sm mb-1">{s.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 kk-gradient text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Order Fresh Native Hens?</h2>
          <p className="text-green-100 mb-8 text-lg">
            Join thousands of customers who trust KodiKart for authentic country hens
          </p>
          <Link
            to="/farms"
            className="inline-flex items-center gap-2 bg-gold text-white font-bold px-10 py-4 rounded-xl text-lg hover:bg-gold-dark transition-colors shadow-lg"
          >
            Browse Farms Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brown text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🐓</span>
                <span className="text-xl font-bold">KodiKart</span>
              </div>
              <p className="text-green-100 text-sm">
                Live Native Hens. Direct from Farms.<br />
                మన నాటి కోళ్లు – మన నమ్మకం
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-gold">Quick Links</h4>
              <ul className="space-y-2 text-sm text-green-100">
                <li><Link to="/farms" className="hover:text-white">Browse Farms</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-gold">Legal</h4>
              <ul className="space-y-2 text-sm text-green-100">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-brown-light pt-6 text-center text-xs text-green-100">
            © {new Date().getFullYear()} KodiKart. All rights reserved. Made with ❤️ for farmers and food lovers.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
