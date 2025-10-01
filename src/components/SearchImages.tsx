'use client';

import { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/solid';
import { SEARCH_RADIUS } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ImageWithReactions } from '@/types';

interface SearchImagesProps {
  onSearch: (latitude: number, longitude: number, radius: number) => Promise<void>;
  results?: ImageWithReactions[];
  isLoading?: boolean;
}

export default function SearchImages({ onSearch, results, isLoading }: SearchImagesProps) {
  const { t } = useLanguage();
  const [radius, setRadius] = useState<number>(SEARCH_RADIUS.DEFAULT);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleCurrentLocation = async () => {
    setIsGettingLocation(true);
    setMessage(null);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      
      await onSearch(position.coords.latitude, position.coords.longitude, radius);
      setMessage({ type: 'success', text: t.search.resultsFound });
    } catch (error) {
      console.error('Error getting location:', error);
      setMessage({ type: 'error', text: t.search.invalidLocation });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Remove manual lat/lng search - only use current location

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{t.search.title}</h2>

        {/* Search Form */}
        <div className="space-y-4">
          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
              message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
              'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.search.radius} ({radius}m)
            </label>
            <input
              type="range"
              min={SEARCH_RADIUS.MIN}
              max={SEARCH_RADIUS.MAX}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{SEARCH_RADIUS.MIN}m</span>
              <span>{SEARCH_RADIUS.MAX}m</span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleCurrentLocation}
              disabled={isGettingLocation || isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              <MapPinIcon className="w-5 h-5" />
              {isGettingLocation || isLoading ? t.common.loading : t.search.currentLocation}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {results.length} {t.search.resultsFound}
          </h3>
          {results.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t.search.noResults}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.description || ''}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  {image.description && (
                    <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                      {image.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

