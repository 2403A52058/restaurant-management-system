import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { farmAPI, henAPI, bookingAPI, paymentAPI } from '../../services/api';
import SEOHead from '../../components/SEOHead';
import {
  Building2, PlusCircle, CheckCircle, Clock, AlertCircle, Phone,
  IndianRupee, Key, ShieldCheck, XCircle, Loader2, ArrowRight,
  TrendingUp, Scale, Camera, History, UserCheck, FileText, Send
} from 'lucide-react';

const MAX_HEN_WEIGHT_KG = 2.5;

const FarmOwnerDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // inventory | breeds | requests | earnings | profile
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Farm Data
  const [hens, setHens] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allStandardBreeds, setAllStandardBreeds] = useState([]);
  const [earningsData, setEarningsData] = useState(null);

  // New Farm Registration Form State (if no farm exists)
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmPhone, setNewFarmPhone] = useState(user?.phone || '');
  const [newFarmWhatsapp, setNewFarmWhatsapp] = useState(user?.phone || '');
  const [newFarmAddress, setNewFarmAddress] = useState('');
  const [newFarmVillage, setNewFarmVillage] = useState('');
  const [newFarmDistrict, setNewFarmDistrict] = useState('Warangal');
  const [newFarmState, setNewFarmState] = useState('Telangana');
  const [newFarmLat, setNewFarmLat] = useState('17.9689');
  const [newFarmLon, setNewFarmLon] = useState('79.5941');
  const [newFarmDesc, setNewFarmDesc] = useState('');

  // Add Hen Form State
  const [addHenFarmBreedId, setAddHenFarmBreedId] = useState('');
  const [addHenWeight, setAddHenWeight] = useState('');
  const [addHenPrice, setAddHenPrice] = useState('');
  const [addHenPhoto, setAddHenPhoto] = useState('');
  const [addHenNotes, setAddHenNotes] = useState('');

  // Add Breed Form State
  const [newBreedId, setNewBreedId] = useState('');
  const [newBreedPrice, setNewBreedPrice] = useState('');
  const [newBreedDesc, setNewBreedDesc] = useState('');

  // Quotation Modal State
  const [selectedBookingForQuote, setSelectedBookingForQuote] = useState(null);
  const [assignedHenIds, setAssignedHenIds] = useState([]);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [isNoAdvanceAllowed, setIsNoAdvanceAllowed] = useState(false);

  // Handover OTP Modal State
  const [handoverBooking, setHandoverBooking] = useState(null);
  const [handoverOtpInput, setHandoverOtpInput] = useState('');

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState(user?.name || '');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawAccNo, setWithdrawAccNo] = useState('');
  const [withdrawIFSC, setWithdrawIFSC] = useState('');
  const [withdrawUPI, setWithdrawUPI] = useState('');

  // Price History Modal
  const [priceHistory, setPriceHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const fetchFarmData = async () => {
    setLoading(true);
    try {
      const farmsRes = await farmAPI.getMyFarms();
      const myFarm = farmsRes?.farms?.[0] || null;
      setFarm(myFarm);

      if (myFarm) {
        // Parallel fetches
        const [hensRes, bookingsRes, breedsRes, earningsRes] = await Promise.all([
          henAPI.listHens(myFarm.id),
          bookingAPI.getFarmBookings(myFarm.id),
          farmAPI.getBreeds(),
          paymentAPI.getEarnings(),
        ]);

        setHens(hensRes?.hens || []);
        setBookings(bookingsRes?.bookings || []);
        setAllStandardBreeds(breedsRes?.breeds || []);
        setEarningsData(earningsRes || null);

        if (myFarm.farmBreeds?.length > 0) {
          setAddHenFarmBreedId(myFarm.farmBreeds[0].id);
        }
      } else {
        const breedsRes = await farmAPI.getBreeds();
        setAllStandardBreeds(breedsRes?.breeds || []);
      }
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to load farm profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmData();
  }, []);

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await farmAPI.createFarm({
        farmName: newFarmName,
        phone: newFarmPhone,
        whatsapp: newFarmWhatsapp,
        address: newFarmAddress,
        villageOrTown: newFarmVillage,
        district: newFarmDistrict,
        state: newFarmState,
        latitude: parseFloat(newFarmLat),
        longitude: parseFloat(newFarmLon),
        description: newFarmDesc,
      });

      setFeedbackMsg({
        text: 'Farm profile created! Marked as "Unverified Farm" until Super Admin reviews it.',
        type: 'success',
      });
      await fetchFarmData();
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to create farm.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddHen = async (e) => {
    e.preventDefault();
    const weight = parseFloat(addHenWeight);
    if (isNaN(weight) || weight <= 0) {
      alert('Please enter a valid weight.');
      return;
    }
    if (weight > MAX_HEN_WEIGHT_KG) {
      alert(`STRICT POLICY: Maximum weight per individual hen is ${MAX_HEN_WEIGHT_KG} kg. This hen weighs ${weight} kg.`);
      return;
    }

    setActionLoading(true);
    try {
      await henAPI.addHen({
        farmId: farm.id,
        farmBreedId: parseInt(addHenFarmBreedId),
        actualWeight: weight,
        pricePerKg: addHenPrice ? parseFloat(addHenPrice) : undefined,
        photoUrl: addHenPhoto?.trim(),
        notes: addHenNotes?.trim(),
      });
      setFeedbackMsg({ text: 'Individual hen added to inventory successfully.', type: 'success' });
      setAddHenWeight('');
      setAddHenPhoto('');
      setAddHenNotes('');
      await fetchFarmData();
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to add hen.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddBreed = async (e) => {
    e.preventDefault();
    if (!newBreedId || !newBreedPrice) {
      alert('Select breed and enter price per kg.');
      return;
    }
    setActionLoading(true);
    try {
      await farmAPI.addBreed(farm.id, {
        breedId: parseInt(newBreedId),
        pricePerKg: parseFloat(newBreedPrice),
        description: newBreedDesc?.trim(),
      });
      setFeedbackMsg({ text: 'Breed added to your farm catalog.', type: 'success' });
      setNewBreedPrice('');
      setNewBreedDesc('');
      await fetchFarmData();
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to add breed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePrice = async (farmBreedId, currentPrice) => {
    const newPrice = prompt(`Enter new base price per kg for this breed (Current: ₹${currentPrice}):`);
    if (!newPrice || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) <= 0) return;
    const reason = prompt('Reason for price update (e.g., Seasonal change, festival demand):') || 'Price adjustment';

    setActionLoading(true);
    try {
      await henAPI.updateBreedPrice(farmBreedId, {
        pricePerKg: parseFloat(newPrice),
        reason,
      });
      setFeedbackMsg({ text: 'Breed price updated and recorded in price history.', type: 'success' });
      await fetchFarmData();
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to update price.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewPriceHistory = async (farmBreedId) => {
    try {
      const res = await henAPI.getPriceHistory(farmBreedId);
      setPriceHistory(res?.history || []);
      setShowHistoryModal(true);
    } catch (err) {
      alert('Failed to load price history.');
    }
  };

  const handleSendQuotation = async (e) => {
    e.preventDefault();
    if (!selectedBookingForQuote) return;
    if (assignedHenIds.length !== selectedBookingForQuote.requestedQuantity) {
      alert(`Please select exactly ${selectedBookingForQuote.requestedQuantity} hen(s) as requested by customer.`);
      return;
    }

    setActionLoading(true);
    try {
      await bookingAPI.sendQuotation(selectedBookingForQuote.id, {
        henIds: assignedHenIds,
        notes: quoteNotes,
        isNoAdvanceAllowed,
      });
      setFeedbackMsg({
        text: 'Quotation generated and sent to customer! Assigned hens are now reserved.',
        type: 'success',
      });
      setSelectedBookingForQuote(null);
      setAssignedHenIds([]);
      setQuoteNotes('');
      await fetchFarmData();
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to generate quotation.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitiateHandover = async (bookingId) => {
    setActionLoading(true);
    try {
      const res = await bookingAPI.initiateHandover(bookingId);
      setFeedbackMsg({
        text: res.message || 'Handover OTP has been generated and sent to customer email.',
        type: 'success',
      });
      await fetchFarmData();
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to initiate handover.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyHandoverOTP = async (e) => {
    e.preventDefault();
    if (!handoverBooking || !handoverOtpInput.trim()) return;
    setActionLoading(true);
    try {
      const res = await bookingAPI.verifyHandoverOTP(handoverBooking.id, handoverOtpInput.trim());
      setFeedbackMsg({
        text: res.message || 'Handover verified! Order completed and earnings credited.',
        type: 'success',
      });
      setHandoverBooking(null);
      setHandoverOtpInput('');
      await fetchFarmData();
    } catch (err) {
      alert(err.message || 'Invalid or expired Handover OTP.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Enter a valid withdrawal amount.');
      return;
    }
    const currentBalance = earningsData?.summary?.currentBalance || 0;
    if (amt > currentBalance) {
      alert(`Withdrawal amount (₹${amt}) exceeds your available balance (₹${currentBalance}).`);
      return;
    }

    setActionLoading(true);
    try {
      await paymentAPI.requestWithdrawal({
        farmId: farm.id,
        amount: amt,
        accountHolder: withdrawAccountHolder,
        bankName: withdrawBank,
        accountNumber: withdrawAccNo,
        ifscCode: withdrawIFSC,
        upiId: withdrawUPI,
      });
      setFeedbackMsg({ text: 'Withdrawal request submitted for Admin review.', type: 'success' });
      setWithdrawAmount('');
      await fetchFarmData();
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to request withdrawal.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-10 h-10 text-green-700 animate-spin" />
      </div>
    );
  }

  // If no farm created yet -> show registration form immediately
  if (!farm) {
    return (
      <div className="min-h-screen bg-cream py-8 px-4 sm:px-6 lg:px-8">
        <SEOHead title="Register Your Farm | KodiKart" />
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="text-center mb-6">
            <span className="text-4xl block mb-2">🌾</span>
            <h1 className="text-2xl font-black text-brown">Register Your Hen Farm</h1>
            <p className="text-xs text-gray-500 mt-1">
              List your authentic native female desi hens and sell directly to customers across AP & Telangana.
            </p>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 text-orange-900 rounded-xl text-xs mb-6">
            <strong>Verification Policy:</strong> New farms will be marked as{' '}
            <span className="font-bold underline">Unverified Farm</span> until physically or remotely verified by KodiKart Super Admin.
          </div>

          <form onSubmit={handleCreateFarm} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-brown mb-1">Farm Name *</label>
              <input
                type="text"
                required
                value={newFarmName}
                onChange={(e) => setNewFarmName(e.target.value)}
                placeholder="e.g. Kakatiya Native Desi Farm"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brown mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={newFarmPhone}
                  onChange={(e) => setNewFarmPhone(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brown mb-1">WhatsApp (Optional)</label>
                <input
                  type="tel"
                  value={newFarmWhatsapp}
                  onChange={(e) => setNewFarmWhatsapp(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brown mb-1">Farm Address *</label>
              <input
                type="text"
                required
                value={newFarmAddress}
                onChange={(e) => setNewFarmAddress(e.target.value)}
                placeholder="Survey No, Landmark, Road"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-brown mb-1">Village / Town *</label>
                <input
                  type="text"
                  required
                  value={newFarmVillage}
                  onChange={(e) => setNewFarmVillage(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brown mb-1">District *</label>
                <input
                  type="text"
                  required
                  value={newFarmDistrict}
                  onChange={(e) => setNewFarmDistrict(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brown mb-1">State *</label>
                <select
                  value={newFarmState}
                  onChange={(e) => setNewFarmState(e.target.value)}
                  className="input-field"
                >
                  <option value="Telangana">Telangana</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brown mb-1">GPS Latitude *</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={newFarmLat}
                  onChange={(e) => setNewFarmLat(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brown mb-1">GPS Longitude *</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={newFarmLon}
                  onChange={(e) => setNewFarmLon(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brown mb-1">Description</label>
              <textarea
                rows="3"
                value={newFarmDesc}
                onChange={(e) => setNewFarmDesc(e.target.value)}
                placeholder="Describe your native hens feed, foraging conditions, open-run area..."
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full btn-primary py-3 text-base font-bold shadow-lg mt-4"
            >
              {actionLoading ? 'Creating Profile...' : 'Complete Farm Registration'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Farm Owner Dashboard
  return (
    <div className="min-h-screen bg-cream py-8 px-4 sm:px-6 lg:px-8">
      <SEOHead title={`${farm.farmName} — Farm Owner Dashboard | KodiKart`} />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Farm Header Banner */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏡</span>
              <div>
                <h1 className="text-2xl font-black text-brown">{farm.farmName}</h1>
                <p className="text-xs text-gray-500">
                  {farm.villageOrTown}, {farm.district}, {farm.state} • GPS: ({farm.latitude}, {farm.longitude})
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {farm.isVerified ? (
              <span className="badge-verified text-sm px-3 py-1">
                <CheckCircle className="w-4 h-4" /> Verified Farm
              </span>
            ) : (
              <span className="badge-unverified text-sm px-3 py-1">
                <XCircle className="w-4 h-4" /> Unverified Farm
              </span>
            )}
            <Link
              to={`/farms/${farm.slug}`}
              className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <span>View Public Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg.text && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center justify-between ${
              feedbackMsg.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-green-50 text-green-800 border border-green-200'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button
              onClick={() => setFeedbackMsg({ text: '', type: '' })}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card text-center">
            <span className="text-xs text-gray-500 uppercase font-semibold">Available Hens</span>
            <p className="text-2xl font-black text-green-700 mt-1">
              {hens.filter((h) => h.status === 'AVAILABLE').length}
            </p>
          </div>
          <div className="card text-center">
            <span className="text-xs text-gray-500 uppercase font-semibold">Active Bookings</span>
            <p className="text-2xl font-black text-blue-700 mt-1">
              {bookings.filter((b) => !['COMPLETED', 'CANCELLED', 'QUOTE_REJECTED'].includes(b.status)).length}
            </p>
          </div>
          <div className="card text-center">
            <span className="text-xs text-gray-500 uppercase font-semibold">Current Balance</span>
            <p className="text-2xl font-black text-gold mt-1">
              ₹{earningsData?.summary?.currentBalance || 0}
            </p>
          </div>
          <div className="card text-center">
            <span className="text-xs text-gray-500 uppercase font-semibold">Total Earned</span>
            <p className="text-2xl font-black text-brown mt-1">
              ₹{earningsData?.summary?.totalEarned || 0}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-6 overflow-x-auto pb-1 text-sm font-bold">
          {[
            { id: 'inventory', label: `Hen Inventory (${hens.length})`, icon: Scale },
            { id: 'requests', label: `Booking Requests (${bookings.length})`, icon: FileText },
            { id: 'breeds', label: 'Breeds & Seasonal Pricing', icon: TrendingUp },
            { id: 'earnings', label: 'Earnings & Withdrawals', icon: IndianRupee },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-700 text-green-700 font-extrabold'
                    : 'border-transparent text-gray-500 hover:text-brown'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: HEN INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Add Hen Form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-brown text-base mb-1 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-green-700" />
                Add Individual Live Hen
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Strict Rule: Female native hens only. Maximum allowed weight is strictly <strong>2.5 kg</strong>.
              </p>

              <form onSubmit={handleAddHen} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-brown mb-1">Breed *</label>
                  <select
                    value={addHenFarmBreedId}
                    onChange={(e) => setAddHenFarmBreedId(e.target.value)}
                    required
                    className="input-field"
                  >
                    {farm.farmBreeds?.map((fb) => (
                      <option key={fb.id} value={fb.id}>
                        {fb.customBreedName || fb.breed?.name} (₹{fb.pricePerKg}/kg)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-brown mb-1">Actual Weight (kg) * (Max 2.5)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="2.5"
                    required
                    placeholder="e.g. 1.85"
                    value={addHenWeight}
                    onChange={(e) => setAddHenWeight(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block font-bold text-brown mb-1">Photo URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={addHenPhoto}
                    onChange={(e) => setAddHenPhoto(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block font-bold text-brown mb-1">Hen Notes</label>
                  <input
                    type="text"
                    placeholder="Health notes, plumage color..."
                    value={addHenNotes}
                    onChange={(e) => setAddHenNotes(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="sm:col-span-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading || !farm.farmBreeds?.length}
                    className="btn-primary py-2 px-6 text-sm"
                  >
                    {actionLoading ? 'Saving...' : 'Add Hen to Inventory'}
                  </button>
                </div>
              </form>
            </div>

            {/* Hen Inventory List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-brown text-sm">Individual Hen Records</h3>
                <span className="text-xs text-gray-500">
                  {hens.filter((h) => h.status === 'AVAILABLE').length} Available • {hens.filter((h) => h.status === 'RESERVED').length} Reserved • {hens.filter((h) => h.status === 'SOLD').length} Sold
                </span>
              </div>

              {hens.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No hens in inventory. Add your first hen above!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cream text-brown font-bold border-b border-gray-100">
                      <tr>
                        <th className="p-3">Hen ID</th>
                        <th className="p-3">Breed</th>
                        <th className="p-3">Weight</th>
                        <th className="p-3">Price/kg</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Added Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {hens.map((hen) => (
                        <tr key={hen.id} className="hover:bg-gray-50">
                          <td className="p-3 font-mono font-bold text-green-800">{hen.henId}</td>
                          <td className="p-3">{hen.breed?.name}</td>
                          <td className="p-3 font-semibold">{hen.actualWeight} kg</td>
                          <td className="p-3">₹{hen.pricePerKg}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                hen.status === 'AVAILABLE'
                                  ? 'bg-green-100 text-green-800'
                                  : hen.status === 'RESERVED'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {hen.status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400">
                            {new Date(hen.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BOOKING REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100 text-xs text-gray-500">
                No booking requests received yet.
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-gray-100 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-green-800">
                          {booking.bookingNumber}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Customer: <strong>{booking.customer?.name}</strong> • Phone: +91 {booking.customer?.phone} • Email: {booking.customer?.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Step A: If REQUESTED -> Create Quotation */}
                      {booking.status === 'REQUESTED' && (
                        <button
                          onClick={() => {
                            setSelectedBookingForQuote(booking);
                            setAssignedHenIds([]);
                          }}
                          className="btn-primary text-xs py-2 px-4 shadow-sm"
                        >
                          Assign Hens & Send Quotation
                        </button>
                      )}

                      {/* Step B: If CONFIRMED -> Initiate Handover */}
                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleInitiateHandover(booking.id)}
                          disabled={actionLoading}
                          className="btn-secondary text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Initiate Handover (Send OTP to Customer)</span>
                        </button>
                      )}

                      {/* Step C: If READY_FOR_HANDOVER -> Enter Customer OTP */}
                      {booking.status === 'READY_FOR_HANDOVER' && (
                        <button
                          onClick={() => {
                            setHandoverBooking(booking);
                            setHandoverOtpInput('');
                          }}
                          className="btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Enter Customer Handover OTP</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 block">Requested Breed:</span>
                      <strong className="text-brown">{booking.breed?.name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Requested Quantity:</span>
                      <strong className="text-brown">{booking.requestedQuantity} Hen(s) (~{booking.desiredWeightKg} kg)</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Delivery:</span>
                      <strong className="text-brown capitalize">{booking.deliveryType}</strong>
                      {booking.deliveryAddress && (
                        <p className="text-[11px] text-gray-500 truncate">{booking.deliveryAddress}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500 block">Quotation Total:</span>
                      <strong className="text-green-700 font-bold">
                        {parseFloat(booking.finalTotalAmount) > 0 ? `₹${booking.finalTotalAmount}` : 'Not yet calculated'}
                      </strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: BREEDS & SEASONAL PRICING */}
        {activeTab === 'breeds' && (
          <div className="space-y-6">
            {/* Add Breed to Farm */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-brown text-base mb-3 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-green-700" />
                Add Native Breed to Your Farm
              </h3>
              <form onSubmit={handleAddBreed} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-brown mb-1">Select Breed *</label>
                  <select
                    value={newBreedId}
                    onChange={(e) => setNewBreedId(e.target.value)}
                    required
                    className="input-field"
                  >
                    <option value="">-- Choose Standard Breed --</option>
                    {allStandardBreeds.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.teluguName || ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-brown mb-1">Your Base Price (₹/kg) *</label>
                  <input
                    type="number"
                    min="100"
                    step="5"
                    required
                    placeholder="e.g. 520"
                    value={newBreedPrice}
                    onChange={(e) => setNewBreedPrice(e.target.value)}
                    className="input-field"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Customer sees base + 3% commission
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-brown mb-1">Description / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Pure bloodline, free-range feed"
                    value={newBreedDesc}
                    onChange={(e) => setNewBreedDesc(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <button type="submit" disabled={actionLoading} className="btn-primary py-2 px-6 text-sm">
                    {actionLoading ? 'Adding...' : 'Add Breed to Farm'}
                  </button>
                </div>
              </form>
            </div>

            {/* Farm Breeds List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {farm.farmBreeds?.map((fb) => (
                <div key={fb.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-brown text-base">
                        {fb.customBreedName || fb.breed?.name}
                      </h4>
                      {fb.breed?.teluguName && (
                        <p className="text-xs text-green-700 font-semibold">{fb.breed.teluguName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-green-800">₹{fb.pricePerKg}</span>
                      <span className="text-xs text-gray-400 block font-normal">per kg base</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2">
                    {fb.description || fb.breed?.description}
                  </p>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleUpdatePrice(fb.id, fb.pricePerKg)}
                      className="btn-outline text-xs py-1.5 px-3 flex-1"
                    >
                      Update Price
                    </button>
                    <button
                      onClick={() => handleViewPriceHistory(fb.id)}
                      className="text-xs bg-gray-100 text-brown px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 hover:bg-gray-200"
                    >
                      <History className="w-3.5 h-3.5" /> History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EARNINGS & WITHDRAWALS */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Earnings Ledger Summary */}
              <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-brown text-base">Earnings Ledger</h3>
                <p className="text-xs text-gray-500">
                  Every completed booking automatically credits 100% of your farm base amount. Zero hidden deductions.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cream text-brown font-bold border-b border-gray-100">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5">Balance</th>
                        <th className="p-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {earningsData?.ledger?.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-4 text-center text-gray-400">
                            No ledger entries yet. Completed bookings will appear here.
                          </td>
                        </tr>
                      ) : (
                        earningsData?.ledger?.map((e) => (
                          <tr key={e.id}>
                            <td className="p-2.5 text-gray-400">
                              {new Date(e.createdAt).toLocaleDateString('en-IN')}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  e.entryType === 'CREDIT_EARNING'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {e.entryType}
                              </span>
                            </td>
                            <td className="p-2.5 font-bold">
                              {e.entryType === 'CREDIT_EARNING' ? '+' : '-'}₹{e.amount}
                            </td>
                            <td className="p-2.5 font-semibold">₹{e.balanceAfter}</td>
                            <td className="p-2.5 text-gray-500">{e.notes}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Withdrawal Request Box */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-brown text-base">Request Withdrawal</h3>
                <div className="p-3 bg-green-50 rounded-xl text-xs text-green-900">
                  <span>Available Balance:</span>
                  <strong className="block text-xl font-black text-green-800 mt-1">
                    ₹{earningsData?.summary?.currentBalance || 0}
                  </strong>
                </div>

                <form onSubmit={handleRequestWithdrawal} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-brown mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      min="100"
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="e.g. 2000"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-brown mb-1">Account Holder *</label>
                    <input
                      type="text"
                      required
                      value={withdrawAccountHolder}
                      onChange={(e) => setWithdrawAccountHolder(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-brown mb-1">Bank Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="SBI, HDFC, Andhra Bank..."
                      value={withdrawBank}
                      onChange={(e) => setWithdrawBank(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-brown mb-1">Account Number *</label>
                    <input
                      type="password"
                      required
                      value={withdrawAccNo}
                      onChange={(e) => setWithdrawAccNo(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-brown mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="SBIN0001234"
                      value={withdrawIFSC}
                      onChange={(e) => setWithdrawIFSC(e.target.value)}
                      className="input-field uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-brown mb-1">UPI ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="user@upi"
                      value={withdrawUPI}
                      onChange={(e) => setWithdrawUPI(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading || (earningsData?.summary?.currentBalance || 0) <= 0}
                    className="w-full btn-primary py-2.5 text-xs font-bold"
                  >
                    {actionLoading ? 'Submitting...' : 'Request Payout'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* QUOTATION MODAL: Assign individual hens */}
        {selectedBookingForQuote && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex justify-between items-start pb-2 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-brown text-base">
                    Assign Hens for {selectedBookingForQuote.bookingNumber}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Requested: <strong>{selectedBookingForQuote.requestedQuantity}</strong> {selectedBookingForQuote.breed?.name} hens (~{selectedBookingForQuote.desiredWeightKg} kg)
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBookingForQuote(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendQuotation} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-brown mb-1">
                    Select exactly {selectedBookingForQuote.requestedQuantity} available hens:
                  </label>
                  <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {hens
                      .filter((h) => h.status === 'AVAILABLE' && h.breedId === selectedBookingForQuote.breedId)
                      .map((h) => (
                        <label
                          key={h.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={assignedHenIds.includes(h.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (assignedHenIds.length >= selectedBookingForQuote.requestedQuantity) {
                                    alert(`You only need ${selectedBookingForQuote.requestedQuantity} hen(s).`);
                                    return;
                                  }
                                  setAssignedHenIds([...assignedHenIds, h.id]);
                                } else {
                                  setAssignedHenIds(assignedHenIds.filter((id) => id !== h.id));
                                }
                              }}
                            />
                            <span className="font-mono font-bold text-green-800">{h.henId}</span>
                          </div>
                          <span><strong>{h.actualWeight} kg</strong> @ ₹{h.pricePerKg}/kg</span>
                        </label>
                      ))}
                  </div>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Selected: {assignedHenIds.length} of {selectedBookingForQuote.requestedQuantity}
                  </span>
                </div>

                <div className="p-3 bg-cream rounded-xl border border-gold/30">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNoAdvanceAllowed}
                      onChange={(e) => setIsNoAdvanceAllowed(e.target.checked)}
                    />
                    <strong className="text-xs text-brown">
                      Trusted Customer: Confirm booking without requiring 20% advance
                    </strong>
                  </label>
                  <p className="text-[10px] text-gray-500 ml-5 mt-0.5">
                    Order will be marked "Confirmed – No Advance". 100% payment collected at physical handover.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-brown mb-1">Quotation Notes for Customer</label>
                  <textarea
                    rows="2"
                    placeholder="Weighed today morning, active and healthy..."
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading || assignedHenIds.length !== selectedBookingForQuote.requestedQuantity}
                    className="btn-primary flex-1 py-2.5 text-sm"
                  >
                    {actionLoading ? 'Sending...' : 'Send Final Quotation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForQuote(null)}
                    className="btn-outline py-2.5 text-sm px-4"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* HANDOVER OTP VERIFICATION MODAL */}
        {handoverBooking && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-green-800 font-bold text-lg">
                <Key className="w-6 h-6 text-green-700" />
                <h3>Verify Customer Handover OTP</h3>
              </div>

              <div className="p-4 bg-green-50 rounded-xl text-xs space-y-1 text-green-950">
                <p>Booking: <strong>{handoverBooking.bookingNumber}</strong></p>
                <p>Customer: <strong>{handoverBooking.customer?.name}</strong></p>
                <p>Hens: <strong>{handoverBooking.requestedQuantity} live hens</strong></p>
                <p className="text-gray-500 pt-1">
                  Ask the customer to share the 6-digit OTP received on their email.
                </p>
              </div>

              <form onSubmit={handleVerifyHandoverOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brown mb-1">
                    Enter 6-Digit Handover OTP *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={handoverOtpInput}
                    onChange={(e) => setHandoverOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="input-field text-center text-2xl font-mono tracking-widest font-black"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={actionLoading || handoverOtpInput.length !== 6}
                    className="btn-primary flex-1 py-2.5 text-sm"
                  >
                    {actionLoading ? 'Verifying...' : 'Verify OTP & Complete Handover'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHandoverBooking(null)}
                    className="btn-outline py-2.5 text-sm px-4"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRICE HISTORY MODAL */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-3">
              <h3 className="font-bold text-brown text-base flex items-center gap-2">
                <History className="w-5 h-5 text-gold" />
                Seasonal Price History
              </h3>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 text-xs">
                {priceHistory.length === 0 ? (
                  <p className="text-gray-400 py-4 text-center">No price updates recorded yet.</p>
                ) : (
                  priceHistory.map((h) => (
                    <div key={h.id} className="py-2 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-brown">{h.reason || 'Price Update'}</span>
                        <span className="text-[10px] text-gray-400 block">
                          {new Date(h.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 line-through">₹{h.oldPrice}</span>
                        <strong className="text-green-700 ml-2">₹{h.newPrice}/kg</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-full btn-outline py-2 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmOwnerDashboard;
