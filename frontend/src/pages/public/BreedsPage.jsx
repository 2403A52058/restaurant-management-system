import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { farmAPI } from '../../services/api';
import SEOHead from '../../components/SEOHead';
import { ArrowRight, ShieldCheck, Scale, Loader2 } from 'lucide-react';

const BreedsPage = () => {
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        const data = await farmAPI.getBreeds();
        setBreeds(data?.breeds || []);
      } catch (err) {
        // Fallback default breeds
        setBreeds([
          {
            id: 1,
            name: 'Aseel',
            teluguName: 'అసీల్ జాతి నాటి కోడి',
            description: 'The legendary warrior breed of Telangana and Coastal Andhra. Renowned for majestic carriage, high natural immunity, lean muscle and rich authentic desi flavor.',
            imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 2,
            name: 'Kadaknath',
            teluguName: 'కడక్‌నాథ్ నల్ల కోడి',
            description: 'Famous melanic pure native breed featuring distinctive black plumage, connective tissue and rich iron-dense nutrition.',
            imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 3,
            name: 'Natti Kodi',
            teluguName: 'సాంప్రదాయ నాటి కోడి',
            description: 'Traditional village country hen. Hardy, active free-range forager with rich broth flavor prized in rural Telugu households.',
            imageUrl: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?auto=format&fit=crop&w=600&q=80',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchBreeds();
  }, []);

  return (
    <div className="min-h-screen bg-cream py-10 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Native Hen Breeds of Telangana & Andhra Pradesh | KodiKart"
        description="Discover pure native desi hen breeds: Aseel, Kadaknath, Natti Kodi, Giriraja. 100% female live hens, max 2.5 kg."
        canonicalUrl="https://kodikart.pages.dev/breeds"
      />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Heritage Poultry
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-brown mt-2">
            Native Desi Hen Breeds
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            మన సాంప్రదాయ నాటి కోళ్లు — Naturally foraged, ethically reared, strictly 100% female live hens under 2.5 kg.
          </p>
        </div>

        {/* Breeds Grid */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-green-700 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {breeds.map((breed) => (
              <div
                key={breed.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="h-44 bg-gradient-to-br from-green-100 to-green-200 relative flex items-center justify-center overflow-hidden">
                  {breed.imageUrl ? (
                    <img
                      src={breed.imageUrl}
                      alt={breed.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">🐓</span>
                  )}
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-green-800 font-bold text-xs px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <Scale className="w-3 h-3 text-gold" /> Max 2.5 kg
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-brown">{breed.name}</h3>
                    {breed.teluguName && (
                      <p className="text-xs font-semibold text-green-700 mt-0.5">{breed.teluguName}</p>
                    )}
                    <p className="text-xs text-gray-600 leading-relaxed mt-2.5">
                      {breed.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <Link
                      to={`/farms?breed=${encodeURIComponent(breed.name)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-800 hover:underline"
                    >
                      <span>Find Farms with {breed.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Guarantee Banner */}
        <div className="bg-white rounded-2xl p-6 border border-gold/30 shadow-sm flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="bg-yellow-50 p-4 rounded-xl text-gold shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-bold text-brown text-base">Strict KodiKart Livestock Standards</h4>
            <p className="text-xs text-gray-600 mt-1">
              Every hen listed on KodiKart is verified as female native Desi poultry. We strictly ban roosters, broiler hybrids, and dressed poultry. All hens are weighed individually before confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreedsPage;
