'use client';

import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { MapPinIcon } from '@heroicons/react/24/solid';
import OptimizedImage from '@/components/OptimizedImage';
import type { ImageWithReactions } from '@/types';

interface ImageCarouselProps {
  images: ImageWithReactions[];
  onImageClick?: (image: ImageWithReactions) => void;
  startIndex?: number;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export default function ImageCarousel({ 
  images, 
  onImageClick, 
  startIndex = 0, 
  onLoadMore, 
  hasMore = false, 
  isLoadingMore = false 
}: ImageCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    axis: 'y', // Vertical scrolling
    dragFree: false, // Snap to each image
    containScroll: 'trimSnaps',
    skipSnaps: false
  });
  const [selectedIndex, setSelectedIndex] = useState(startIndex);

  // Scroll to startIndex when component mounts or startIndex changes
  useEffect(() => {
    if (emblaApi && startIndex !== undefined && startIndex < images.length) {
      emblaApi.scrollTo(startIndex);
      setSelectedIndex(startIndex);
    }
  }, [emblaApi, startIndex, images.length]);

  // Keep current position when new images are loaded
  useEffect(() => {
    if (emblaApi && images.length > 0) {
      // Don't scroll if we're just adding more images (infinite scroll)
      // Only scroll if it's a fresh load or explicit startIndex change
      const currentSlideCount = emblaApi.slideNodes().length;
      if (currentSlideCount > 0 && selectedIndex < currentSlideCount) {
        // Maintain current position
        emblaApi.scrollTo(selectedIndex, false); // false = don't animate
      }
    }
  }, [emblaApi, images.length, selectedIndex]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const currentIndex = emblaApi.selectedScrollSnap();
    setSelectedIndex(currentIndex);
    
    // Check if we're near the end and should load more
    if (onLoadMore && hasMore && !isLoadingMore) {
      const totalSlides = emblaApi.slideNodes().length;
      // Load more when we're within 2 slides of the end
      if (currentIndex >= totalSlides - 2) {
        onLoadMore();
      }
    }
  }, [emblaApi, onLoadMore, hasMore, isLoadingMore]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-muted">No images found</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[70vh] sm:h-[600px]">
      {/* Carousel */}
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex flex-col h-full">
          {images.map((image, index) => (
            <div
              key={`${image.id}-${index}`}
              className="flex-[0_0_100%] h-full flex items-center justify-center p-4"
            >
              <div
                className="relative group cursor-pointer bg-dark-card rounded-lg overflow-hidden shadow-dark-primary hover:shadow-dark-secondary transition-all duration-200 w-full max-w-md mx-auto h-full hover-dark-card"
                onClick={() => onImageClick?.(image)}
              >
                {/* Image */}
                <div className="relative h-full">
                  <OptimizedImage
                    src={image.thumbnailUrl || image.url}
                    alt={image.description || 'Checkpoint image'}
                    fill
                    className="object-cover"
                    objectFit="cover"
                    fallbackSrc="/placeholder-image.svg"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity" />
                </div>

                {/* Image Info - Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  {image.description && (
                    <p className="text-white text-sm mb-2 line-clamp-2 font-medium">
                      {image.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-white/90">
                    <div className="flex items-center">
                      <MapPinIcon className="w-3 h-3 mr-1" />
                      <span className="truncate max-w-[120px] sm:max-w-none">
                        {image.latitude.toFixed(4)}, {image.longitude.toFixed(4)}
                      </span>
                    </div>
                    
                    {image.reactionCount !== undefined && image.reactionCount > 0 && (
                      <span className="bg-white/20 text-white px-2 py-1 rounded text-xs">
                        ❤️ {image.reactionCount}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-xs text-white/80">
                    {new Date(image.createdAt).toUTCString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div className="flex-[0_0_100%] h-full flex items-center justify-center p-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-primary mx-auto mb-2"></div>
                <p className="text-dark-muted text-sm">Đang tải thêm ảnh...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


