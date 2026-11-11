import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';
import {
  MapPin, CheckCircle, Scale, IndianRupee, Key, Truck, Store,
  ShieldCheck, ArrowRight
} from 'lucide-react';

const steps = [
  {
    num: '01',
    title: 'Select a Local Farm & Breed',
    desc: 'Browse verified native hen farms across Andhra Pradesh and Telangana. Filter by district, breed (Aseel, Kadaknath, Natti Kodi), and pricing.',
    icon: MapPin,
  },
  {
    num: '02',
    title: 'Request Quantity & Desired Weight',
    desc: 'Specify how many live female hens you want and your target weight. Remember: maximum weight is strictly 2.5 kg per hen.',
    icon: Scale,
  },
  {
    num: '03',
    title: 'Farmer Assigns Individual Hens',
    desc: 'The farmer checks real-time inventory, inspects health, tags specific hens with unique Hen IDs, and weighs each hen accurately.',
    icon: CheckCircle,
  },
  {
    num: '04',
    title: 'Receive & Review Final Quotation',
    desc: 'Your final quotation shows exact individual weights, farm base price, transparent 3% platform commission, and delivery fee. You have 24 hours to Accept or Reject.',
    icon: IndianRupee,
  },
  {
    num: '05',
    title: 'Pay 20% Advance to Confirm',
    desc: 'Once you accept the quotation, lock your reserved hens by paying a 20% advance via UPI. (Trusted repeat customers may be approved with No Advance by the farmer).',
    icon: ShieldCheck,
  },
  {
    num: '06',
    title: 'Safe Handover via Secure OTP',
    desc: 'When your order is ready for pickup or doorstep delivery, KodiKart generates a single-use 6-digit Handover OTP sent directly to your email. Hand over the OTP to receive your hens safely!',
    icon: Key,
  },
];

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-cream py-10 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="How KodiKart Works — Farm-to-Home Live Native Hens"
        description="Learn the 6-step transparent workflow for buying live native desi hens directly from farmers. Handover OTP, 3% commission snapshot, 20% advance."
        canonicalUrl="https://kodikart.pages.dev/how-it-works"
      />

      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center">
          <span className="text-xs bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Transparent Workflow
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-brown mt-2">
            How KodiKart Works
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            మన నాటి కోళ్లు – మన నమ్మకం • Simple, fair, and fraud-proof direct livestock marketplace
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:border-green-200 transition-colors"
              >
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-2xl font-black text-gold">{s.num}</span>
                  <div className="bg-green-50 p-3 rounded-xl text-green-700">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-bold text-brown">{s.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing Transparency Explainer */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gold/40 space-y-4">
          <h3 className="font-bold text-brown text-lg flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-gold" />
            Transparent 3% Platform Commission Explained
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            At KodiKart, farmers set their own base price and receive 100% of their base earnings upon order completion. KodiKart adds a single 3% platform commission to the customer price to maintain the marketplace, zero-cost servers, and security verification.
          </p>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-xs text-green-950 space-y-1 font-mono">
            <p>• Farm Owner Base Price: ₹500/kg</p>
            <p>• Platform Commission (3%): +₹15/kg</p>
            <p>• Customer Price: ₹515/kg</p>
            <p>• For a confirmed 2.0 kg hen: Farm earns ₹1,000 | Platform receives ₹30 | Customer pays ₹1,030</p>
          </div>
          <p className="text-[11px] text-gray-500 italic">
            Zero hidden vendor fees. Separate ledgers guarantee that neither the farmer nor the customer is ever double-charged.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link to="/farms" className="btn-primary py-3.5 px-8 text-base shadow-lg inline-flex items-center gap-2">
            <span>Browse Local Farms Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
