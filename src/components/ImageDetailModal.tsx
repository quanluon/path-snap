"use client";

import CommentsSection from "@/components/CommentsSection";
import ConfirmModal from "@/components/ConfirmModal";
import OptimizedImage from "@/components/OptimizedImage";
import ReactionBar from "@/components/ReactionBar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { useDeleteImage } from "@/hooks/useDeleteImage";
import { useImageView } from "@/hooks/useImageView";
import { useReactions } from "@/hooks/useReactions";
import { DEFAULT_REACTION, type ReactionType } from "@/lib/constants";
import { formatImageDate } from "@/lib/utils/date";
import { renderFormattedDescription } from "@/lib/utils/text";
import type { ImageWithReactions } from "@/types";
import {
  ArrowDownTrayIcon,
  CalendarIcon,
  ShareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  EyeIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Address } from "./Address";

interface ImageDetailModalProps {
  image: ImageWithReactions | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageDetailModal({
  image,
  isOpen,
  onClose,
}: ImageDetailModalProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Check if current user owns this image
  const isOwner = !userLoading && user && image?.author?.id === user.id;

  const { deleteImage, isDeleting } = useDeleteImage({
    onSuccess: () => {
      setShowDeleteModal(false);
      onClose();
    },
    onError: (error) => {
      console.error("Delete error:", error);
    },
  });

  const {
    reactionCounts,
    userReaction,
    addReaction,
    removeReaction,
    isAuthenticated,
    refreshReactions,
  } = useReactions({
    imageId: image?.id || "",
    initialCounts: image?.reactionCounts || DEFAULT_REACTION,
    initialUserReaction: image?.userReaction,
    canFetchOne: true,
  });

  // Track view when modal is opened
  useImageView({ imageId: image?.id || "", enabled: isOpen && !!image });

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowDeleteModal(false);
    }
  }, [isOpen]);

  // Refresh reaction counts when modal opens
  useEffect(() => {
    if (isOpen && image?.id) {
      refreshReactions();
    }
  }, [isOpen, image?.id, refreshReactions]);

  const handleReactionChange = useCallback(
    async (type: ReactionType) => {
      if (userReaction === type) {
        await removeReaction();
      } else {
        await addReaction(type);
      }
    },
    [userReaction, addReaction, removeReaction]
  );

  const handleAuthorClick = useCallback(() => {
    if (image?.author?.id) {
      router.push(`/profile/${image.author.id}`);
      onClose();
    }
  }, [image?.author?.id, router, onClose]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setShowDeleteModal(true);
    },
    []
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!image) return;
    await deleteImage(image.id);
  }, [image, deleteImage]);

  const handleShare = useCallback(async () => {
    if (!image) return;

    const imageUrl = `${window.location.origin}/image/${image.id}`;
    const shareText = image.description || t.image.checkOutImage;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t.image.checkPointImage,
          text: shareText,
          url: imageUrl,
        });
      } catch (error) {
        console.log("Error sharing:", error);
        try {
          await navigator.clipboard.writeText(imageUrl);
        } catch (clipboardError) {
          console.log("Clipboard error:", clipboardError);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(imageUrl);
      } catch (error) {
        console.log("Clipboard error:", error);
      }
    }
  }, [image, t]);

  const handleDownload = useCallback(async () => {
    if (!image) return;

    try {
      const response = await fetch(image.url);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const description = image.description
        ? image.description.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)
        : "checkpoint";
      const filename = `checkpoint_${description}_${timestamp}.jpg`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
      window.open(image.url, "_blank");
    }
  }, [image]);


  if (!isOpen || !image) return null;

  return (
    <div 
      className="fixed inset-0 overflow-y-auto" 
      style={{ 
        zIndex: 9999,
        isolation: 'isolate',
        WebkitTransform: 'translateZ(0)', // Force hardware acceleration on Safari
        transform: 'translateZ(0)'
      }}
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black/90 backdrop-blur-sm"
          style={{ 
            zIndex: -1,
            WebkitBackdropFilter: 'blur(4px)', // Safari-specific backdrop filter
            backdropFilter: 'blur(4px)'
          }}
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-6xl overflow-hidden text-left align-middle transition-all transform bg-black rounded-2xl shadow-2xl border border-white/10" style={{ zIndex: 1 }}>
          {/* Action Buttons */}
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            {/* Delete Button - Only show if user owns the image */}
            {isOwner && (
              <button
                onClick={handleDeleteClick}
                className="p-3 bg-red-600/80 backdrop-blur-sm rounded-full hover:bg-red-600 transition-colors"
                title={t.image.deleteImage}
              >
                <TrashIcon className="w-6 h-6 text-white" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-3 bg-black/80 backdrop-blur-sm rounded-full hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[90vh]">
            {/* Image Section */}
            <div className="relative bg-green flex items-center justify-center aspect-[4/3]">
              <Zoom>
                <OptimizedImage
                  src={image.url}
                  alt={image.description || t.image.checkPointImage}
                  className="w-full h-full object-contain cursor-zoom-in"
                  objectFit="contain"
                  fallbackSrc="/placeholder-image.svg"
                />
              </Zoom>
            </div>

            {/* Details Section */}
            <div className="p-6 lg:p-8 overflow-y-auto max-h-[90vh] bg-gradient-to-b from-black to-gray-900">
              {/* Header with Actions */}
              <div className="flex items-center justify-between mb-6">
                {/* Author Section */}
                {image.author && (
                  <button
                    onClick={handleAuthorClick}
                    className="flex items-center space-x-3 hover:bg-white/10 rounded-xl transition-colors w-full text-left"
                  >
                    {image.author.avatarUrl ? (
                      <OptimizedImage
                        src={image.author.avatarUrl}
                        alt={image.author.name || t.image.author}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        objectFit="cover"
                        fallbackSrc="/placeholder-image.svg"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">
                        {image.author.name || t.image.anonymous}
                      </p>
                      <p className="text-white/60 text-sm">{t.image.member}</p>
                    </div>
                  </button>
                )}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownload}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    title={t.image.downloadImage}
                  >
                    <ArrowDownTrayIcon className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    title={t.image.shareImage}
                  >
                    <ShareIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Location Section */}
              <div className="mb-6">
                <div className="flex items-start space-x-2">
                  <Address
                    image={image}
                    addressIconSize="w-4 h-4"
                    addressIconMargin="mr-2"
                  />
                </div>
              </div>

              {/* Description Section */}
              {image.description && (
                <div className="mb-6">
                  <p className="text-story text-white leading-relaxed whitespace-pre-line">
                    {renderFormattedDescription(image.description)}
                  </p>
                </div>
              )}

              {/* Stats Section */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {/* View Count */}
                {image.viewCount !== undefined && (
                  <div className="flex items-center text-white/70">
                    <EyeIcon className="w-5 h-5 mr-2" />
                    <span className="text-meta">
                      {image.viewCount.toLocaleString()} views
                    </span>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center text-white/70">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  <span className="text-meta">
                    {formatImageDate(image.createdAt)}
                  </span>
                </div>
              </div>

              {/* Reactions Section */}
              <div className="mb-6">
                <ReactionBar
                  imageId={image.id}
                  reactionCounts={reactionCounts}
                  userReaction={userReaction}
                  onReactionChange={handleReactionChange}
                  disabled={!isAuthenticated}
                />
              </div>

              {/* Comments Section */}
              <div className="mb-6">
                <CommentsSection imageId={image.id} />
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title={t.image.deleteImage}
        message={t.image.deleteConfirmMessage}
        confirmText={t.image.deleteConfirm}
        cancelText={t.image.cancel}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
