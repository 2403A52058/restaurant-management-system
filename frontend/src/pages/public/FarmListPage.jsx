import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmAPI } from '../../services/api';
import { Search, Filter, Star, MapPin, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const FarmCard = ({ farm }) => {
  const navigate = useNavigate();
  const minPrice = farm.breeds?.length
    ? Math.min(...farm.breeds.map((b) => b.pricePerKg || 0))
    : null;
  const maxPrice = farm.breeds?.length
    ? Math.max(...farm.breeds.map((b) => b.pricePerKg || 0))
    : null;

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
      onClick={() => navigate(`/farms/${farm.slug}`)}
    >
      <div className="h-32 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
        {farm.photos?.[0] ? (
          <img src={farm.photos[0]} alt={farm.farmName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">🌾</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-brown text-base leading-tight">{farm.farmName}</h3>
          {farm.isVerified ? (
            <span className="badge-verified shrink-0 ml-2">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          ) : (
            <span className="badge-unverified shrink-0 ml-2">
              <XCircle className="w-3 h-3" /> Unverified
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
          <MapPin className="w-3 h-3" />
          <span>{farm.village || farm.district || 'Location not specified'}</span>
          {farm.district && farm.village && <span>• {farm.district}</span>}
        </div>
        {farm.breeds?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {farm.breeds.slice(0, 3).map((b) => (
              <span key={b.id} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                {b.breed?.name || b.name}
              </span>
            ))}
            {farm.breeds.length > 3 && (
              <span className="text-xs text-gray-400">+{farm.breeds.length - 3} more</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-gold fill-gold" />
            <span className="text-sm font-semibold text-brown">{farm.avgRating?.toFixed(1) || '—'}</span>
            {farm.reviewCount > 0 && <span className="text-xs text-gray-400">({farm.reviewCount})</span>}
          </div>
          {minPrice !== null && (
            <span className="text-sm font-semibold text-green-600">
              ₹{minPrice.toLocaleString('en-IN')}
              {maxPrice !== minPrice && ` – ₹${maxPrice.toLocaleString('en-IN')}`}
              <span className="text-xs text-gray-400 font-normal">/kg</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
    <div className="h-32 bg-gray-200" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-full" />
    </div>
  </div>
);

const FarmListPage = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [breed, setBreed] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [breeds, setBreeds] = useState([]);

  const DISTRICTS = [
    'Visakhapatnam', 'Krishna', 'Guntur', 'East Godavari', 'West Godavari',
    'Nellore', 'Kurnool', 'Chittoor', 'Kadapa', 'Anantapur',
    'Hyderabad', 'Rangareddy', 'Medchal', 'Nalgonda', 'Warangal',
    'Karimnagar', 'Nizamabad', 'Khammam', 'Mahbubnagar', 'Sangareddy'
  ];

  useEffect(() => {
    farmAPI.getBreeds().then((data) => setBreeds(data?.breeds || data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchFarms = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 12 };
        if (search) params.search = search;
        if (district) params.district = district;
        if (verifiedOnly) params.verified = true;
        if (breed) params.breed = breed;
        const data = await farmAPI.list(params);
        setFarms(data?.farms || data?.data || []);
        setTotalPages(data?.totalPages || data?.pagination?.totalPages || 1);
      } catch {
        setFarms([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFarms();
  }, [page, search, district, verifiedOnly, breed]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="kk-gradient text-white px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Browse Farms</h1>
          <p className="text-green-100 text-sm">Find verified farms selling native hens near you</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by farm name, district, or village..."
            className="input-field pl-10"
            value={search}
            onChange={handleSearch}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filter Sidebar */}
          <aside className="md:w-64 shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-brown mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-brown mb-1">District</label>
                <select
                  className="input-field"
                  value={district}
                  onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
                >
                  <option value="">All Districts</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-brown mb-1">Breed</label>
                <select
                  className="input-field"
                  value={breed}
                  onChange={(e) => { setBreed(e.target.value); setPage(1); }}
                >
                  <option value="">All Breeds</option>
                  {breeds.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }}
                  className="w-4 h-4 accent-green-500"
                />
                <span className="text-sm font-medium text-brown">Verified Farms Only</span>
              </label>

              {(district || breed || verifiedOnly) && (
                <button
                  onClick={() => { setDistrict(''); setBreed(''); setVerifiedOnly(false); setPage(1); }}
                  className="mt-4 text-sm text-green-600 hover:underline font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </aside>

          {/* Farm Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : farms.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-6xl mb-4 block">🔍</span>
                <h3 className="text-xl font-bold text-brown mb-2">No Farms Found</h3>
                <p className="text-gray-500">Try adjusting your search filters</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Showing {farms.length} farms {search && `for "${search}"`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {farms.map((farm) => <FarmCard key={farm.id} farm={farm} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-outline p-2 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-brown">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="btn-outline p-2 disabled:opacity-40"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmListPage;
