import { useState, useCallback, useEffect } from 'react';
import type { CommentWithUser, CommentListResponse, CommentCreateRequest } from '@/types';

interface UseCommentsProps {
  imageId: string;
  enabled?: boolean;
}

interface UseCommentsReturn {
  comments: CommentWithUser[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  loadComments: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  createComment: (content: string, guestName?: string, guestEmail?: string) => Promise<CommentWithUser | null>;
  refreshComments: () => Promise<void>;
}

const COMMENTS_PER_PAGE = 20;

export function useComments({ imageId, enabled = true }: UseCommentsProps): UseCommentsReturn {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const loadComments = useCallback(async (page: number = 1) => {
    if (!imageId?.trim() || !enabled) {
      console.log('Skipping loadComments: empty imageId or disabled');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/comments?imageId=${imageId}&page=${page}&limit=${COMMENTS_PER_PAGE}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data: CommentListResponse = await response.json();
      
      if (page === 1) {
        setComments(data.comments);
      } else {
        setComments(prev => [...prev, ...data.comments]);
      }
      
      setHasMore(data.hasMore);
      setTotalCount(data.totalCount);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [imageId, enabled]);

  const createComment = useCallback(async (content: string, guestName?: string, guestEmail?: string): Promise<CommentWithUser | null> => {
    if (!imageId?.trim() || !content?.trim()) {
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageId, 
          content: content.trim(),
          ...(guestName && { guestName }),
          ...(guestEmail && { guestEmail })
        } as CommentCreateRequest),
      });

      if (!response.ok) {
        throw new Error('Failed to create comment');
      }

      const data = await response.json();
      const newComment = data.comment;

      // Add the new comment to the beginning of the list
      setComments(prev => [newComment, ...prev]);
      setTotalCount(prev => prev + 1);

      return newComment;
    } catch (err) {
      console.error('Error creating comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create comment');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [imageId]);

  const refreshComments = useCallback(async () => {
    setCurrentPage(1);
    await loadComments(1);
  }, [loadComments]);

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await loadComments(currentPage + 1);
    }
  }, [hasMore, isLoading, currentPage, loadComments]);

  // Load comments on mount and when imageId changes
  useEffect(() => {
    if (enabled) {
      refreshComments();
    }
  }, [enabled, imageId, refreshComments]);

  return {
    comments,
    isLoading,
    isCreating,
    error,
    hasMore,
    totalCount,
    loadComments,
    loadMore,
    createComment,
    refreshComments,
  };
}
