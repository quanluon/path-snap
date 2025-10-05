"use client";

import { useState } from "react";
import {
  MapPinIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { SEARCH_RADIUS } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ImageWithReactions } from "@/types";

interface SearchImagesProps {
  onSearch: (
    latitude: number,
    longitude: number,
    radius: number
  ) => Promise<void>;
  results?: ImageWithReactions[];
  isLoading?: boolean;
}

export default function SearchImages({
  onSearch,
  isLoading,
}: SearchImagesProps) {
  const { t } = useLanguage();
  const [radius, setRadius] = useState<number>(SEARCH_RADIUS.DEFAULT);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showRangeBar, setShowRangeBar] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const handleSearch = async () => {
    if (!currentLocation) {
      return;
    }

    try {
      await onSearch(
        currentLocation.latitude,
        currentLocation.longitude,
        radius
      );
      // Hide range bar after successful search
      setShowRangeBar(false);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleGetLocationAndSearch = async () => {
    setIsGettingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCurrentLocation(location);

      // Automatically search after getting location
      await onSearch(location.latitude, location.longitude, radius);
      // Hide range bar after successful search
      setShowRangeBar(false);
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const toggleRangeBar = () => {
    setShowRangeBar(!showRangeBar);
  };

  // Remove manual lat/lng search - only use current location

  return (
    <div className="w-full mx-auto">
      <div className="bg-dark-card rounded-lg shadow-dark-primary p-6 border border-dark-primary">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-dark-primary mb-2">
            {t.nav.search}
          </h1>
          <p className="text-dark-secondary">
            {t.search.subtitle}
          </p>
        </div>
        {/* Search Form */}
        <div className="space-y-4">
          {/* Main Action Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleGetLocationAndSearch}
              disabled={isGettingLocation || isLoading}
              className="flex items-center gap-2 px-4 py-3 bg-dark-primary text-dark-secondary rounded-lg hover:bg-dark-hover transition-colors disabled:opacity-50 font-medium border border-dark-primary"
            >
              <MapPinIcon className="w-5 h-5" />
              {isGettingLocation || isLoading
                ? t.common.loading
                : t.search.currentLocation}
            </button>

            {/* Range Toggle Button - Only show when range bar is hidden */}

            <button
              onClick={toggleRangeBar}
              className="flex items-center gap-2 px-4 py-3 bg-dark-secondary text-dark-primary rounded-lg hover:bg-dark-hover transition-colors border border-dark-primary"
              title={t.search.showRangeSettings}
            >
              <AdjustmentsHorizontalIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Range Bar - Conditionally Shown */}
          {showRangeBar && (
            <div className="mt-4 p-4 bg-dark-secondary rounded-lg border border-dark-primary">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-dark-secondary">
                  {t.search.radius} ({radius}m)
                </label>
              </div>
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

              {/* Search Button Below Range */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSearch}
                  disabled={!currentLocation || isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                  {isLoading ? t.common.loading : t.search.search}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
