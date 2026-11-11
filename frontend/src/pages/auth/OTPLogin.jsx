import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ChevronRight, ArrowLeft, Phone, Mail, User, Building2 } from 'lucide-react';

const OTPLogin = () => {
  const navigate = useNavigate();
  const { requestOTP, verifyOTP, user } = useAuth();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState('CUSTOMER');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);

  const otpRefs = useRef([]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'CUSTOMER') navigate('/customer/dashboard');
      else if (user.role === 'FARM_OWNER') navigate('/farm-owner/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin');
    }
  }, [user, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // OTP expiry countdown
  useEffect(() => {
    if (otpExpiry <= 0) return;
    const timer = setTimeout(() => setOtpExpiry((e) => e - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpExpiry]);

  const validateStep1 = () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile number (starting with 6-9)');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return false;
    }
    if (isNewUser && !name.trim()) {
      setError('Please enter your full name');
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    setError('');
    if (!validateStep1()) return;
    setLoading(true);
    try {
      const data = await requestOTP(phone, email, name || undefined, role);
      if (data?.isNewUser) setIsNewUser(true);
      setStep(2);
      setResendCooldown(60);
      setOtpExpiry(600);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await requestOTP(phone, email, name || undefined, role);
      setResendCooldown(60);
      setOtpExpiry(600);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    const otpStr = otp.join('');
    if (otpStr.length !== 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }
    if (otpExpiry <= 0) {
      setError('OTP has expired. Please request a new one.');
      return;
    }
    setLoading(true);
    try {
      const data = await verifyOTP(phone, email, otpStr);
      const { role: userRole } = data.user;
      if (userRole === 'CUSTOMER') navigate('/customer/dashboard');
      else if (userRole === 'FARM_OWNER') navigate('/farm-owner/dashboard');
      else if (userRole === 'ADMIN') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Header */}
      <div className="kk-gradient px-6 py-8 text-white text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl">🐓</span>
          <h1 className="text-3xl font-bold tracking-tight">KodiKart</h1>
        </div>
        <p className="text-green-100 text-sm font-medium">Live Native Hens. Direct from Farms.</p>
        <p className="text-green-200 text-xs mt-1">మన నాటి కోళ్లు – మన నమ్మకం</p>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4 pt-6 pb-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          {step === 1 ? (
            <>
              <h2 className="text-xl font-bold text-brown mb-1">Sign In / Register</h2>
              <p className="text-gray-500 text-sm mb-6">We'll send an OTP to verify your identity</p>

              {/* Role Selector */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-5">
                <button
                  onClick={() => setRole('CUSTOMER')}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    role === 'CUSTOMER' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🛒 I'm a Customer
                </button>
                <button
                  onClick={() => setRole('FARM_OWNER')}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    role === 'FARM_OWNER' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🌾 I'm a Farm Owner
                </button>
              </div>

              {/* Name field for new users */}
              {isNewUser && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brown mb-1">
                    <User className="inline w-4 h-4 mr-1" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              {/* Phone */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-brown mb-1">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-sm font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    className="input-field rounded-l-none"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-brown mb-1">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">OTP will be sent to this email</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Send OTP <ChevronRight className="w-4 h-4" /></>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 mt-4">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-green-600 hover:underline">Terms</a> &{' '}
                <a href="/privacy" className="text-green-600 hover:underline">Privacy Policy</a>
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep(1); setError(''); setOtp(['', '', '', '', '', '']); }}
                className="flex items-center gap-1 text-green-600 text-sm font-medium mb-4 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Change Details
              </button>

              <h2 className="text-xl font-bold text-brown mb-1">Enter OTP</h2>
              <p className="text-gray-500 text-sm mb-1">
                OTP sent to <span className="font-semibold text-brown">{email}</span>
              </p>
              {otpExpiry > 0 ? (
                <p className="text-xs text-orange-600 font-medium mb-6">
                  Expires in {formatTime(otpExpiry)}
                </p>
              ) : (
                <p className="text-xs text-red-600 font-medium mb-6">OTP expired. Please resend.</p>
              )}

              {/* OTP Input Boxes */}
              <div className="flex gap-2 justify-center mb-6" onPaste={handleOTPPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-brown bg-cream-dark"
                  />
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mb-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify OTP'}
              </button>

              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-gray-500">
                    Resend OTP in <span className="font-semibold text-green-600">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-sm text-green-600 font-semibold hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPLogin;
