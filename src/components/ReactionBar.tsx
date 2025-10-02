'use client';

import { useState } from 'react';
import ReactionButton from './ReactionButton';
import { REACTION_TYPES, type ReactionType } from '@/lib/constants';
import type { ReactionCounts } from '@/types';

interface ReactionBarProps {
  imageId: string;
  reactionCounts: ReactionCounts;
  userReaction?: ReactionType;
  onReactionChange: (type: ReactionType) => Promise<void>;
  disabled?: boolean;
}

export default function ReactionBar({
  imageId,
  reactionCounts,
  userReaction,
  onReactionChange,
  disabled = false
}: ReactionBarProps) {
  const handleReactionClick = async (type: ReactionType) => {
    if (disabled) return;

    try {
      await onReactionChange(type);
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <ReactionButton
        type={REACTION_TYPES.LIKE}
        count={reactionCounts.like}
        isActive={userReaction === REACTION_TYPES.LIKE}
        onClick={handleReactionClick}
        disabled={disabled}
        isUnauthenticated={disabled}
      />
      
      <ReactionButton
        type={REACTION_TYPES.HEART}
        count={reactionCounts.heart}
        isActive={userReaction === REACTION_TYPES.HEART}
        onClick={handleReactionClick}
        disabled={disabled}
        isUnauthenticated={disabled}
      />
      
      <ReactionButton
        type={REACTION_TYPES.WOW}
        count={reactionCounts.wow}
        isActive={userReaction === REACTION_TYPES.WOW}
        onClick={handleReactionClick}
        disabled={disabled}
        isUnauthenticated={disabled}
      />
    </div>
  );
}
