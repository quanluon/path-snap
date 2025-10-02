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
      <div className="bg-dark-card rounded-lg shadow-dark-primary p-6 mb-6 border border-dark-primary">
        <h2 className="text-2xl font-bold mb-6 text-dark-primary">{t.search.title}</h2>

        {/* Search Form */}
        <div className="space-y-4">
          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg border ${
              message.type === 'success' ? 'bg-dark-secondary border-dark-primary text-dark-primary' :
              message.type === 'error' ? 'bg-dark-secondary border-dark-primary text-dark-primary' :
              'bg-dark-secondary border-dark-primary text-dark-primary'
            }`}>
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-secondary mb-2">
              {t.search.radius} ({radius}m)
            </label>
            <input
              type="range"
              min={SEARCH_RADIUS.MIN}
              max={SEARCH_RADIUS.MAX}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full accent-dark-primary"
            />
            <div className="flex justify-between text-xs text-dark-muted mt-1">
              <span>{SEARCH_RADIUS.MIN}m</span>
              <span>{SEARCH_RADIUS.MAX}m</span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleCurrentLocation}
              disabled={isGettingLocation || isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-dark-primary text-dark-secondary rounded-lg hover:bg-dark-hover transition-colors disabled:opacity-50 font-medium border border-dark-primary"
            >
              <MapPinIcon className="w-5 h-5" />
              {isGettingLocation || isLoading ? t.common.loading : t.search.currentLocation}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

