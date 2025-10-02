'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MapPinIcon, HeartIcon } from '@heroicons/react/24/solid';
import OptimizedImage from '@/components/OptimizedImage';
import type { ImageWithReactions } from '@/types';

interface ImageCarouselProps {
  images: ImageWithReactions[];
  onImageClick?: (image: ImageWithReactions) => void;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

// Virtual scrolling configuration
const ITEM_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 800;

export default function ImageCarousel({ 
  images, 
  onImageClick, 
  onLoadMore, 
  hasMore = false, 
  isLoadingMore = false 
}: ImageCarouselProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate total item count (including loading state)
  const itemCount = useMemo(() => {
    return hasMore ? images.length + 1 : images.length;
  }, [images.length, hasMore]);

  // Create virtualizer
  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 3, // Render 3 extra items outside viewport
  });

  // Load more when scrolling near the end
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
    
    if (!lastItem) return;

    if (
      lastItem.index >= images.length - 1 &&
      onLoadMore &&
      hasMore &&
      !isLoadingMore
    ) {
      onLoadMore();
    }
  }, [virtualizer, images.length, onLoadMore, hasMore, isLoadingMore]);

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-muted">No images found</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div
        ref={parentRef}
        className="h-full overflow-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const index = virtualItem.index;
            
            // Show loading indicator for the last item if we have more to load
            if (index >= images.length) {
              if (isLoadingMore) {
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="w-full flex items-center justify-center bg-black"
                  >
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-white/80 text-lg font-medium">Loading more images...</p>
                    </div>
                  </div>
                );
              } else if (!hasMore && images.length > 0) {
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="w-full flex items-center justify-center bg-black"
                  >
                    <div className="text-center">
                      <div className="text-white/60 text-6xl mb-4">✨</div>
                      <p className="text-white/80 text-lg font-medium">You&apos;ve reached the end!</p>
                      <p className="text-white/60 text-sm mt-2">No more images to show</p>
                    </div>
                  </div>
                );
              }
            }

            const image = images[index];
            if (!image) return null;

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="w-full bg-black"
              >
                {/* Image and Content Container */}
                <div className="w-full h-full bg-black flex flex-col">
                  {/* Image Section */}
                  <div className="relative w-full flex-1 bg-black flex items-center justify-center">
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
                  </div>
                  
                  {/* Text Content Section */}
                  <div className="bg-black p-6 flex-shrink-0">
                    {/* Description */}
                    {image.description && (
                      <p className="text-white text-base mb-4 font-medium leading-relaxed break-words line-clamp-3">
                        {image.description}
                      </p>
                    )}
                    
                    {/* Location and Reactions */}
                    <div className="flex items-center justify-between text-white/90 mb-2">
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium truncate max-w-[200px]">
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


