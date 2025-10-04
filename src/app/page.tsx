"use client";

import ImageList from "@/components/ImageList";
import ImageDetailModal from "@/components/ImageDetailModal";
import { CarouselSkeleton } from "@/components/Skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ImageWithReactions } from "@/types";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function HomePageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [images, setImages] = useState<ImageWithReactions[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageWithReactions | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 50;

  const fetchImages = async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
        setImages([]);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetch(
        `/api/images?limit=${itemsPerPage}&offset=${images.length}`
      );
      const data = await response.json();

      const newImages = data.images || [];

      if (isInitial) {
        setImages(newImages);
      } else {
        // Filter out duplicates based on image ID
        const uniqueNewImages = newImages.filter(
          (newImage: ImageWithReactions) =>
            !images.some((existingImage) => existingImage.id === newImage.id)
        );
        setImages((prev) => [...prev, ...uniqueNewImages]);
      }

      // If no new images returned, no more to load
      setHasMore(newImages.length > 0);
    } catch (error) {
      console.error("Error fetching images:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchImages(true);
  }, []);

  // Handle URL parameters for opening specific images
  useEffect(() => {
    const imageId = searchParams.get("image");

    if (imageId && !selectedImage) {
      // Check if image is already in the loaded images
      const existingImage = images.find((img) => img.id === imageId);

      if (existingImage) {
        setSelectedImage(existingImage);
        setIsModalOpen(true);
      } else {
        // Fetch the specific image
        fetchImageById(imageId).then((image) => {
          if (image) {
            setSelectedImage(image);
            setIsModalOpen(true);
          }
        });
      }
    }
  }, [searchParams]);

  const loadMoreImages = async () => {
    if (hasMore && !isLoadingMore) {
      await fetchImages(false);
    }
  };

  const fetchImageById = async (imageId: string) => {
    try {
      const response = await fetch(`/api/images/${imageId}`);

      if (!response.ok) {
        console.error("Failed to fetch image:", response.status);
        return null;
      }

      const data = await response.json();
      return data.image;
    } catch (error) {
      console.error("Error fetching image:", error);
      return null;
    }
  };

  const handleImageClick = (image: ImageWithReactions) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
    router.replace("/", { scroll: false});
  };

  return (
    <div className="relative">
      {/* Main Content */}
      {isLoading ? (
        <CarouselSkeleton />
      ) : (
        <ImageList
          images={images}
          onImageClick={handleImageClick}
          onLoadMore={loadMoreImages}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
        />
      )}

      <ImageDetailModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<CarouselSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}
