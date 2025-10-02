'use client';

import ImageCarousel from '@/components/ImageCarousel';
import ImageDetailModal from '@/components/ImageDetailModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useImages } from '@/hooks/useImages';
import type { ImageWithReactions } from '@/types';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<ImageWithReactions | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 50;

  const {
    images,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchImages,
    refreshImages,
  } = useImages({ itemsPerPage });


  useEffect(() => {
    fetchImages(true);
  }, [fetchImages]);

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
