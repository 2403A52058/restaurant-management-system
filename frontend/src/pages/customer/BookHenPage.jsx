import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { farmAPI, bookingAPI } from '../../services/api';
import SEOHead from '../../components/SEOHead';
import {
  ArrowLeft, MapPin, Truck, Store, Calculator, AlertCircle,
  CheckCircle, Loader2, Info, Compass
} from 'lucide-react';

const MAX_HEN_WEIGHT_KG = 2.5;
const COMMISSION_RATE = 0.03; // 3%

const BookHenPage = () => {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [selectedBreedId, setSelectedBreedId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [desiredWeightKg, setDesiredWeightKg] = useState('1.75');
  const [deliveryType, setDeliveryType] = useState('PICKUP'); // PICKUP or DELIVERY
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerLat, setCustomerLat] = useState(null);
  const [customerLon, setCustomerLon] = useState(null);
  const [locating, setLocating] = useState(false);

  // Delivery estimation state
  const [estimating, setEstimating] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login?redirect=/book/' + farmId);
      return;
    }

    const fetchFarm = async () => {
      setLoading(true);
      try {
        const data = await farmAPI.list();
        const found = (data?.farms || []).find((f) => f.id === parseInt(farmId));
        if (found) {
          setFarm(found);
          if (found.farmBreeds?.length > 0) {
            setSelectedBreedId(found.farmBreeds[0].breedId);
          }
        } else {
          setError('Farm not found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load farm details.');
      } finally {
        setLoading(false);
      }
    };
    fetchFarm();
  }, [farmId, token, navigate]);

  // Auto calculate delivery fee when coords or type change
  useEffect(() => {
    if (deliveryType !== 'DELIVERY' || !customerLat || !customerLon || !farm) {
      setDeliveryEstimate(null);
      return;
    }

    const fetchEstimate = async () => {
      setEstimating(true);
      try {
        const res = await farmAPI.getDeliveryEstimate(farm.id, {
          latitude: customerLat,
          longitude: customerLon,
        });
        setDeliveryEstimate(res);
      } catch (err) {
        // Fallback estimate
        setDeliveryEstimate({
          deliverable: true,
          roadDistanceKm: 15,
          deliveryFee: 150,
        });
      } finally {
        setEstimating(false);
      }
    };
    fetchEstimate();
  }, [deliveryType, customerLat, customerLon, farm]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomerLat(pos.coords.latitude);
        setCustomerLon(pos.coords.longitude);
        setLocating(false);
      },
      () => {
        alert('Could not retrieve GPS coordinates. Please enter your address manually.');
        setLocating(false);
      }
    );
  };

  const selectedFarmBreed = farm?.farmBreeds?.find(
    (fb) => fb.breedId === parseInt(selectedBreedId)
  );

  const basePricePerKg = selectedFarmBreed ? parseFloat(selectedFarmBreed.pricePerKg) : 500;
  const customerPricePerKg = Math.round(basePricePerKg * (1 + COMMISSION_RATE));
  const estimatedTotalWeight = parseFloat(desiredWeightKg || 0);
  const estimatedHensAmount = Math.round(estimatedTotalWeight * customerPricePerKg);
  const deliveryFee = deliveryType === 'PICKUP' ? 0 : (deliveryEstimate?.deliveryFee || 0);
  const estimatedTotalAmount = estimatedHensAmount + deliveryFee;
  const estimatedAdvance = Math.round(estimatedTotalAmount * 0.20);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Strict validation
    if (!selectedBreedId) {
      setError('Please select a native breed.');
      return;
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      setError('Quantity must be at least 1.');
      return;
    }
    const weight = parseFloat(desiredWeightKg);
    if (isNaN(weight) || weight <= 0) {
      setError('Please enter a valid desired weight.');
      return;
    }
    const maxTotalAllowed = MAX_HEN_WEIGHT_KG * qty;
    if (weight > maxTotalAllowed) {
      setError(
        `Desired weight exceeds the maximum limit (${MAX_HEN_WEIGHT_KG} kg per hen). Maximum for ${qty} hen(s) is ${maxTotalAllowed.toFixed(2)} kg.`
      );
      return;
    }

    if (deliveryType === 'DELIVERY') {
      if (!deliveryAddress.trim()) {
        setError('Please enter your full delivery address.');
        return;
      }
      if (deliveryEstimate && !deliveryEstimate.deliverable) {
        setError('Selected address is beyond maximum delivery radius. Please choose Farm Pickup.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        farmId: farm.id,
        breedId: parseInt(selectedBreedId),
        requestedQuantity: qty,
        desiredWeightKg: weight.toFixed(2),
        deliveryType,
        deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress.trim() : null,
        deliveryLatitude: customerLat,
        deliveryLongitude: customerLon,
      };

      const res = await bookingAPI.createBooking(payload);
      if (res.success) {
        setSuccessMsg(
          'Booking request submitted successfully! Farm owner will review available hens and send you a final quotation.'
        );
        setTimeout(() => {
          navigate('/customer/dashboard');
        }, 2000);
      } else {
        setError(res.message || 'Failed to submit booking request.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-10 h-10 text-green-700 animate-spin" />
      </div>
    );
  }

  if (error && !farm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4 p-4 text-center">
        <span className="text-5xl">🌾</span>
        <h2 className="text-xl font-bold text-brown">{error}</h2>
        <Link to="/farms" className="btn-primary">Back to Farms</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-8 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title={`Book Live Hens from ${farm?.farmName} | KodiKart`}
        description="Request native desi hens directly from verified farms. 100% female hens, max 2.5 kg."
      />

      <div className="max-w-3xl mx-auto">
        <Link
          to={`/farms/${farm.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {farm.farmName}
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="kk-gradient text-white p-6 sm:p-8">
            <span className="text-xs bg-white bg-opacity-20 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
              Booking Request
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Book Live Desi Hens
            </h1>
            <p className="text-green-100 text-sm mt-1">
              Farm: <strong className="text-white">{farm.farmName}</strong> • {farm.villageOrTown}, {farm.district}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm flex items-start gap-2">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Strict Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-900 flex items-start gap-3">
              <Info className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">Strict KodiKart Quality Guarantee:</strong>
                KodiKart sells ONLY live female native hens. Maximum weight allowed per hen is strictly <strong>2.5 kg</strong>. Roosters, cockerels, and dressed meat are prohibited.
              </div>
            </div>

            {/* Step 1: Select Breed */}
            <div>
              <label className="block text-sm font-bold text-brown mb-2">
                1. Select Native Breed *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {farm.farmBreeds?.map((fb) => (
                  <div
                    key={fb.breedId}
                    onClick={() => setSelectedBreedId(fb.breedId)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedBreedId === fb.breedId
                        ? 'border-green-600 bg-green-50 text-green-900 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm">
                          {fb.customBreedName || fb.breed?.name}
                        </h4>
                        {fb.breed?.teluguName && (
                          <p className="text-xs text-gray-500 font-medium">{fb.breed.teluguName}</p>
                        )}
                      </div>
                      <span className="text-sm font-extrabold text-green-700">
                        ₹{Math.round(parseFloat(fb.pricePerKg) * (1 + COMMISSION_RATE))}/kg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Quantity & Desired Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-brown mb-1.5">
                  2. Number of Hens *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={quantity}
                  onChange={(e) => {
                    const q = parseInt(e.target.value) || 1;
                    setQuantity(q);
                    setDesiredWeightKg((q * 1.75).toFixed(2));
                  }}
                  className="input-field font-semibold"
                  required
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Individual live female hens
                </span>
              </div>

              <div>
                <label className="block text-sm font-bold text-brown mb-1.5">
                  3. Total Desired Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max={MAX_HEN_WEIGHT_KG * parseInt(quantity || 1)}
                  value={desiredWeightKg}
                  onChange={(e) => setDesiredWeightKg(e.target.value)}
                  className="input-field font-semibold"
                  required
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Max {(MAX_HEN_WEIGHT_KG * parseInt(quantity || 1)).toFixed(2)} kg (up to 2.5 kg/hen)
                </span>
              </div>
            </div>

            {/* Step 3: Delivery Method */}
            <div>
              <label className="block text-sm font-bold text-brown mb-2">
                4. Fulfillment Method *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType('PICKUP')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    deliveryType === 'PICKUP'
                      ? 'border-green-600 bg-green-50 text-green-900 shadow-sm'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  <Store className="w-5 h-5 text-green-700 shrink-0" />
                  <div>
                    <strong className="block text-sm font-bold">Farm Pickup (₹0 Free)</strong>
                    <span className="text-xs text-gray-500">Collect directly from the farm</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('DELIVERY')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    deliveryType === 'DELIVERY'
                      ? 'border-green-600 bg-green-50 text-green-900 shadow-sm'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  <Truck className="w-5 h-5 text-green-700 shrink-0" />
                  <div>
                    <strong className="block text-sm font-bold">Doorstep Delivery</strong>
                    <span className="text-xs text-gray-500">Safe live-poultry transport</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Delivery Address if Home Delivery */}
            {deliveryType === 'DELIVERY' && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-brown uppercase">
                    Delivery Address & GPS
                  </label>
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    disabled={locating}
                    className="flex items-center gap-1 text-xs text-green-700 font-semibold hover:underline"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{locating ? 'Detecting GPS...' : 'Use My GPS'}</span>
                  </button>
                </div>

                <textarea
                  rows="3"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter house no, street, landmark, village/town, pincode"
                  className="input-field text-sm"
                  required={deliveryType === 'DELIVERY'}
                />

                {estimating && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Calculating road distance & delivery fee...
                  </p>
                )}

                {deliveryEstimate && (
                  <div className={`p-3 rounded-lg text-xs ${
                    deliveryEstimate.deliverable ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
                  }`}>
                    {deliveryEstimate.deliverable ? (
                      <div className="flex justify-between items-center">
                        <span>Road distance: <strong>{deliveryEstimate.roadDistanceKm} km</strong></span>
                        <span>Delivery Fee: <strong>₹{deliveryEstimate.deliveryFee}</strong></span>
                      </div>
                    ) : (
                      <span>{deliveryEstimate.message}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cost & Quotation Estimate Breakdown */}
            <div className="bg-cream rounded-xl p-5 border border-gold/30 space-y-2">
              <h4 className="font-bold text-sm text-brown flex items-center gap-2">
                <Calculator className="w-4 h-4 text-gold" /> Estimated Quotation Breakdown
              </h4>
              <div className="text-xs space-y-1.5 pt-2 text-brown">
                <div className="flex justify-between">
                  <span>Farm Base Price:</span>
                  <span>₹{basePricePerKg}/kg</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Platform Commission (3% included):</span>
                  <span>+₹{Math.round(basePricePerKg * COMMISSION_RATE)}/kg</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Customer Price:</span>
                  <span>₹{customerPricePerKg}/kg</span>
                </div>
                <div className="flex justify-between border-t border-gold/20 pt-1.5">
                  <span>Estimated Hen Total ({desiredWeightKg} kg):</span>
                  <span>₹{estimatedHensAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee ({deliveryType}):</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-green-800 border-t border-gold/40 pt-2">
                  <span>Estimated Total:</span>
                  <span>₹{estimatedTotalAmount}</span>
                </div>
                <div className="flex justify-between text-xs text-gold-dark font-medium pt-1">
                  <span>20% Advance (payable after quotation accepted):</span>
                  <span>₹{estimatedAdvance}</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 italic pt-2">
                * Note: Final amount will be calculated from the exact weight of individual hens assigned by the farmer. You will review and approve the exact quotation before paying the 20% advance.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2 shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <span>Submit Booking Request</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookHenPage;
