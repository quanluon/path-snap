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
  isAuthenticated: boolean;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Store original values for rollback
  const [originalCounts, setOriginalCounts] = useState<ReactionCounts>(initialCounts);
  const [originalUserReaction, setOriginalUserReaction] = useState<ReactionType | undefined>(initialUserReaction);
  
  // Track if we're in the middle of an optimistic update
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false);

  const supabase = createClient();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const fetchReactionCounts = useCallback(async () => {
    if (!imageId || imageId.trim() === '') {
      console.log('Skipping fetchReactionCounts: empty imageId');
      return;
    }

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
    // Only fetch user reaction if authenticated
    if (!isAuthenticated) {
      setUserReaction(undefined);
      return;
    }

    try {
      const response = await fetch(`/api/reactions/user?imageId=${imageId}`);
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, clear reaction
          setUserReaction(undefined);
          return;
        }
        throw new Error('Failed to fetch user reaction');
      }
      
      const data = await response.json();
      setUserReaction(data.reaction?.type || undefined);
    } catch (err) {
      console.error('Error fetching user reaction:', err);
      // Don't set error state for user reactions as it's not critical
    }
  }, [imageId, isAuthenticated]);

  // Fetch initial data
  useEffect(() => {
    fetchReactionCounts();
    fetchUserReaction();
  }, [fetchReactionCounts, fetchUserReaction]);

  // Subscribe to real-time updates for reactions
  useEffect(() => {
    if (!imageId) return;

    console.log('Setting up real-time subscription for image:', imageId);

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
          console.log('Real-time reaction update received:', payload);
          
          // Skip real-time updates if we're in the middle of an optimistic update
          if (isOptimisticUpdate) {
            console.log('Skipping real-time update due to optimistic update in progress');
            return;
          }
          
          // Refetch data to get latest counts and user reaction
          await fetchReactionCounts();
          // Only fetch user reaction if authenticated
          if (isAuthenticated) {
            await fetchUserReaction();
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time reactions');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to real-time reactions');
        }
      });

    return () => {
      console.log('Cleaning up real-time subscription for image:', imageId);
      supabase.removeChannel(channel);
    };
  }, [imageId, fetchReactionCounts, fetchUserReaction, isOptimisticUpdate]);

  // Fallback polling mechanism (every 30 seconds) in case real-time fails
  useEffect(() => {
    if (!imageId) return;

    const interval = setInterval(async () => {
      // Skip polling if we're in the middle of an optimistic update
      if (isOptimisticUpdate) return;
      
      console.log('Polling for reaction updates...');
      await fetchReactionCounts();
      // Only fetch user reaction if authenticated
      if (isAuthenticated) {
        await fetchUserReaction();
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [imageId, fetchReactionCounts, fetchUserReaction, isOptimisticUpdate, isAuthenticated]);

  const addReaction = useCallback(async (type: ReactionType) => {
    if (isLoading || !isAuthenticated) return;

    // Set optimistic update flag
    setIsOptimisticUpdate(true);

    // Store current state for rollback
    setOriginalCounts(reactionCounts);
    setOriginalUserReaction(userReaction);

    // Optimistic update - update UI immediately
    const newCounts = { ...reactionCounts };
    if (userReaction && userReaction !== type) {
      // Remove old reaction count
      newCounts[userReaction] = Math.max(0, newCounts[userReaction] - 1);
    }
    // Add new reaction count
    newCounts[type] = newCounts[type] + 1;
    
    setReactionCounts(newCounts);
    setUserReaction(type);
    setError(null);

    // Make API call in background
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

      // API call successful, clear optimistic update flag
      setIsOptimisticUpdate(false);

    } catch (err) {
      // Rollback on error
      setReactionCounts(originalCounts);
      setUserReaction(originalUserReaction);
      setError(err instanceof Error ? err.message : 'Failed to add reaction');
      setIsOptimisticUpdate(false);
    }
  }, [imageId, isLoading, reactionCounts, userReaction, originalCounts, originalUserReaction]);

  const removeReaction = useCallback(async () => {
    if (isLoading || !userReaction || !isAuthenticated) return;

    // Set optimistic update flag
    setIsOptimisticUpdate(true);

    // Store current state for rollback
    setOriginalCounts(reactionCounts);
    setOriginalUserReaction(userReaction);

    // Optimistic update - update UI immediately
    const newCounts = { ...reactionCounts };
    newCounts[userReaction] = Math.max(0, newCounts[userReaction] - 1);
    
    setReactionCounts(newCounts);
    setUserReaction(undefined);
    setError(null);

    // Make API call in background
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

      // API call successful, clear optimistic update flag
      setIsOptimisticUpdate(false);

    } catch (err) {
      // Rollback on error
      setReactionCounts(originalCounts);
      setUserReaction(originalUserReaction);
      setError(err instanceof Error ? err.message : 'Failed to remove reaction');
      setIsOptimisticUpdate(false);
    }
  }, [imageId, isLoading, userReaction, reactionCounts, originalCounts, originalUserReaction, isAuthenticated]);

  return {
    reactionCounts,
    userReaction,
    isLoading,
    error,
    isAuthenticated,
    addReaction,
    removeReaction,
  };
}
