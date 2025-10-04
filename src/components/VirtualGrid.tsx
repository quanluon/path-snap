"use client";

import ImageItem from "@/components/ImageItem";
import { CarouselSkeleton } from "@/components/Skeleton";
import { useBatchReactions } from "@/hooks/useBatchReactions";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ImageWithReactions } from "@/types";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface VirtualGridProps {
  images: ImageWithReactions[];
  onImageClick?: (image: ImageWithReactions) => void;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  columns?: number;
  gap?: number;
  itemHeight?: number;
}

const offsetWidth = 40

const VirtualGrid = ({
  images,
  onImageClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  columns = 2,
  gap = 8,
  itemHeight = 500,
}: VirtualGridProps) => {
  const { t } = useLanguage();
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Use batch reactions hook for optimized API calls
  const { reactionCounts, userReactions, fetchBatchReactions, addReaction } =
    useBatchReactions();

  // Calculate responsive columns based on container width
  const responsiveColumns = useMemo(() => {
    if (containerWidth === 0) return columns;
    // Responsive breakpoints
    if (containerWidth < 1024) return 2; // lg
    if (containerWidth < 1280) return 3; // xl
    if (containerWidth < 1536) return 4; // 2xl
    return 6; // 3xl+
  }, [containerWidth, columns]);

  // Calculate item width based on columns and gap
  const itemWidth = useMemo(() => {
    if (containerWidth === 0) return 0;
    return (containerWidth - (gap * (responsiveColumns - 1))) / responsiveColumns;
  }, [containerWidth, responsiveColumns, gap]);

  // Calculate total rows needed
  const totalRows = useMemo(() => {
    return Math.ceil(images.length / responsiveColumns);
  }, [images.length, responsiveColumns]);

  // Create virtualizer for rows
  const virtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight + gap,
    overscan: 2,
  });

  // Update container width on resize with ResizeObserver for better performance
  useEffect(() => {
    const updateWidth = () => {
      if (parentRef.current) {
        setContainerWidth(parentRef.current.clientWidth - offsetWidth);
      }
    };

    updateWidth();

    // Use ResizeObserver if available, fallback to window resize
    let resizeObserver: ResizeObserver | null = null;
    
    if (parentRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width - offsetWidth);
        }
      });
      resizeObserver.observe(parentRef.current);
    } else {
      window.addEventListener('resize', updateWidth);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', updateWidth);
      }
    };
  }, []);

  // Load more when scrolling near the end
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= totalRows - 1 &&
      onLoadMore &&
      hasMore &&
      !isLoadingMore
    ) {
      onLoadMore();
    }
  }, [virtualizer, totalRows, onLoadMore, hasMore, isLoadingMore]);

  // Memoize image IDs to prevent unnecessary API calls
  const imageIds = useMemo(() => {
    return images.map((img) => img.id).filter((id) => id && id.trim() !== "");
  }, [images]);

  // Fetch batch reactions when image IDs change
  useEffect(() => {
    if (imageIds.length > 0) {
      fetchBatchReactions(imageIds);
    }
  }, [imageIds, fetchBatchReactions]);

  // Memoized row renderer for better performance
  const renderRow = useCallback((virtualRow: VirtualItem) => {
    const rowIndex = virtualRow.index;
    const startIndex = rowIndex * responsiveColumns;
    const endIndex = Math.min(startIndex + responsiveColumns, images.length);
    const rowImages = images.slice(startIndex, endIndex);

    return (
      <div
        key={virtualRow.key}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
          display: "flex",
          gap: `${gap}px`,
          padding: `0 ${gap / 2}px`,
        }}
      >
        {rowImages.map((image) => {
          return (
            <div
              key={image.id}
              style={{
                width: `${itemWidth}px`,
                height: `${itemHeight}px`,
                flexShrink: 0,
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
        
        {/* Fill empty spaces in the last row */}
        {Array.from({ length: responsiveColumns - rowImages.length }).map((_, emptyIndex) => (
          <div
            key={`empty-${emptyIndex}`}
            style={{
              width: `${itemWidth}px`,
              height: `${itemHeight}px`,
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    );
  }, [images, responsiveColumns, gap, itemWidth, itemHeight, onImageClick, reactionCounts, userReactions, addReaction]);

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-muted">{t.grid.noImages}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-green">
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
          }}
        >
          {virtualizer.getVirtualItems().map(renderRow)}
          
          {/* Loading indicator */}
          {isLoadingMore && (
            <div
              style={{
                position: "absolute",
                top: `${virtualizer.getTotalSize()}px`,
                left: 0,
                width: "100%",
                height: "200px",
              }}
            >
              <CarouselSkeleton />
            </div>
          )}
          
          {/* End of results indicator */}
          {!hasMore && images.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: `${virtualizer.getTotalSize()}px`,
                left: 0,
                width: "100%",
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--color-cream)",
              }}
            >
              <div className="text-center">
                <div className="text-white/60 text-6xl mb-4">✨</div>
                <p className="text-white/80 text-lg font-secondary font-medium">
                  {t.grid.endOfResults}
                </p>
                <p className="text-white/60 text-sm font-caption mt-2">
                  {t.grid.noMoreImages}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualGrid;
