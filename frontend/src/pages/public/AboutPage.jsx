import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';
import { ShieldCheck, Heart, Leaf, Users, ArrowRight } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-cream py-10 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="About KodiKart — Empowering Native Poultry Farmers"
        description="Learn about KodiKart's mission: connecting native desi hen farmers in Andhra Pradesh & Telangana directly with conscious consumers. Zero middlemen."
        canonicalUrl="https://kodikart.pages.dev/about"
      />

      <div className="max-w-4xl mx-auto space-y-10">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs bg-gold/20 text-brown font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Our Mission
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-brown mt-2">
            About KodiKart
          </h1>
          <p className="text-sm text-green-700 font-bold mt-1">
            మన నాటి కోళ్లు – మన నమ్మకం (Our Native Hens — Our Trust)
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-gray-100 space-y-5 text-sm text-gray-700 leading-relaxed">
          <h2 className="text-xl font-bold text-brown">Protecting Heritage Native Breeds & Rural Farmers</h2>
          <p>
            Commercial broiler poultry has rapidly overrun the market with artificial growth cycles, chemical antibiotics, and industrial caged farming. In contrast, traditional Telugu rural households have always cherished authentic <strong>Desi Natti Kodi</strong> — hardy native hens naturally raised on open grasslands, millets, insects, and organic farm grains.
          </p>
          <p>
            However, rural farmers have historically been exploited by middlemen who buy live hens at predatory low prices and resell them in urban centers at inflated markups.
          </p>
          <p>
            <strong>KodiKart was founded to eliminate the middlemen.</strong> We empower smallholder poultry farmers across Andhra Pradesh and Telangana to list their live native hens directly, set their own fair prices, and sell directly to consumers who value pure heritage poultry.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="p-4 bg-green-50 rounded-xl">
              <Leaf className="w-6 h-6 text-green-700 mb-2" />
              <h4 className="font-bold text-brown text-sm">100% Free-Range</h4>
              <p className="text-xs text-gray-600 mt-1">Hens raised naturally with open pasture access and traditional grains feed.</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-gold mb-2" />
              <h4 className="font-bold text-brown text-sm">Ethical Standards</h4>
              <p className="text-xs text-gray-600 mt-1">Strictly female native hens only. Maximum weight 2.5 kg enforced.</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl">
              <Users className="w-6 h-6 text-brown mb-2" />
              <h4 className="font-bold text-brown text-sm">Direct Farmer Support</h4>
              <p className="text-xs text-gray-600 mt-1">Farmers keep 100% of their base price with immediate payout visibility.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <Link to="/farms" className="btn-primary py-3 px-8 text-sm shadow-md inline-flex items-center gap-2">
            <span>Explore Local Farms</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
