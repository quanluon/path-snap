'use client';

import { useState, useEffect } from 'react';
import ImageCarousel from '@/components/ImageCarousel';
import ImageDetailModal from '@/components/ImageDetailModal';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ImageWithReactions } from '@/types';

export default function HomePage() {
  const { t } = useLanguage();
  const [images, setImages] = useState<ImageWithReactions[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageWithReactions | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/images?limit=20');
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t.nav.home}
        </h1>
        <p className="text-gray-600">
          Discover checkpoints from around the world
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-gray-500">{t.common.loading}</div>
        </div>
      ) : (
        <ImageCarousel images={images} onImageClick={handleImageClick} />
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
