'use client';

import ImageCard from '@/components/ImageCard';
import { useImageView } from '@/hooks/useImageView';
import { useReactions } from '@/hooks/useReactions';
import type { ImageWithReactions, ReactionCounts } from '@/types';
import type { ReactionType } from '@/lib/constants';

interface ImageItemProps {
  image: ImageWithReactions;
  onImageClick?: (image: ImageWithReactions) => void;
  style?: React.CSSProperties;
  // Optional batch reaction data
  reactionCounts?: ReactionCounts;
  userReaction?: ReactionType;
  onReactionChange?: (type: ReactionType) => Promise<void>;
  isAuthenticated?: boolean;
}

export default function ImageItem({ 
  image, 
  onImageClick, 
  style,
  reactionCounts: propReactionCounts,
  userReaction: propUserReaction,
  onReactionChange,
  isAuthenticated = true
}: ImageItemProps) {
  // Use individual hook as fallback when batch data is not provided
  const individualHook = useReactions({
    imageId: image.id,
    initialCounts: propReactionCounts ? undefined : image.reactionCounts,
    initialUserReaction: propReactionCounts ? undefined : image.userReaction,
  });

  // Use batch data if provided, otherwise fall back to individual hook
  const reactionCounts = propReactionCounts || individualHook.reactionCounts;
  const userReaction = propUserReaction !== undefined ? propUserReaction : individualHook.userReaction;
  const addReaction = onReactionChange || individualHook.addReaction;
  const removeReaction = individualHook.removeReaction;
  const finalIsAuthenticated = isAuthenticated !== undefined ? isAuthenticated : individualHook.isAuthenticated;

  // Track view when image is displayed
  useImageView({ imageId: image.id });

  const handleReactionChange = async (type: ReactionType) => {
    if (onReactionChange) {
      await onReactionChange(type);
    } else {
      // Use individual hook if no batch handler provided
      if (userReaction === type) {
        await removeReaction();
      } else {
        await addReaction(type);
      }
    }
  };

  return (
    <ImageCard
      image={image}
      onImageClick={onImageClick}
      style={style}
      reactionCounts={reactionCounts}
      userReaction={userReaction}
      onReactionChange={handleReactionChange}
      isAuthenticated={finalIsAuthenticated}
      variant="carousel"
      showAuthor={true}
      showReactions={true}
      showViewCount={true}
    />
  );
}