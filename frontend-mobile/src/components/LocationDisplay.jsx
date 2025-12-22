import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import mapsIcon from '../assets/maps.png';
import houseIcon from '../assets/house.png';

const LocationDisplay = ({ location, showAddress = true, compact = false }) => {
  const [address, setAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    if (location && showAddress) {
      fetchAddress(location.latitude, location.longitude);
    }
  }, [location, showAddress]);

  const fetchAddress = async (lat, lng) => {
    setLoadingAddress(true);
    try {
      // Fetch via backend proxy to avoid CORS
      const response = await fetch(
        `/api/location/reverse-geocode?lat=${lat}&lon=${lng}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        setAddress({
          road: addr.road || addr.street || addr.neighbourhood || '',
          village: addr.village || addr.suburb || addr.hamlet || '',
          district: addr.district || addr.city_district || '',
          city: addr.city || addr.town || addr.municipality || addr.county || '',
          province: addr.state || addr.province || '',
          full: data.display_name || ''
        });
      } else {
        // Fallback if no address found
        setAddress({ 
          road: '',
          village: '',
          district: '',
          city: 'Lokasi terdeteksi',
          province: '',
          full: `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        });
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      // Show coordinates as fallback instead of showing error
      setAddress({ 
        road: '',
        village: '',
        district: '',
        city: 'Lokasi terdeteksi',
        province: '',
        full: `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      });
    } finally {
      setLoadingAddress(false);
    }
  };

  if (!location) {
    return (
      <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8">
        <div className="text-center">
          <img src={mapsIcon} alt="Maps" className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm text-gray-500 font-medium">Lokasi belum tersedia</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-start gap-2 mb-2">
          <img src={mapsIcon} alt="Maps" className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Koordinat GPS</p>
            <p className="text-sm font-mono text-gray-900">
              {location.latitude.toFixed(6)}°, {location.longitude.toFixed(6)}°
            </p>
            {location.accuracy && (
              <p className="text-xs text-gray-500 mt-1">
                Akurasi: ±{location.accuracy.toFixed(0)}m
              </p>
            )}
          </div>
        </div>
        {showAddress && address && !address.error && (
          <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
            <img src={houseIcon} alt="Address" className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700">
                {address.road || address.village || 'Alamat tidak tersedia'}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border-2 border-green-200 p-5 shadow-lg">
      {/* Header with GPS Icon */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-green-200">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <img src={mapsIcon} alt="Maps" className="w-7 h-7" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">Lokasi Alamat</h3>
          {location.accuracy && (
            <div className="flex items-center gap-2 mt-1">
              <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                location.accuracy < 20 ? 'bg-green-600 text-white' :
                location.accuracy < 50 ? 'bg-blue-500 text-white' :
                'bg-amber-500 text-white'
              }`}>
                Akurasi ±{location.accuracy.toFixed(0)} meter
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Alamat Lokasi - LANGSUNG TANPA SECTION KOORDINAT */}
      {showAddress && (
        <div>
          {loadingAddress ? (
            <div className="flex items-center gap-2 py-3 px-4 bg-white/50 rounded-xl">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-600">Memuat alamat...</p>
            </div>
          ) : address && !address.error ? (
            <div className="space-y-2">
              {/* Road */}
              {address.road && (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-100">
                  <p className="text-xs text-gray-500 mb-0.5 font-medium">Jalan</p>
                  <p className="text-sm font-bold text-gray-900">{address.road}</p>
                </div>
              )}

              {/* Village / District */}
              {(address.village || address.district) && (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-100">
                  <p className="text-xs text-gray-500 mb-0.5 font-medium">Kelurahan / Kecamatan</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {[address.village, address.district].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* City / Province */}
              {(address.city || address.province) && (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-100">
                  <p className="text-xs text-gray-500 mb-0.5 font-medium">Kota / Provinsi</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {[address.city, address.province].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Alamat tidak dapat dimuat</p>
            </div>
          )}

          {/* View in Google Maps Button */}
          <a
            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full text-center text-sm text-red font-bold py-3 px-4 bg-white  bg-opacity:70 rounded-xl transition-all shadow-md hover:shadow-lg mt-3"
          >
            <img src={mapsIcon} alt="Google Maps" className="w-5 h-5" />
            Buka di Google Maps
          </a>
        </div>
      )}
    </div>
  );
};

export default LocationDisplay;