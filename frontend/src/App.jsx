import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';

// Public KodiKart Pages
import HomePage from './pages/public/HomePage';
import FarmListPage from './pages/public/FarmListPage';
import FarmDetailPage from './pages/public/FarmDetailPage';
import BreedsPage from './pages/public/BreedsPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import { TermsPage, PrivacyPolicyPage, RefundPolicyPage, DeliveryPolicyPage } from './pages/public/PolicyPages';
import OTPLogin from './pages/auth/OTPLogin';

// Role Dashboards & Booking
import CustomerDashboard from './pages/customer/CustomerDashboard';
import BookHenPage from './pages/customer/BookHenPage';
import FarmOwnerDashboard from './pages/farmOwner/FarmOwnerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-brown">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public Marketplace Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/farms" element={<FarmListPage />} />
            <Route path="/farms/:slug" element={<FarmDetailPage />} />
            <Route path="/breeds" element={<BreedsPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Legal & Compliance Policies */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/delivery-policy" element={<DeliveryPolicyPage />} />

            {/* Authentication */}
            <Route path="/login" element={<OTPLogin />} />

            {/* Customer Routes */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book/:farmId"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <BookHenPage />
                </ProtectedRoute>
              }
            />

            {/* Farm Owner Routes */}
            <Route
              path="/farm-owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={['FARM_OWNER', 'ADMIN']}>
                  <FarmOwnerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Super Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback Redirects */}
            <Route path="/unauthorized" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
