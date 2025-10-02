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

      <ImageDetailModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
