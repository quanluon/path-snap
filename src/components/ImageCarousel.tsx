'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import ImageItem from '@/components/ImageItem';
import { useBatchReactions } from '@/hooks/useBatchReactions';
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
  
  // Use batch reactions hook for optimized API calls
  const { reactionCounts, userReactions, fetchBatchReactions, addReaction, removeReaction } = useBatchReactions();

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

  // Fetch batch reactions when images change
  useEffect(() => {
    if (images.length > 0) {
      const imageIds = images.map(img => img.id);
      fetchBatchReactions(imageIds);
    }
  }, [images, fetchBatchReactions]);

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
                      <p className="text-white/80 text-lg font-secondary font-medium">Loading more images...</p>
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
                      <p className="text-white/80 text-lg font-secondary font-medium">You&apos;ve reached the end!</p>
                      <p className="text-white/60 text-sm font-caption mt-2">No more images to show</p>
                    </div>
                  </div>
                );
              }
            }

            const image = images[index];
            if (!image) return null;

            return (
              <ImageItem
                key={virtualItem.key}
                image={image}
                onImageClick={onImageClick}
                reactionCounts={reactionCounts[image.id]}
                userReaction={userReactions[image.id]}
                onReactionChange={(type) => addReaction(image.id, type)}
                isAuthenticated={true} // TODO: Get from auth context
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}


