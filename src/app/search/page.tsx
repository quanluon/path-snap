"use client";

import { useState, useEffect, useCallback } from "react";
import SearchImages from "@/components/SearchImages";
import ImageList from "@/components/ImageList";
import ImageDetailModal from "@/components/ImageDetailModal";
import CheckpointMap from "@/components/CheckpointMap";
import ViewToggle from "@/components/ViewToggle";
import { CarouselSkeleton } from "@/components/Skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ImageWithReactions } from "@/types";

export default function SearchPage() {
  const { t } = useLanguage();
  const [results, setResults] = useState<ImageWithReactions[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageWithReactions | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentView, setCurrentView] = useState<"grid" | "map">("grid");
  const [searchParams, setSearchParams] = useState<{
    latitude: number;
    longitude: number;
    radius: number;
  } | null>(null);
  const itemsPerPage = 50;

  const fetchSearchResults = useCallback(async (offset: number = 0) => {
    if (!searchParams) return;

    try {
      const response = await fetch(
        `/api/search?latitude=${searchParams.latitude}&longitude=${searchParams.longitude}&radius=${searchParams.radius}&limit=${itemsPerPage}&offset=${offset}`
      );
      const data = await response.json();

      const newImages = data.images || [];

      if (offset === 0) {
        // Initial search - replace results
        setResults(newImages);
      } else {
        // Load more - append results and filter duplicates
        setResults((prev) => {
          const uniqueNewImages = newImages.filter(
            (newImage: ImageWithReactions) =>
              !prev.some((existingImage) => existingImage.id === newImage.id)
          );
          return [...prev, ...uniqueNewImages];
        });
      }

      // If no new images returned, no more to load
      setHasMore(newImages.length > 0);
    } catch (error) {
      console.error("Search error:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchParams, itemsPerPage]);

  const handleSearch = async (
    latitude: number,
    longitude: number,
    radius: number
  ) => {
    setSearchParams({ latitude, longitude, radius });
  };

  useEffect(() => {
    if (searchParams) {
      fetchSearchResults(0);
    }
  }, [searchParams, fetchSearchResults]);

  const loadMoreResults = async () => {
    if (hasMore && !isLoadingMore) {
      await fetchSearchResults(results.length);
    }
  };

  const handleImageClick = (image: ImageWithReactions) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleViewChange = (view: "grid" | "map") => {
    setCurrentView(view);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SearchImages
        onSearch={handleSearch}
        results={results}
        isLoading={isLoading}
      />

      {isLoading && results.length === 0 ? (
        <div className="mt-8">
          <div className="mb-4">
            <div className="h-6 bg-white/10 rounded w-48 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-32"></div>
          </div>
          <CarouselSkeleton />
        </div>
      ) : results.length > 0 ? (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-dark-primary">
              {t.search.resultsTitle} ({results.length} {t.search.resultsCount})
            </h2>
            <ViewToggle
              currentView={currentView}
              onViewChange={handleViewChange}
            />
          </div>
          
          {currentView === "grid" ? (
            <ImageList
              images={results}
              onImageClick={handleImageClick}
              onLoadMore={loadMoreResults}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
            />
          ) : (
            <div className="h-[70vh] rounded-xl overflow-hidden border border-white/10">
              <CheckpointMap
                images={results}
                onImageClick={handleImageClick}
                className="h-full"
                hasLine={false}
              />
            </div>
          )}
        </div>
      ) : null}

      <ImageDetailModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
