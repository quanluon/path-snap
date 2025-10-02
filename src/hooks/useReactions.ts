'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { REACTION_TYPES, type ReactionType } from '@/lib/constants';
import type { ReactionCounts } from '@/types';

interface UseReactionsProps {
  imageId: string;
  initialCounts?: ReactionCounts;
  initialUserReaction?: ReactionType;
}

interface UseReactionsReturn {
  reactionCounts: ReactionCounts;
  userReaction?: ReactionType;
  isLoading: boolean;
  error: string | null;
  addReaction: (type: ReactionType) => Promise<void>;
  removeReaction: () => Promise<void>;
}

export function useReactions({
  imageId,
  initialCounts = { like: 0, heart: 0, wow: 0 },
  initialUserReaction
}: UseReactionsProps): UseReactionsReturn {
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>(initialCounts);
  const [userReaction, setUserReaction] = useState<ReactionType | undefined>(initialUserReaction);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Subscribe to real-time updates for reactions
  useEffect(() => {
    const channel = supabase
      .channel(`reactions:${imageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `image_id=eq.${imageId}`,
        },
        async (payload) => {
          // Refetch reaction counts when reactions change
          await fetchReactionCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [imageId, supabase]);

  const fetchReactionCounts = useCallback(async () => {
    try {
      const response = await fetch(`/api/reactions/counts?imageId=${imageId}`);
      if (!response.ok) throw new Error('Failed to fetch reaction counts');
      
      const data = await response.json();
      setReactionCounts(data.counts);
    } catch (err) {
      console.error('Error fetching reaction counts:', err);
      setError('Failed to fetch reaction counts');
    }
  }, [imageId]);

  const fetchUserReaction = useCallback(async () => {
    try {
      const response = await fetch(`/api/reactions/user?imageId=${imageId}`);
      if (!response.ok) throw new Error('Failed to fetch user reaction');
      
      const data = await response.json();
      setUserReaction(data.reaction?.type || undefined);
    } catch (err) {
      console.error('Error fetching user reaction:', err);
    }
  }, [imageId]);

  // Fetch initial data
  useEffect(() => {
    fetchReactionCounts();
    fetchUserReaction();
  }, [fetchReactionCounts, fetchUserReaction]);

  const addReaction = useCallback(async (type: ReactionType) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

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

      const data = await response.json();
      setUserReaction(data.reaction.type);
      
      // Update counts optimistically
      const newCounts = { ...reactionCounts };
      if (userReaction && userReaction !== type) {
        // Remove old reaction count
        newCounts[userReaction] = Math.max(0, newCounts[userReaction] - 1);
      }
      // Add new reaction count
      newCounts[type] = newCounts[type] + 1;
      setReactionCounts(newCounts);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reaction');
    } finally {
      setIsLoading(false);
    }
  }, [imageId, isLoading, reactionCounts, userReaction]);

  const removeReaction = useCallback(async () => {
    if (isLoading || !userReaction) return;

    setIsLoading(true);
    setError(null);

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

      // Update counts optimistically
      const newCounts = { ...reactionCounts };
      newCounts[userReaction] = Math.max(0, newCounts[userReaction] - 1);
      setReactionCounts(newCounts);
      setUserReaction(undefined);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove reaction');
    } finally {
      setIsLoading(false);
    }
  }, [imageId, isLoading, userReaction, reactionCounts]);

  return {
    reactionCounts,
    userReaction,
    isLoading,
    error,
    addReaction,
    removeReaction,
  };
}
