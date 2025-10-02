'use client';

import { useState } from 'react';
import { XMarkIcon, MapPinIcon, EyeIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { CalendarIcon, ShareIcon } from '@heroicons/react/24/outline';
import OptimizedImage from '@/components/OptimizedImage';
import ReactionBar from '@/components/ReactionBar';
import { useReactions } from '@/hooks/useReactions';
import { useImageView } from '@/hooks/useImageView';
import { useRouter } from 'next/navigation';
import type { ImageWithReactions } from '@/types';

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
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);

  const { reactionCounts, userReaction, addReaction, isAuthenticated } = useReactions({
    imageId: image?.id || '',
    initialCounts: image?.reactionCounts || { like: 0, heart: 0, wow: 0 },
    initialUserReaction: image?.userReaction,
  });

  // Track view when modal is opened
  useImageView({ imageId: image?.id || '', enabled: isOpen && !!image });

  const handleReactionChange = async (type: string) => {
    if (userReaction === type) {
      // If clicking the same reaction, remove it
      return;
    }
    await addReaction(type as 'like' | 'heart' | 'wow');
  };

  const handleAuthorClick = () => {
    if (image?.author?.id) {
      router.push(`/profile/${image.author.id}`);
      onClose();
    }
  };

  const handleShare = async () => {
    if (!image) return;
    
    // Generate the direct image URL
    const imageUrl = `${window.location.origin}/image/${image.id}`;
    const shareText = image.description || 'Check out this checkpoint image!';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Checkpoint Image',
          text: shareText,
          url: imageUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback to clipboard if share fails
        try {
          await navigator.clipboard.writeText(imageUrl);
          // You could show a toast notification here
        } catch (clipboardError) {
          console.log('Clipboard error:', clipboardError);
        }
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(imageUrl);
        // You could show a toast notification here
      } catch (error) {
        console.log('Clipboard error:', error);
      }
    }
  };

  const handleImageClick = () => {
    setShowPreview(true);
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
  };

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-6xl overflow-hidden text-left align-middle transition-all transform bg-black rounded-2xl shadow-2xl border border-white/10">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-3 bg-black/80 backdrop-blur-sm rounded-full hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[80vh]">
            {/* Image */}
            <div 
              className="relative bg-black flex items-center justify-center cursor-pointer hover:bg-gray-900 transition-colors group"
              onClick={handleImageClick}
            >
              <OptimizedImage
                src={image.url}
                alt={image.description || 'Checkpoint image'}
                className="object-contain p-4"
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

            {/* Details */}
            <div className="p-8 overflow-y-auto max-h-[80vh] bg-gradient-to-b from-black to-gray-900">
              {/* Header */}
              <div className="">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-display text-white text-2xl font-bold">
                    Checkpoint Details
                  </h2>
                  <button
                    onClick={handleShare}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <ShareIcon className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Author */}
                {image.author && (
                  <button
                    onClick={handleAuthorClick}
                    className="flex items-center space-x-3 hover:bg-white/10 mb-3 rounded-xl transition-colors"
                  >
                    {image.author.avatarUrl ? (
                      <OptimizedImage
                        src={image.author.avatarUrl}
                        alt={image.author.name || 'Author'}
                        className="w-12 h-12 rounded-full object-cover"
                        objectFit="cover"
                        fallbackSrc="/placeholder-image.svg"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-white font-medium">
                        {image.author.name || 'Anonymous'}
                      </p>
                      <p className="text-white/60 text-sm">
                        {image.author.email}
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Description */}
              {image.description && (
                <div className="mb-6">
                  <p className="text-story text-white leading-relaxed">
                    {image.description}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 mb-6">
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
                    {new Date(image.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Reactions */}
              <div className="mb-6">
                <ReactionBar
                  imageId={image.id}
                  reactionCounts={reactionCounts}
                  userReaction={userReaction}
                  onReactionChange={handleReactionChange}
                  disabled={!isAuthenticated}
                />
              </div>

              {/* Location */}
              <div className="mb-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="flex items-center mb-3">
                    <MapPinIcon className="w-5 h-5 mr-2 text-white" />
                    <h4 className="text-heading text-white font-medium">
                      Location
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {/* <p className="text-meta text-white/80">
                      <span className="font-medium">Latitude:</span> {image.latitude.toFixed(6)}
                    </p>
                    <p className="text-meta text-white/80">
                      <span className="font-medium">Longitude:</span> {image.longitude.toFixed(6)}
                    </p> */}
                    <a
                      href={`https://www.google.com/maps?q=${image.latitude},${image.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen Image Preview */}
      {showPreview && (
        <div className="fixed inset-0 z-[60] bg-black">
          {/* Close Button */}
          <button
            onClick={handlePreviewClose}
            className="absolute top-4 right-4 z-10 p-3 bg-black/80 backdrop-blur-sm rounded-full hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>

          {/* Full-screen Image */}
          <div className="flex items-center justify-center h-full p-4">
            <OptimizedImage
              src={image.url}
              alt={image.description || 'Checkpoint image'}
              className="object-contain max-w-full max-h-full"
              objectFit="contain"
              fallbackSrc="/placeholder-image.svg"
            />
          </div>

          {/* Image Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            <div className="text-center">
              <h3 className="text-white text-lg font-medium mb-2">
                {image.description || 'Checkpoint Image'}
              </h3>
              {image.author && (
                <p className="text-white/70 text-sm">
                  by {image.author.name || image.author.email}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

