"use client";

import { useState, useEffect } from "react";
import SearchImages from "@/components/SearchImages";
import ImageCarousel from "@/components/ImageCarousel";
import ImageDetailModal from "@/components/ImageDetailModal";
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
  const [searchParams, setSearchParams] = useState<{
    latitude: number;
    longitude: number;
    radius: number;
  } | null>(null);
  const itemsPerPage = 50;

  const fetchSearchResults = async () => {
    if (!searchParams) return;

    try {
      const response = await fetch(
        `/api/search?latitude=${searchParams.latitude}&longitude=${searchParams.longitude}&radius=${searchParams.radius}&limit=${itemsPerPage}&offset=${results.length}`
      );
      const data = await response.json();

      const newImages = data.images || [];

      // Filter out duplicates based on image ID
      const uniqueNewImages = newImages.filter(
        (newImage: ImageWithReactions) =>
          !results.some((existingImage) => existingImage.id === newImage.id)
      );
      setResults((prev) => [...prev, ...uniqueNewImages]);

      // If no new images returned, no more to load
      setHasMore(newImages.length > 0);
    } catch (error) {
      console.error("Search error:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSearch = async (
    latitude: number,
    longitude: number,
    radius: number
  ) => {
    setSearchParams({ latitude, longitude, radius });
  };

  useEffect(() => {
      fetchSearchResults();
  }, [searchParams]);

  const loadMoreResults = async () => {
    if (hasMore && !isLoadingMore) {
      await fetchSearchResults();
    }
  };

  const handleImageClick = (image: ImageWithReactions) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleReaction = async (imageId: string, type: string) => {
    try {
      await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, type }),
      });
      // Refresh results to get updated reaction counts
      // Note: In a real app, you'd want to update the specific image in results
      // For now, we'll just refresh the search results
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t.nav.search}
        </h1>
        <p className="text-gray-600">Tìm kiếm checkpoint gần vị trí của bạn</p>
      </div>

      <SearchImages
        onSearch={handleSearch}
        results={results}
        isLoading={isLoading}
      />

      {results.length > 0 && (
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Kết quả tìm kiếm ({results.length} ảnh)
            </h2>
          </div>
          <ImageCarousel
            images={results}
            onImageClick={handleImageClick}
            onLoadMore={loadMoreResults}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
          />
        </div>
      )}

      <ImageDetailModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReact={handleReaction}
      />
    </div>
  );
}
