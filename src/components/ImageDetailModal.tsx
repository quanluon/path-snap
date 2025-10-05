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
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import {
  EyeIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
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
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);

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
      setShowPreview(false);
      setShowDeleteModal(false);
      // Reset all transformations when modal closes
      setZoom(1);
      setRotation(0);
      setFlipHorizontal(false);
      setFlipVertical(false);
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

  const handleImageClick = useCallback(() => {
    setShowPreview(true);
  }, []);

  const handlePreviewClose = useCallback(() => {
    setShowPreview(false);
    // Reset all transformations when closing
    setZoom(1);
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleFlipHorizontal = useCallback(() => {
    setFlipHorizontal(prev => !prev);
  }, []);

  const handleFlipVertical = useCallback(() => {
    setFlipVertical(prev => !prev);
  }, []);

  const handleResetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
  }, []);

  // Keyboard shortcuts for preview
  useEffect(() => {
    if (!showPreview) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleRotate();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          handleFlipHorizontal();
          break;
        case 'v':
        case 'V':
          e.preventDefault();
          handleFlipVertical();
          break;
        case '0':
          e.preventDefault();
          handleResetTransform();
          break;
        case 'Escape':
          e.preventDefault();
          handlePreviewClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPreview, handleZoomIn, handleZoomOut, handleRotate, handleFlipHorizontal, handleFlipVertical, handleResetTransform, handlePreviewClose]);

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-6xl overflow-hidden text-left align-middle transition-all transform bg-black rounded-2xl shadow-2xl border border-white/10">
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
            <div
              className="relative bg-green flex items-center justify-center cursor-pointer hover:bg-green-light transition-colors group aspect-[4/3]"
              onClick={handleImageClick}
            >
              <OptimizedImage
                src={image.url}
                alt={image.description || t.image.checkPointImage}
                className="w-full h-full object-contain"
                objectFit="contain"
                fallbackSrc="/placeholder-image.svg"
              />
              {/* Click to preview overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <div className="bg-black/80 backdrop-blur-sm rounded-full p-3">
                  <MagnifyingGlassIcon className="w-6 h-6 text-white" />
                </div>
              </div>
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

      {/* Full-screen Image Preview */}
      {showPreview && (
        <div className="fixed inset-0 z-[110] overflow-hidden">
          {/* Blurred Background Image */}
          <div className="absolute inset-0">
            <OptimizedImage
              src={image.url}
              alt={image.description || t.image.checkPointImage}
              className="w-full h-full object-cover"
              objectFit="cover"
              fallbackSrc="/placeholder-image.svg"
            />
            {/* Blur Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
          </div>

          {/* Top Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-black/80 backdrop-blur-sm rounded-full p-1">
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Zoom Out"
              >
                <ArrowsPointingInIcon className="w-5 h-5 text-white" />
              </button>
              <span className="px-2 text-white text-sm font-medium min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Zoom In"
              >
                <ArrowsPointingOutIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Transform Controls */}
            <div className="flex items-center space-x-1 bg-black/80 backdrop-blur-sm rounded-full p-1">
              <button
                onClick={handleRotate}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Rotate"
              >
                <ArrowPathIcon className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleFlipHorizontal}
                className={`p-2 rounded-full hover:bg-white/10 transition-colors ${flipHorizontal ? 'bg-white/20' : ''}`}
                title="Flip Horizontal"
              >
                <ArrowUturnLeftIcon className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleFlipVertical}
                className={`p-2 rounded-full hover:bg-white/10 transition-colors ${flipVertical ? 'bg-white/20' : ''}`}
                title="Flip Vertical"
              >
                <ArrowPathIcon className="w-5 h-5 text-white transform rotate-90" />
              </button>
              <button
                onClick={handleResetTransform}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Reset"
              >
                <span className="text-white text-sm font-bold">↺</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={handlePreviewClose}
              className="p-3 bg-black/80 backdrop-blur-sm rounded-full hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Full-screen Image */}
          <div className="relative z-10 flex items-center justify-center h-full p-4 overflow-hidden">
            <div
              className="transition-transform duration-200 ease-out"
              style={{
                transform: `
                  scale(${zoom}) 
                  rotate(${rotation}deg) 
                  scaleX(${flipHorizontal ? -1 : 1}) 
                  scaleY(${flipVertical ? -1 : 1})
                `,
                cursor: zoom > 1 ? 'grab' : 'default',
              }}
            >
              <OptimizedImage
                src={image.url}
                alt={image.description || t.image.checkPointImage}
                className="object-contain shadow-2xl"
                objectFit="contain"
                fallbackSrc="/placeholder-image.svg"
              />
            </div>
          </div>

          {/* Image Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6">
            <div className="text-center">
              <h3 className="text-white text-lg font-medium mb-2">
                {image.description || t.image.checkPointImage}
              </h3>
              {image.author && (
                <p className="text-white/70 text-sm">
                  by {image.author.name || t.image.member}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
