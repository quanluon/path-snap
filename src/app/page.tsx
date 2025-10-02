'use client';

import ImageCarousel from '@/components/ImageCarousel';
import ImageDetailModal from '@/components/ImageDetailModal';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ImageWithReactions } from '@/types';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { t } = useLanguage();
  const [images, setImages] = useState<ImageWithReactions[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageWithReactions | null>(null);
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

  const loadMoreImages = async () => {
    if (hasMore && !isLoadingMore) {
      await fetchImages(false);
    }
  };

  const handleImageClick = (image: ImageWithReactions) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleReaction = async (imageId: string, type: string) => {
    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, type }),
      });
      // Refresh images to get updated reaction counts
      fetchImages();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  return (
    <div className="relative">
      {/* Header - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-display font-bold text-white">
            {t.nav.home}
          </h1>
          <p className="text-white/70 text-sm font-caption">
            Discover checkpoints from around the world
          </p>
        </div>
      </div>

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

      <ImageDetailModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReact={handleReaction}
      />
    </div>
  );
}
