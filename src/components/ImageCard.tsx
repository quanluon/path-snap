"use client";

import {
  MapPinIcon,
  UserIcon as UserIconOutline,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OptimizedImage from "@/components/OptimizedImage";
import ReactionBar from "@/components/ReactionBar";
import ConfirmModal from "@/components/ConfirmModal";
import { useDeleteImage } from "@/hooks/useDeleteImage";
import { useUser } from "@/contexts/UserContext";
import { formatImageDate } from "@/lib/utils/date";
import { renderFormattedDescription } from "@/lib/utils/text";
import type { ImageWithReactions, ReactionCounts } from "@/types";
import type { ReactionType } from "@/lib/constants";
import Link from "next/link";
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
  // Layout variants
  variant?: "carousel" | "grid";
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
  variant = "carousel",
  showAuthor = true,
  showReactions = true,
  showViewCount = true,
}: ImageCardProps) {
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

  // Determine layout classes based on variant
  const containerClasses =
    variant === "carousel"
      ? "w-full bg-black"
      : "bg-black/50 rounded-xl overflow-hidden hover:bg-black/70 transition-colors group cursor-pointer";

  const imageClasses =
    variant === "carousel"
      ? "w-full h-full object-cover"
      : "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300";

  const contentClasses =
    variant === "carousel" ? "bg-black p-6 flex-shrink-0" : "p-4";

  const descriptionClasses =
    variant === "carousel"
      ? "text-white text-base mb-4 text-story font-smooth break-words line-clamp-3 whitespace-pre-line"
      : "text-white text-sm mb-3 line-clamp-2 whitespace-pre-line";

  const addressClasses =
    variant === "carousel"
      ? "text-white/70 text-sm text-meta font-smooth mb-3 flex items-center"
      : "flex items-center text-white/60 text-xs mb-3";

  const addressIconSize = variant === "carousel" ? "w-4 h-4" : "w-3 h-3";
  const addressIconMargin = variant === "carousel" ? "mr-2" : "mr-1";

  const dateClasses =
    variant === "carousel"
      ? "text-white/70 text-sm text-meta font-smooth mb-3"
      : "text-white/50 text-xs";

  return (
    <div style={style} className={containerClasses} onClick={handleImageClick}>
      {variant === "carousel" ? (
        <>
          {/* Full-screen carousel layout */}
          <div className="relative w-full h-screen flex flex-col">
            {/* Image Section */}
            <div className="flex-1 relative overflow-hidden">
              <OptimizedImage
                src={image.url}
                alt={image.description || "Checkpoint image"}
                className={imageClasses}
                objectFit="contain"
                fallbackSrc="/placeholder-image.svg"
              />
            </div>

            {/* Text Content Section */}
            <div className={contentClasses}>
              {/* Address */}
              <Address image={image} addressIconSize={addressIconSize} addressIconMargin={addressIconMargin} />

              {/* Description */}
              {image.description && (
                <p className={descriptionClasses}>
                  {renderFormattedDescription(image.description)}
                </p>
              )}

              {/* Author and View Count */}
              <div className="flex items-center justify-between text-white/90">
                <div className="flex items-center space-x-4">
                  {/* Author */}
                  {showAuthor && image.author && (
                    <button
                      onClick={handleAuthorClick}
                      className="flex items-center space-x-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {image.author.avatarUrl ? (
                        <OptimizedImage
                          src={image.author.avatarUrl}
                          alt={image.author.name || "Author"}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <UserIconOutline className="w-6 h-6" />
                      )}
                      <span className="text-sm text-meta font-smooth">
                        {isOwner ? "You" : (image.author.name || "Member")}
                      </span>
                    </button>
                  )}
                </div>

                {/* View Count */}
                {showViewCount &&
                  image.viewCount !== undefined &&
                  image.viewCount > 0 && (
                    <div className="flex items-center text-white/70 py-5">
                      <EyeIcon className="w-4 h-4 mr-1" />
                      <span className="text-sm text-meta font-smooth">
                        {image.viewCount}
                      </span>
                    </div>
                  )}
              </div>

              {/* Timestamp */}
              <div className={dateClasses}>
                {formatImageDate(image.createdAt)}
              </div>

              {/* Reaction Bar */}
              {showReactions && (
                <div>
                  <ReactionBar
                    imageId={image.id}
                    reactionCounts={
                      reactionCounts
                    }
                    userReaction={userReaction}
                    onReactionChange={onReactionChange || (async () => {})}
                    disabled={!isAuthenticated}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Grid layout */}
          <div>
            {/* Image */}
            <div className="aspect-square relative overflow-hidden">
              <OptimizedImage
                src={image.url}
                alt={image.description || "User image"}
                className={imageClasses}
                fallbackSrc="/placeholder-image.svg"
              />
              
            </div>

            {/* Content */}
            <div className={contentClasses}>
              {/* Description */}
              {image.description && (
                <p className={descriptionClasses}>{image.description}</p>
              )}

              {/* Address */}
              <Address image={image} addressIconSize={addressIconSize} addressIconMargin={addressIconMargin} />

              {/* Date */}
              <div className={dateClasses}>
                {formatImageDate(image.createdAt)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
