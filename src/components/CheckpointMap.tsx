"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MapPinIcon,
  PhotoIcon,
  CalendarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import OptimizedImage from "@/components/OptimizedImage";
import { useLanguage } from "@/contexts/LanguageContext";
import type { images } from "@/db/schema";

// Custom Dot Marker Component (unused but kept for future use)
// const DotMarker = ({ color = '#3B82F6', size = 12 }: { color?: string; size?: number }) => (
//   <div
//     className="rounded-full border-2 border-white shadow-lg"
//     style={{
//       width: size,
//       height: size,
//       backgroundColor: color,
//       transform: 'translate(-50%, -50%)'
//     }}
//   />
// );

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

// Import Leaflet for custom icons
let L: typeof import("leaflet") | null = null;
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  L = require("leaflet");
}

interface CheckpointMapProps {
  images: (typeof images.$inferSelect)[];
  onImageClick?: (image: typeof images.$inferSelect) => void;
  onShowCarousel?: (
    imageList: (typeof images.$inferSelect)[],
    startIndex: number
  ) => void;
  className?: string;
  showLine?: boolean;
  showOrder?: boolean;
}

export default function CheckpointMap({
  images,
  onImageClick,
  onShowCarousel,
  className = "",
  showLine = true,
  showOrder = true,
}: CheckpointMapProps) {
  const { t } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [showMapInfo, setShowMapInfo] = useState(true);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sort images by creation date to establish order
  const sortedImages = [...images].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Group nearby images (within 10 meters)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupNearbyImages = (imageList: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups: { [key: string]: any[] } = {};
    const threshold = 0.0001; // ~10 meters in degrees

    imageList.forEach((image) => {
      const key = `${Math.round(image.latitude / threshold)}_${Math.round(
        image.longitude / threshold
      )}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(image);
    });

    return Object.values(groups);
  };

  // Create offset for overlapping markers
  const getOffsetPosition = (
    baseLat: number,
    baseLng: number,
    index: number,
    total: number
  ) => {
    if (total === 1) return [baseLat, baseLng];

    const offsetDistance = 0.00005; // ~5 meters
    const angle = (2 * Math.PI * index) / total;
    const offsetLat = baseLat + offsetDistance * Math.cos(angle);
    const offsetLng = baseLng + offsetDistance * Math.sin(angle);

    return [offsetLat, offsetLng];
  };

  // Handle marker click to show carousel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMarkerClick = (clickedImage: any) => {
    if (onShowCarousel) {
      // Find the index of the clicked image in the original images array
      const startIndex = images.findIndex((img) => img.id === clickedImage.id);
      onShowCarousel(images, startIndex >= 0 ? startIndex : 0);
    } else if (onImageClick) {
      onImageClick(clickedImage);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank");
  };

  if (!isClient) {
    return (
      <div
        className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}
      >
        <div className="text-gray-500">{t.common.loading}</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}
      >
        <div className="text-center">
          <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t.plan.noImages}</p>
        </div>
      </div>
    );
  }

  // Calculate center point from all images
  const centerLat =
    images.reduce((sum, img) => sum + img.latitude, 0) / images.length;
  const centerLng =
    images.reduce((sum, img) => sum + img.longitude, 0) / images.length;

  return (
    <div className={`relative ${className}`}>
      <div className="h-96 w-full rounded-lg overflow-hidden">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Polyline connecting checkpoints in order */}
          {showLine && sortedImages.length > 1 && (
            <Polyline
              positions={sortedImages.map((img) => [
                img.latitude,
                img.longitude,
              ])}
              color="#3B82F6"
              weight={3}
              opacity={0.8}
              dashArray="5, 10"
            />
          )}

          {groupNearbyImages(images).map((group) =>
            group.map((image, imageIndex) => {
              const [offsetLat, offsetLng] = getOffsetPosition(
                image.latitude,
                image.longitude,
                imageIndex,
                group.length
              );

              // Create custom dot icon with order number
              const createDotIcon = () => {
                if (!L) return undefined;
                const isCluster = group.length > 1;
                const size = isCluster ? 28 : 24;
                const bgColor = isCluster ? "#EF4444" : "#3B82F6";

                // Find the order number for this image in the sorted list
                const orderNumber = showOrder
                  ? sortedImages.findIndex((img) => img.id === image.id) + 1
                  : "";

                return L.divIcon({
                  className: "custom-dot-marker",
                  html: `<div style="
                  width: ${size}px; 
                  height: ${size}px; 
                  background-color: ${bgColor}; 
                  border: 2px solid white; 
                  border-radius: 50%; 
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  transform: translate(-50%, -50%);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: ${isCluster ? "10px" : "12px"};
                  font-weight: bold;
                ">${isCluster ? group.length : orderNumber || ""}</div>`,
                  iconSize: [size, size],
                  iconAnchor: [size / 2, size / 2],
                });
              };

              return (
                <Marker
                  key={`${image.id}_${imageIndex}`}
                  position={[offsetLat, offsetLng]}
                  icon={createDotIcon()}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                            <OptimizedImage
                              src={image.thumbnailUrl || image.url}
                              alt={
                                image.description ||
                                `Checkpoint ${imageIndex + 1}`
                              }
                              width={48}
                              height={48}
                              className="object-cover"
                              objectFit="cover"
                              fallbackSrc="/placeholder-image.svg"
                              onError={() => {
                                console.log(
                                  "Image failed to load:",
                                  image.thumbnailUrl || image.url
                                );
                              }}
                              onLoad={() => {
                                console.log(
                                  "Image loaded successfully:",
                                  image.thumbnailUrl || image.url
                                );
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {image.description ||
                              `Checkpoint ${imageIndex + 1}`}
                          </h3>

                          <div className="mt-1 space-y-1">
                            <div className="flex items-center text-xs text-gray-600">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              <span>
                                {formatDate(image.createdAt.toString())}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex space-x-2">
                            {(onImageClick || onShowCarousel) && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleMarkerClick(image);
                                }}
                                className="flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                title={
                                  onShowCarousel
                                    ? "Xem tất cả ảnh"
                                    : t.plan.viewImage
                                }
                              >
                                <PhotoIcon className="w-3 h-3 sm:mr-1" />
                                <span className="hidden sm:inline">
                                  {onShowCarousel
                                    ? "Xem tất cả ảnh"
                                    : t.plan.viewImage}
                                </span>
                              </button>
                            )}

                            <button
                              onClick={() =>
                                openGoogleMaps(image.latitude, image.longitude)
                              }
                              className="flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                              title={t.plan.openGoogleMaps}
                            >
                              <MapPinIcon className="w-3 h-3 sm:mr-1" />
                              <span className="hidden sm:inline">
                                {t.plan.openGoogleMaps}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })
          )}
        </MapContainer>
      </div>

      {/* Map Info */}
      {showMapInfo && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm text-gray-700 relative">
            <button
              onClick={() => setShowMapInfo(!showMapInfo)}
              className="absolute top-0 right-0"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
            <div className="font-medium">
              {images.length} {t.plan.checkpoints}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t.plan.clickMarker}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              🔵 {t.plan.orderByDate}
            </div>
            {groupNearbyImages(images).some((group) => group.length > 1) && (
              <div className="text-xs text-orange-600 mt-1">
                🔴 {t.plan.clusterInfo}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
