"use client";

import OptimizedImage from "@/components/OptimizedImage";
import ReactionBar from "@/components/ReactionBar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import type { ReactionType } from "@/lib/constants";
import { formatImageDate } from "@/lib/utils/date";
import { renderFormattedDescription } from "@/lib/utils/text";
import type { ImageWithReactions, ReactionCounts } from "@/types";
import {
  EyeIcon,
  UserIcon as UserIconOutline,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Address } from "./Address";

interface ImageCardProps {
  image: ImageWithReactions;
  onImageClick?: (image: ImageWithReactions) => void;
  style?: React.CSSProperties;
  // Reaction data (optional - for batch optimization)
  reactionCounts?: ReactionCounts;
  userReaction?: ReactionType;
  onReactionChange?: (type: ReactionType) => Promise<void>;
  isAuthenticated?: boolean;
  showAuthor?: boolean;
  showReactions?: boolean;
  showViewCount?: boolean;
}

export default function ImageCard({
  image,
  onImageClick,
  style,
  reactionCounts,
  userReaction,
  onReactionChange,
  isAuthenticated = true,
  showAuthor = true,
  showReactions = true,
  showViewCount = true,
}: ImageCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();

  // Check if current user owns this image
  // Also check if we're still loading user data
  const isOwner = !userLoading && user && image.author?.id === user.id;

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (image.author?.id) {
      router.push(`/profile/${image.author.id}`);
    }
  };

  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(image);
    }
  };

  // Carousel layout classes
  const containerClasses =
    "w-full h-full flex flex-col aspect-[4/3] mb-8";

  const imageClasses = "w-full aspect-[4/3] object-cover";

  const descriptionClasses =
    "text-white text-sm mb-2 text-story font-smooth break-words line-clamp-2 whitespace-pre-line";
  const addressIconSize = "w-4 h-4";
  const addressIconMargin = "mr-2";
  const dateClasses = "text-white/70 text-sm text-meta font-smooth";

  return (
    <div style={style} className={containerClasses}>
      {/* 1. Profile with created date/time */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {/* Author */}
          {showAuthor && image.author && (
            <button
              onClick={handleAuthorClick}
              className="flex items-center space-x-2 hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
            >
              {image.author.avatarUrl ? (
                <OptimizedImage
                  src={image.author.avatarUrl}
                  alt={image.author.name || t.profile.author}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <UserIconOutline className="w-6 h-6" />
              )}
              <span className="text-sm text-meta font-smooth">
                {isOwner ? t.profile.you : image.author.name || t.profile.member}
              </span>
            </button>
          )}
        </div>
        <div className={dateClasses}>
          {formatImageDate(image.createdAt)}
        </div>
      </div>

      {/* 2. Image Section */}
      <div
        className="relative w-full cursor-pointer mb-3"
        onClick={handleImageClick}
      >
        <OptimizedImage
          src={image.url}
          alt={image.description || t.profile.checkpointImage}
          className={imageClasses}
          objectFit="cover"
          fallbackSrc="/placeholder-image.svg"
        />
      </div>

      {/* 3. Reactions with Views */}
      <div className="flex items-center justify-between mb-3">
        {/* Reaction Bar */}
        {showReactions && (
          <div className="flex-1">
            <ReactionBar
              imageId={image.id}
              reactionCounts={reactionCounts}
              userReaction={userReaction}
              onReactionChange={onReactionChange}
              disabled={!isAuthenticated}
            />
          </div>
        )}
        {/* View Count */}
        {showViewCount && (
          <div className="flex items-center text-white/70 ml-4">
            <EyeIcon className="w-4 h-4 mr-1" />
            <span className="text-sm text-meta font-smooth">
              {image.viewCount || 0}
            </span>
          </div>
        )}
      </div>

      {/* 4. Address (truncated) */}
      <div className="mb-3">
        <Address
          image={image}
          addressIconSize={addressIconSize}
          addressIconMargin={addressIconMargin}
          addressTextClassName="truncate w-3/4"
        />
      </div>

      {/* 5. Description (truncated) */}
      {image.description && (
        <p className={descriptionClasses}>
          {renderFormattedDescription(image.description)}
        </p>
      )}
    </div>
  );
}
