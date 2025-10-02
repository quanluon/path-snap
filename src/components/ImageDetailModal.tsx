'use client';

import { XMarkIcon, MapPinIcon, EyeIcon, UserIcon } from '@heroicons/react/24/solid';
import { CalendarIcon, ShareIcon } from '@heroicons/react/24/outline';
import OptimizedImage from '@/components/OptimizedImage';
import ReactionBar from '@/components/ReactionBar';
import { useReactions } from '@/hooks/useReactions';
import { useImageView } from '@/hooks/useImageView';
import { useRouter } from 'next/navigation';
import type { ImageWithReactions } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

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
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Checkpoint Image',
          text: image?.description || 'Check out this checkpoint!',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
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
            <div className="relative bg-black flex items-center justify-center">
              <OptimizedImage
                src={image.url}
                alt={image.description || 'Checkpoint image'}
                className="object-contain p-4"
                objectFit="contain"
                fallbackSrc="/placeholder-image.svg"
              />
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
    </div>
  );
}

