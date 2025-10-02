'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { REACTION_TYPES, type ReactionType } from '@/lib/constants';
import type { ReactionCounts } from '@/types';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const fetchBatchReactions = useCallback(async (imageIds: string[]) => {
    if (imageIds.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch reaction counts for all images in one request
      const countsResponse = await fetch(`/api/reactions/counts?imageIds=${imageIds.join(',')}`);
      if (!countsResponse.ok) throw new Error('Failed to fetch reaction counts');
      
      const countsData = await countsResponse.json();
      setReactionCounts(countsData.counts);

      // Fetch user reactions if authenticated
      if (isAuthenticated) {
        const userResponse = await fetch(`/api/reactions/user?imageIds=${imageIds.join(',')}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const userReactionsMap: Record<string, ReactionType | undefined> = {};
          
          imageIds.forEach(imageId => {
            userReactionsMap[imageId] = userData.reactions?.[imageId]?.type || undefined;
          });
          
          setUserReactions(prev => ({ ...prev, ...userReactionsMap }));
        } else if (userResponse.status === 401) {
          // User not authenticated, clear all user reactions
          const clearedReactions: Record<string, ReactionType | undefined> = {};
          imageIds.forEach(imageId => {
            clearedReactions[imageId] = undefined;
          });
          setUserReactions(prev => ({ ...prev, ...clearedReactions }));
        }
      } else {
        // Not authenticated, clear user reactions for these images
        const clearedReactions: Record<string, ReactionType | undefined> = {};
        imageIds.forEach(imageId => {
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
  }, [isAuthenticated]);

  const addReaction = useCallback(async (imageId: string, type: ReactionType) => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated, userReactions]);

  const removeReaction = useCallback(async (imageId: string) => {
    if (!isAuthenticated || !userReactions[imageId]) return;

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
  }, [isAuthenticated, userReactions]);

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
