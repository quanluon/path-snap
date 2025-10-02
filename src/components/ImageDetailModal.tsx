'use client';

// import { Fragment } from 'react';
import { XMarkIcon, MapPinIcon, HeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import OptimizedImage from '@/components/OptimizedImage';
import type { ImageWithReactions } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ImageDetailModalProps {
  image: ImageWithReactions | null;
  isOpen: boolean;
  onClose: () => void;
  onReact?: (imageId: string, type: string) => void;
  userReaction?: string | null;
}

export default function ImageDetailModal({
  image,
  isOpen,
  onClose,
  onReact,
  userReaction,
}: ImageDetailModalProps) {
  const { t } = useLanguage();

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-80"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-4xl overflow-hidden text-left align-middle transition-all transform bg-dark-card rounded-lg shadow-dark-secondary">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-dark-card rounded-full shadow-dark-primary hover:bg-dark-hover transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-dark-primary" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative bg-dark-secondary h-[400px] md:h-auto">
              <OptimizedImage
                src={image.url}
                alt={image.description || 'Checkpoint image'}
                fill
                className="object-contain"
                objectFit="contain"
                fallbackSrc="/placeholder-image.svg"
              />
            </div>

            {/* Details */}
            <div className="p-6 overflow-y-auto max-h-[600px]">
              {/* Description */}
              {image.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-dark-primary mb-2">
                    {t.images.viewDetails}
                  </h3>
                  <p className="text-dark-secondary">{image.description}</p>
                </div>
              )}

              {/* Location */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-dark-secondary mb-2 flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-2 text-dark-primary" />
                  {t.images.location}
                </h4>
                <div className="bg-dark-secondary p-4 rounded-lg border border-dark-primary">
                  <p className="text-sm text-dark-secondary mb-1">
                    <strong>Latitude:</strong> {image.latitude.toFixed(6)}
                  </p>
                  <p className="text-sm text-dark-secondary">
                    <strong>Longitude:</strong> {image.longitude.toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${image.latitude},${image.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-dark-primary hover:text-dark-secondary text-sm font-medium transition-colors"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>

              {/* Timestamp */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-dark-secondary mb-2">
                  {t.images.createdAt}
                </h4>
                <p className="text-dark-muted">
                  {new Date(image.createdAt).toUTCString()}
                </p>
              </div>

              {/* Reactions */}
              {onReact && (
                <div className="mb-6">
                  <div className="flex gap-3">
                    <button
                      onClick={() => onReact(image.id, 'like')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        userReaction === 'like'
                          ? 'bg-dark-hover border-dark-primary text-dark-primary'
                          : 'bg-dark-card border-dark-primary hover:bg-dark-hover text-dark-secondary'
                      }`}
                    >
                      {userReaction === 'like' ? (
                        <HeartIcon className="w-5 h-5 text-dark-primary" />
                      ) : (
                        <HeartOutlineIcon className="w-5 h-5" />
                      )}
                      Like
                    </button>
                    <button
                      onClick={() => onReact(image.id, 'love')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        userReaction === 'love'
                          ? 'bg-dark-hover border-dark-primary text-dark-primary'
                          : 'bg-dark-card border-dark-primary hover:bg-dark-hover text-dark-secondary'
                      }`}
                    >
                      ❤️
                    </button>
                    <button
                      onClick={() => onReact(image.id, 'wow')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        userReaction === 'wow'
                          ? 'bg-dark-hover border-dark-primary text-dark-primary'
                          : 'bg-dark-card border-dark-primary hover:bg-dark-hover text-dark-secondary'
                      }`}
                    >
                      😮
                    </button>
                  </div>
                  {image.reactionCount !== undefined && image.reactionCount > 0 && (
                    <p className="mt-3 text-sm text-dark-muted">
                      {image.reactionCount} {t.images.reactions}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

