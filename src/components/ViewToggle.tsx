"use client";

import { MapIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "@/contexts/LanguageContext";

interface ViewToggleProps {
  currentView: "grid" | "map";
  onViewChange: (view: "grid" | "map") => void;
  className?: string;
}

export default function ViewToggle({ 
  currentView, 
  onViewChange, 
  className = "" 
}: ViewToggleProps) {
  const { t } = useLanguage();

  return (
    <div className={`flex items-center bg-white/10 rounded-lg p-1 ${className}`}>
      <button
        onClick={() => onViewChange("grid")}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
          currentView === "grid"
            ? "bg-white/20 text-white"
            : "text-white/70 hover:text-white hover:bg-white/10"
        }`}
        title={t.search.gridView || "Grid View"}
      >
        <PhotoIcon className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">
          {t.search.gridView || "Grid"}
        </span>
      </button>
      
      <button
        onClick={() => onViewChange("map")}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
          currentView === "map"
            ? "bg-white/20 text-white"
            : "text-white/70 hover:text-white hover:bg-white/10"
        }`}
        title={t.search.mapView || "Map View"}
      >
        <MapIcon className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">
          {t.search.mapView || "Map"}
        </span>
      </button>
    </div>
  );
}
