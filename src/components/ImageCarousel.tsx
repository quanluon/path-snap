'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPinIcon, HeartIcon } from '@heroicons/react/24/solid';
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
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle scroll events for infinite scroll
  const handleScroll = useCallback(() => {
    if (isScrolling.current) return;
    
    isScrolling.current = true;
    
    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    // Set new timeout to detect scroll end
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
      
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const scrollHeight = container.scrollHeight;
      
      // Calculate current image index based on scroll position
      const newIndex = Math.round(scrollTop / containerHeight);
      setCurrentIndex(newIndex);
      
      // Check if we need to load more images (when 80% scrolled)
      const scrollPercentage = (scrollTop + containerHeight) / scrollHeight;
      
      if (scrollPercentage >= 0.8 && onLoadMore && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    }, 150);
  }, [onLoadMore, hasMore, isLoadingMore]);

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number) => {
    if (!containerRef.current || index < 0 || index >= images.length) return;
    
    const container = containerRef.current;
    const containerHeight = container.clientHeight;
    const scrollTop = index * containerHeight;
    
    container.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  }, [images.length]);

  // Initialize scroll position
  useEffect(() => {
    if (startIndex !== currentIndex && images.length > 0) {
      scrollToIndex(startIndex);
      setCurrentIndex(startIndex);
    }
  }, [startIndex, scrollToIndex, currentIndex, images.length]);

  // Scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [handleScroll]);

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-muted">No images found</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Instagram-style Feed Container */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex flex-col">
          {images.map((image, index) => (
            <div
              key={`${image.id}-${index}`}
              className="flex-shrink-0 w-full h-screen snap-start snap-always relative"
            >
              {/* Full Screen Image Container */}
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <div 
                  className="relative w-full h-full cursor-pointer"
                  onClick={() => onImageClick?.(image)}
                >
                  <OptimizedImage
                    src={image.thumbnailUrl || image.url}
                    alt={image.description || 'Checkpoint image'}
                    fill
                    className="object-contain"
                    objectFit="contain"
                    fallbackSrc="/placeholder-image.svg"
                  />
                </div>
                
                {/* Instagram-style Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6">
                  {/* Description */}
                  {image.description && (
                    <p className="text-white text-base mb-4 font-medium leading-relaxed">
                      {image.description}
                    </p>
                  )}
                  
                  {/* Location and Reactions */}
                  <div className="flex items-center justify-between text-white/90 mb-2">
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">
                        {image.latitude.toFixed(4)}, {image.longitude.toFixed(4)}
                      </span>
                    </div>
                    
                    {image.reactionCount !== undefined && image.reactionCount > 0 && (
                      <div className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                        <HeartIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">
                          {image.reactionCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-white/70 text-sm">
                    {new Date(image.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Progress Indicator (Instagram-style dots) */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-1">
                    {images.slice(0, Math.min(10, images.length)).map((_, dotIndex) => (
                      <div
                        key={dotIndex}
                        className={`w-1 h-1 rounded-full transition-all duration-300 ${
                          dotIndex === index ? 'bg-white' : 'bg-white/30'
                        }`}
                      />
                    ))}
                    {images.length > 10 && (
                      <div className="w-1 h-1 rounded-full bg-white/30" />
                    )}
                  </div>
                </div>

                {/* Current Image Counter */}
                <div className="absolute top-6 right-6">
                  <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {index + 1} / {images.length}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div className="flex-shrink-0 w-full h-screen flex items-center justify-center bg-black">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/80 text-lg font-medium">Loading more images...</p>
              </div>
            </div>
          )}
          
          {/* End of Feed */}
          {!hasMore && images.length > 0 && (
            <div className="flex-shrink-0 w-full h-screen flex items-center justify-center bg-black">
              <div className="text-center">
                <div className="text-white/60 text-6xl mb-4">✨</div>
                <p className="text-white/80 text-lg font-medium">You've reached the end!</p>
                <p className="text-white/60 text-sm mt-2">No more images to show</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


