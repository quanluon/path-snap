import { useState, useRef, useEffect, useCallback } from 'react';
import CommentItem from './CommentItem';
import Skeleton from './Skeleton';
import type { CommentWithUser } from '@/types';

interface CommentListProps {
  comments: CommentWithUser[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const ITEM_HEIGHT = 80; // Approximate height of each comment item
const VISIBLE_ITEMS = 10; // Number of items visible at once
const BUFFER_SIZE = 5; // Extra items to render outside viewport

export default function CommentList({ comments, isLoading, hasMore, onLoadMore }: CommentListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    comments.length - 1,
    startIndex + VISIBLE_ITEMS + BUFFER_SIZE * 2
  );

  const visibleComments = comments.slice(startIndex, endIndex + 1);
  const totalHeight = comments.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT;

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);

    // Load more when near bottom
    if (hasMore && !isLoading) {
      const { scrollTop: currentScrollTop, scrollHeight, clientHeight } = target;
      if (scrollHeight - currentScrollTop <= clientHeight + 200) {
        onLoadMore();
      }
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Update container height on mount
  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, []);

  if (comments.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <p>No comments yet</p>
          <p className="text-sm">Be the first to comment!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto"
      onScroll={handleScroll}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleComments.map((comment, index) => (
            <div
              key={comment.id}
              style={{ height: ITEM_HEIGHT }}
              className="flex items-center"
            >
              <CommentItem comment={comment} />
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Loading comments...</span>
              </div>
            </div>
          )}
          
          {/* Load more button */}
          {hasMore && !isLoading && comments.length > 0 && (
            <div className="flex items-center justify-center p-4">
              <button
                onClick={onLoadMore}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Load more comments
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
