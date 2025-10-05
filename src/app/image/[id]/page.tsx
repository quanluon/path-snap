'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageDetailModal from '@/components/ImageDetailModal';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ImageWithReactions } from '@/types';

export default function ImagePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [image, setImage] = useState<ImageWithReactions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string>('');

  // Handle async params
  useEffect(() => {
    params.then(({ id }) => {
      setImageId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!imageId) {
      setError('No image ID provided');
      setIsLoading(false);
      return;
    }

    const fetchImage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/images/${imageId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(t.common.imageNotFound);
          } else {
            setError(t.common.failedToLoad);
          }
          return;
        }
        
        const data = await response.json();
        setImage(data.image);
      } catch (err) {
        console.error('Error fetching image:', err);
        setError(t.common.failedToLoad);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [imageId]);

  const handleClose = () => {
    // Navigate back to home page
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80 text-lg font-secondary font-medium">{t.common.loadingImage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex justify-center items-center bg-black">
        <div className="text-center">
          <div className="text-white/60 text-6xl mb-4">😞</div>
          <h1 className="text-white text-2xl font-bold mb-2">{t.common.oops}</h1>
          <p className="text-white/70 text-lg mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t.common.goHome}
          </button>
        </div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="h-screen flex justify-center items-center bg-black">
        <div className="text-center">
          <div className="text-white/60 text-6xl mb-4">🤔</div>
          <h1 className="text-white text-2xl font-bold mb-2">{t.common.somethingWrong}</h1>
          <p className="text-white/70 text-lg mb-6">{t.common.unableToLoad}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t.common.goHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black">
      <ImageDetailModal
        image={image}
        isOpen={true}
        onClose={handleClose}
      />
    </div>
  );
}
