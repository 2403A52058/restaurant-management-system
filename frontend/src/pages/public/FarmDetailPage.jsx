import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { farmAPI } from '../../services/api';
import {
  MapPin, Phone, CheckCircle, XCircle, Star, MessageCircle,
  ArrowLeft, Loader2, ShoppingCart
} from 'lucide-react';

const COMMISSION_RATE = 0.03;

const FarmDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeBreed, setActiveBreed] = useState(0);

  useEffect(() => {
    const fetchFarm = async () => {
      setLoading(true);
      try {
        const data = await farmAPI.getBySlug(slug);
        setFarm(data?.farm || data);
      } catch (err) {
        setError(err.message || 'Farm not found');
      } finally {
        setLoading(false);
      }
    };
    fetchFarm();
  }, [slug]);

  const handleBookNow = () => {
    if (!token) {
      navigate('/login');
    } else {
      navigate(`/book/${farm.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
      </div>
    );
  }

  if (error || !farm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4">
        <span className="text-5xl">🌾</span>
        <h2 className="text-xl font-bold text-brown">{error || 'Farm not found'}</h2>
        <button onClick={() => navigate('/farms')} className="btn-primary">
          Browse Other Farms
        </button>
      </div>
    );
  }

  const breeds = farm.breeds || [];
  const selectedBreed = breeds[activeBreed];
  const hens = selectedBreed?.hens || [];

  return (
    <div className="min-h-screen bg-cream">
      {/* Back button */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <button
          onClick={() => navigate('/farms')}
          className="flex items-center gap-1 text-green-600 font-medium text-sm hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> All Farms
        </button>
      </div>

      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-green-200 to-green-400 flex items-center justify-center">
        {farm.photos?.[0] ? (
          <img src={farm.photos[0]} alt={farm.farmName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl">🌾</span>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="absolute bottom-4 left-4 text-white">
          <h1 className="text-2xl font-bold text-shadow">{farm.farmName}</h1>
          <div className="flex items-center gap-2 mt-1">
            {farm.isVerified ? (
              <span className="badge-verified"><CheckCircle className="w-3 h-3" /> Verified Farm</span>
            ) : (
              <span className="badge-unverified"><XCircle className="w-3 h-3" /> Unverified Farm</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-green-500 shrink-0" />
                <span>{[farm.village, farm.mandal, farm.district, farm.state].filter(Boolean).join(', ')}</span>
              </div>
              {farm.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-green-500 shrink-0" />
                  <a href={`tel:+91${farm.phone}`} className="hover:text-green-600">{farm.phone}</a>
                </div>
              )}
              {farm.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MessageCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <a
                    href={`https://wa.me/91${farm.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-600 hover:underline font-medium"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {farm.avgRating && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= Math.round(farm.avgRating) ? 'text-gold fill-gold' : 'text-gray-200 fill-gray-200'}`}
                    />
                  ))}
                  <span className="text-sm font-semibold text-brown ml-1">{farm.avgRating.toFixed(1)}</span>
                  {farm.reviewCount > 0 && <span className="text-xs text-gray-400">({farm.reviewCount} reviews)</span>}
                </div>
              )}
              {farm.description && <p className="text-sm text-gray-600">{farm.description}</p>}
            </div>
          </div>

          {/* Book Button */}
          {!farm.isVerified && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700 font-medium">
                ⚠️ This farm is pending verification. Bookings may be delayed.
              </p>
            </div>
          )}
          <button
            onClick={handleBookNow}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3"
          >
            <ShoppingCart className="w-5 h-5" />
            Book Hens from This Farm
          </button>
        </div>

        {/* Breeds & Hens */}
        {breeds.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-brown text-lg mb-4">Available Breeds</h2>
            <div className="flex gap-2 flex-wrap mb-4">
              {breeds.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBreed(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    i === activeBreed
                      ? 'bg-green-500 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {b.breed?.name || b.name}
                </button>
              ))}
            </div>

            {selectedBreed && (
              <div>
                <div className="bg-green-50 rounded-lg p-3 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Farm Price</p>
                    <p className="font-bold text-brown">₹{selectedBreed.pricePerKg?.toLocaleString('en-IN')}/kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer Price (incl. 3% platform fee)</p>
                    <p className="font-bold text-green-600">
                      ₹{(selectedBreed.pricePerKg * (1 + COMMISSION_RATE)).toLocaleString('en-IN', {
                        maximumFractionDigits: 2
                      })}/kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Available</p>
                    <p className="font-bold text-brown">{hens.length} hens</p>
                  </div>
                </div>

                {hens.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {hens.slice(0, 6).map((hen) => (
                      <div key={hen.id} className="border border-gray-100 rounded-lg p-3 text-center">
                        <span className="text-2xl block mb-1">🐓</span>
                        <p className="text-xs text-gray-500">ID: {hen.henId}</p>
                        <p className="font-semibold text-brown text-sm">{hen.actualWeight} kg</p>
                        <p className="text-xs text-green-600">
                          ₹{(hen.actualWeight * selectedBreed.pricePerKg * (1 + COMMISSION_RATE)).toLocaleString('en-IN', {
                            maximumFractionDigits: 0
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-4">No hens currently listed for this breed</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        {farm.reviews?.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-brown text-lg mb-4">Customer Reviews</h2>
            <div className="space-y-4">
              {farm.reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      {review.customer?.name?.[0] || 'C'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brown">{review.customer?.name || 'Customer'}</p>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-gold fill-gold' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-gray-600 ml-10">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmDetailPage;
