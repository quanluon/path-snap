'use client';

import ImageCarousel from '@/components/ImageCarousel';
import ImageDetailModal from '@/components/ImageDetailModal';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ImageWithReactions } from '@/types';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function HomePageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [images, setImages] = useState<ImageWithReactions[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageWithReactions | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
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
      
      const response = await fetch(`/api/images?limit=${itemsPerPage}&offset=${images.length}`);
      const data = await response.json();
      
      const newImages = data.images || [];
      
      if (isInitial) {
        setImages(newImages);
      } else {
        // Filter out duplicates based on image ID
        const uniqueNewImages = newImages.filter(
          (newImage: ImageWithReactions) => 
            !images.some(existingImage => existingImage.id === newImage.id)
        );
        setImages(prev => [...prev, ...uniqueNewImages]);
      }
      
      // If no new images returned, no more to load
      setHasMore(newImages.length > 0);
    } catch (error) {
      console.error('Error fetching images:', error);
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
    const imageId = searchParams.get('image');
    
    if (imageId && !selectedImage) {
      // Check if image is already in the loaded images
      const existingImage = images.find(img => img.id === imageId);
      
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
  }, [searchParams, images, selectedImage]);

  const loadMoreImages = async () => {
    if (hasMore && !isLoadingMore) {
      await fetchImages(false);
    }
  };

  const fetchImageById = async (imageId: string) => {
    try {
      setIsLoadingImage(true);
      const response = await fetch(`/api/images/${imageId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch image:', response.status);
        return null;
      }
      
      const data = await response.json();
      return data.image;
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handleImageClick = (image: ImageWithReactions) => {
    setSelectedImage(image);
    setIsModalOpen(true);
    // Update URL to include image ID
    router.push(`/?image=${image.id}`, { scroll: false });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
    // Remove image parameter from URL
    router.push('/', { scroll: false });
  };


  return (
    <div className="relative">
      {/* Main Content */}
      {isLoading ? (
        <div className="h-screen flex justify-center items-center bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80 text-lg font-secondary font-medium">{t.common.loading}</p>
          </div>
        </div>
      ) : (
        <ImageCarousel 
          images={images} 
          onImageClick={handleImageClick}
          onLoadMore={loadMoreImages}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
        />
      )}

      {/* Loading overlay for fetching specific image */}
      {isLoadingImage && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black/80 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-sm">Loading image...</p>
          </div>
        </div>
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
    <Suspense fallback={
      <div className="h-screen flex justify-center items-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80 text-lg font-secondary font-medium">Loading...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
