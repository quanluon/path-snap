'use client';

import { useState } from 'react';
import SearchImages from '@/components/SearchImages';
import ImageCarousel from '@/components/ImageCarousel';
import ImageDetailModal from '@/components/ImageDetailModal';
import type { ImageWithReactions } from '@/types';

export default function SearchPage() {
  const [results, setResults] = useState<ImageWithReactions[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageWithReactions | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = async (latitude: number, longitude: number, radius: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
      );
      const data = await response.json();
      setResults(data.images || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (image: ImageWithReactions) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SearchImages onSearch={handleSearch} results={results} isLoading={isLoading} />
      
      {results.length > 0 && (
        <div className="mt-8">
          <ImageCarousel images={results} onImageClick={handleImageClick} />
        </div>
      )}

      <ImageDetailModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

