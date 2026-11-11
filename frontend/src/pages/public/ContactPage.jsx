import React, { useState } from 'react';
import SEOHead from '../../components/SEOHead';
import { Mail, Phone, MapPin, Send, CheckCircle, MessageSquare } from 'lucide-react';

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-cream py-10 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Contact KodiKart Support | Andhra Pradesh & Telangana"
        description="Contact KodiKart support team for farmer registration assistance, customer queries, or poultry welfare guidance."
        canonicalUrl="https://kodikart.pages.dev/contact"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <span className="text-xs bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Help & Inquiries
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-brown mt-2">
            Contact Support
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Questions about farm verification, live hen orders, or farmer onboarding? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Info Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-bold text-brown text-lg">Support Directory</h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="bg-green-50 p-2.5 rounded-lg text-green-700">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-brown text-sm">Helpline (Telugu & English)</strong>
                  <span className="text-gray-500">+91 90000 00000 (Mon–Sat, 8 AM–7 PM IST)</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2.5 rounded-lg text-blue-700">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-brown text-sm">Official Email</strong>
                  <span className="text-gray-500">support@kodikart.in</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-amber-50 p-2.5 rounded-lg text-amber-700">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-brown text-sm">Regional Coverage</strong>
                  <span className="text-gray-500">
                    Telangana & Andhra Pradesh (Warangal, Rajahmundry, Vijayawada, Hyderabad, Guntur, Visakhapatnam)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-xs text-green-950">
              <strong className="block font-bold mb-1">Are you a rural poultry farmer?</strong>
              You can register your farm directly through our app and begin listing inventory with zero platform listing fees!
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <h3 className="text-lg font-bold text-brown">Message Received</h3>
                <p className="text-xs text-gray-500">
                  Thank you! Our regional coordinator will contact you at +91 {phone} shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <h3 className="font-bold text-brown text-base">Send Us a Message</h3>

                <div>
                  <label className="block font-bold text-brown mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block font-bold text-brown mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block font-bold text-brown mb-1">Message / Question *</label>
                  <textarea
                    rows="4"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe how we can assist you..."
                    className="input-field"
                  />
                </div>

                <button type="submit" className="w-full btn-primary py-2.5 text-sm font-bold shadow-md">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
