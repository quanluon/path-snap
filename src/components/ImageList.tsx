"use client";

import ImageItem from "@/components/ImageItem";
import { CarouselSkeleton } from "@/components/Skeleton";
import { useBatchReactions } from "@/hooks/useBatchReactions";
import type { ImageWithReactions } from "@/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import VirtualGrid from "./VirtualGrid";

interface ImageListProps {
  images: ImageWithReactions[];
  onImageClick?: (image: ImageWithReactions) => void;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const ImageList = ({
  images,
  onImageClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ImageListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Use batch reactions hook for optimized API calls
  const { reactionCounts, userReactions, fetchBatchReactions, addReaction } =
    useBatchReactions();

  // Create virtualizer
  const virtualizer = useVirtualizer({
    count: images.length,
    getScrollElement: () => parentRef.current,
    overscan: 3, // Render 3 extra items outside viewport
    gap: 5, // No gap between items
    estimateSize: () => 500,
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

  // Memoize image IDs to prevent unnecessary API calls
  const imageIds = useMemo(() => {
    return images.map((img) => img.id).filter((id) => id && id.trim() !== "");
  }, [images]);

  // Fetch batch reactions when image IDs change (only when images array changes)
  useEffect(() => {
    if (imageIds.length > 0) {
      fetchBatchReactions(imageIds);
    }
  }, [imageIds, fetchBatchReactions]); // Re-added fetchBatchReactions since it's now stable

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-muted">No images found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="hidden sm:block">
        <VirtualGrid
          images={images}
          onImageClick={onImageClick}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
        />
      </div>
      <div className="relative w-full h-screen overflow-hidden bg-green sm:hidden">
        <div
          ref={parentRef}
          className="h-full overflow-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
              margin: 0,
              padding: 0,
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
                      ref={virtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      <CarouselSkeleton />
                    </div>
                  );
                } else if (!hasMore && images.length > 0) {
                  return (
                    <div
                      key={virtualItem.key}
                      ref={virtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                        margin: 0,
                        padding: 0,
                      }}
                      className="w-full flex items-center justify-center bg-green"
                    >
                      <div className="text-center">
                        <div className="text-white/60 text-6xl mb-4">✨</div>
                        <p className="text-white/80 text-lg font-secondary font-medium">
                          You&apos;ve reached the end!
                        </p>
                        <p className="text-white/60 text-sm font-caption mt-2">
                          No more images to show
                        </p>
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
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <ImageItem
                    image={image}
                    onImageClick={onImageClick}
                    reactionCounts={reactionCounts[image.id]}
                    userReaction={userReactions[image.id]}
                    onReactionChange={(type) => addReaction(image.id, type)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageList;
