"use client";

import { useReactionContext } from "@/contexts/ReactionContext";
import { useUser } from "@/contexts/UserContext";
import { DEFAULT_REACTION, type ReactionType } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { ReactionCounts } from "@/types";
import { useCallback, useEffect, useState } from "react";

interface UseReactionsProps {
  imageId: string;
  initialCounts?: ReactionCounts;
  initialUserReaction?: ReactionType;
  canFetchOne?: boolean;
}

interface UseReactionsReturn {
  reactionCounts: ReactionCounts;
  userReaction?: ReactionType;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  addReaction: (type: ReactionType) => Promise<void>;
  removeReaction: () => Promise<void>;
  refreshReactions: () => Promise<void>;
}

export function useReactions({
  imageId,
  initialCounts = DEFAULT_REACTION,
  initialUserReaction,
  canFetchOne = false,
}: UseReactionsProps): UseReactionsReturn {
  const [reactionCounts, setReactionCounts] =
    useState<ReactionCounts>(initialCounts);
  const [userReaction, setUserReaction] = useState<ReactionType | undefined>(
    initialUserReaction
  );
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Store original values for rollback
  const [originalCounts, setOriginalCounts] =
    useState<ReactionCounts>(initialCounts);
  const [originalUserReaction, setOriginalUserReaction] = useState<
    ReactionType | undefined
  >(initialUserReaction);

  // Track if we're in the middle of an optimistic update
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false);

  const supabase = createClient();
  const { isBatchManaged } = useReactionContext();
  const { user } = useUser();

  // Update authentication state when user context changes
  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const fetchReactionCounts = useCallback(async () => {
    if (!imageId?.trim()) {
      console.log("Skipping fetchReactionCounts: empty imageId");
      return;
    }

    // Skip if this image is being managed by batch hook
    if (isBatchManaged(imageId) && !canFetchOne) {
      console.log("Skipping fetchReactionCounts: image is batch managed");
      return;
    }

    try {
      // Use batch API even for single image to be consistent
      const response = await fetch(`/api/reactions/counts?imageIds=${imageId}`);
      if (!response.ok) throw new Error("Failed to fetch reaction counts");

      const data = await response.json();

      setReactionCounts(data.counts[imageId] || DEFAULT_REACTION);
    } catch (err) {
      console.error("Error fetching reaction counts:", err);
      setError("Failed to fetch reaction counts");
    }
  }, [imageId, isBatchManaged, canFetchOne]);

  const fetchUserReaction = useCallback(async () => {
    console.log("imageId", imageId?.trim());

    if (!imageId?.trim()) {
      console.log("Skipping fetchUserReaction: empty imageId");
      return;
    }

    // Skip if this image is being managed by batch hook
    if (isBatchManaged(imageId) && !canFetchOne) {
      console.log("Skipping fetchUserReaction: image is batch managed");
      return;
    }

    try {
      // Use batch API even for single image to be consistent
      const response = await fetch(`/api/reactions/user?imageIds=${imageId}`);
      if (!response.ok) throw new Error("Failed to fetch user reaction");

      const data = await response.json();
      // Extract reaction for this specific image
      setUserReaction(data.reaction?.type || undefined);
    } catch (err) {
      console.error("Error fetching user reaction:", err);
    }
  }, [imageId, isBatchManaged, canFetchOne]);

  // Fetch initial data
  useEffect(() => {
    fetchReactionCounts();
    fetchUserReaction();
  }, [fetchReactionCounts, fetchUserReaction]);

  // Subscribe to real-time updates for reactions
  useEffect(() => {
    if (!imageId) return;

    console.log("Setting up real-time subscription for image:", imageId);

    const channel = supabase
      .channel(`reactions:${imageId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reactions",
          filter: `image_id=eq.${imageId}`,
        },
        async (payload) => {
          console.log("Real-time reaction update received:", payload);

          // Skip real-time updates if we're in the middle of an optimistic update
          if (isOptimisticUpdate) {
            console.log(
              "Skipping real-time update due to optimistic update in progress"
            );
            return;
          }

          // Refetch data to get latest counts and user reaction
          await fetchReactionCounts();
          await fetchUserReaction();
        }
      )
      .subscribe((status) => {
        console.log("Real-time subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to real-time reactions");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Failed to subscribe to real-time reactions");
        }
      });

    return () => {
      console.log("Cleaning up real-time subscription for image:", imageId);
      supabase.removeChannel(channel);
    };
  }, [
    imageId,
    fetchReactionCounts,
    fetchUserReaction,
    isOptimisticUpdate,
    supabase,
  ]);

  // Fallback polling mechanism (every 30 seconds) in case real-time fails
  useEffect(() => {
    if (!imageId) return;

    const interval = setInterval(async () => {
      // Skip polling if we're in the middle of an optimistic update
      if (isOptimisticUpdate) return;

      console.log("Polling for reaction updates...");
      await fetchReactionCounts();
      await fetchUserReaction();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [imageId, fetchReactionCounts, fetchUserReaction, isOptimisticUpdate]);

  const addReaction = useCallback(
    async (type: ReactionType) => {
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
        const response = await fetch("/api/reactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageId,
            type,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add reaction");
        }

        // API call successful, clear optimistic update flag
        setIsOptimisticUpdate(false);
      } catch (err) {
        // Rollback on error
        setReactionCounts(originalCounts);
        setUserReaction(originalUserReaction);
        setError(err instanceof Error ? err.message : "Failed to add reaction");
        setIsOptimisticUpdate(false);
      }
    },
    [
      imageId,
      isLoading,
      reactionCounts,
      userReaction,
      originalCounts,
      originalUserReaction,
      isAuthenticated,
    ]
  );

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
      const response = await fetch("/api/reactions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove reaction");
      }

      // API call successful, clear optimistic update flag
      setIsOptimisticUpdate(false);
    } catch (err) {
      // Rollback on error
      setReactionCounts(originalCounts);
      setUserReaction(originalUserReaction);
      setError(
        err instanceof Error ? err.message : "Failed to remove reaction"
      );
      setIsOptimisticUpdate(false);
    }
  }, [
    imageId,
    isLoading,
    userReaction,
    reactionCounts,
    originalCounts,
    originalUserReaction,
    isAuthenticated,
  ]);

  const refreshReactions = useCallback(async () => {
    await Promise.all([fetchReactionCounts(), fetchUserReaction()]);
  }, [fetchReactionCounts, fetchUserReaction]);

  return {
    reactionCounts,
    userReaction,
    isLoading,
    error,
    isAuthenticated,
    addReaction,
    removeReaction,
    refreshReactions,
  };
}
