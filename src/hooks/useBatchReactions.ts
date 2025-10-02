'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type ReactionType } from '@/lib/constants';
import type { ReactionCounts } from '@/types';
import { useReactionContext } from '@/contexts/ReactionContext';
import { useUser } from '@/contexts/UserContext';

interface BatchReactionsReturn {
  reactionCounts: Record<string, ReactionCounts>;
  userReactions: Record<string, ReactionType | undefined>;
  isLoading: boolean;
  error: string | null;
  fetchBatchReactions: (imageIds: string[]) => Promise<void>;
  addReaction: (imageId: string, type: ReactionType) => Promise<void>;
  removeReaction: (imageId: string) => Promise<void>;
}

export function useBatchReactions(): BatchReactionsReturn {
  const [reactionCounts, setReactionCounts] = useState<Record<string, ReactionCounts>>({});
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType | undefined>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track last fetched imageIds to prevent duplicate calls
  const lastFetchedImageIds = useRef<string>('');
  // Use ref to avoid recreating fetchBatchReactions when auth state changes
  const isAuthenticatedRef = useRef(false);

  const { addBatchManagedImage } = useReactionContext();
  const { user } = useUser();

  // Update authentication ref when user context changes
  useEffect(() => {
    isAuthenticatedRef.current = !!user;
  }, [user]);

  const fetchBatchReactions = useCallback(async (imageIds: string[]) => {
    if (!imageIds || imageIds.length === 0) {
      console.log('Skipping fetchBatchReactions: empty or invalid imageIds');
      return;
    }

    // Filter out empty strings and invalid IDs
    const validImageIds = imageIds.filter(id => id && id.trim() !== '');
    if (validImageIds.length === 0) {
      console.log('Skipping fetchBatchReactions: no valid image IDs');
      return;
    }

    // Check if we've already fetched the same set of imageIds
    const currentImageIdsKey = validImageIds.sort().join(',');
    if (lastFetchedImageIds.current === currentImageIdsKey) {
      console.log('Skipping fetchBatchReactions: same imageIds already fetched');
      return;
    }

    // Update the last fetched imageIds
    lastFetchedImageIds.current = currentImageIdsKey;

    // Register these images as batch managed
    validImageIds.forEach(imageId => {
      addBatchManagedImage(imageId);
    });

    setIsLoading(true);
    setError(null);

    try {
      // Fetch reaction counts for all images in one request
      const countsResponse = await fetch(`/api/reactions/counts?imageIds=${validImageIds.join(',')}`);
      if (!countsResponse.ok) throw new Error('Failed to fetch reaction counts');
      
      const countsData = await countsResponse.json();
      setReactionCounts(countsData.counts);

      // Fetch user reactions if authenticated
      if (isAuthenticatedRef.current) {
        const userResponse = await fetch(`/api/reactions/user?imageIds=${validImageIds.join(',')}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const userReactionsMap: Record<string, ReactionType | undefined> = {};
          
          validImageIds.forEach(imageId => {
            userReactionsMap[imageId] = userData.reactions?.[imageId]?.type || undefined;
          });
          
          setUserReactions(prev => ({ ...prev, ...userReactionsMap }));
        } else if (userResponse.status === 401) {
          // User not authenticated, clear all user reactions
          const clearedReactions: Record<string, ReactionType | undefined> = {};
          validImageIds.forEach(imageId => {
            clearedReactions[imageId] = undefined;
          });
          setUserReactions(prev => ({ ...prev, ...clearedReactions }));
        }
      } else {
        // Not authenticated, clear user reactions for these images
        const clearedReactions: Record<string, ReactionType | undefined> = {};
        validImageIds.forEach(imageId => {
          clearedReactions[imageId] = undefined;
        });
        setUserReactions(prev => ({ ...prev, ...clearedReactions }));
      }
    } catch (err) {
      console.error('Error fetching batch reactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reactions');
    } finally {
      setIsLoading(false);
    }
  }, [addBatchManagedImage]); // Include addBatchManagedImage dependency

  const addReaction = useCallback(async (imageId: string, type: ReactionType) => {
    if (!isAuthenticatedRef.current) return;

    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add reaction');
      }

      // Update local state optimistically
      setUserReactions(prev => ({ ...prev, [imageId]: type }));
      setReactionCounts(prev => {
        const current = prev[imageId] || { like: 0, heart: 0, wow: 0 };
        const newCounts = { ...current };
        
        // Remove old reaction count if switching
        const oldReaction = userReactions[imageId];
        if (oldReaction && oldReaction !== type) {
          newCounts[oldReaction] = Math.max(0, newCounts[oldReaction] - 1);
        }
        
        // Add new reaction count
        newCounts[type] = newCounts[type] + 1;
        
        return { ...prev, [imageId]: newCounts };
      });

    } catch (err) {
      console.error('Error adding reaction:', err);
      // Could implement rollback here if needed
    }
  }, [userReactions]); // Only depend on userReactions state

  const removeReaction = useCallback(async (imageId: string) => {
    if (!isAuthenticatedRef.current || !userReactions[imageId]) return;

    try {
      const response = await fetch('/api/reactions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove reaction');
      }

      // Update local state optimistically
      const oldReaction = userReactions[imageId];
      setUserReactions(prev => ({ ...prev, [imageId]: undefined }));
      setReactionCounts(prev => {
        const current = prev[imageId] || { like: 0, heart: 0, wow: 0 };
        const newCounts = { ...current };
        newCounts[oldReaction!] = Math.max(0, newCounts[oldReaction!] - 1);
        return { ...prev, [imageId]: newCounts };
      });

    } catch (err) {
      console.error('Error removing reaction:', err);
      // Could implement rollback here if needed
    }
  }, [userReactions]); // Only depend on userReactions state

  return {
    reactionCounts,
    userReactions,
    isLoading,
    error,
    fetchBatchReactions,
    addReaction,
    removeReaction,
  };
}
