'use client';

// import { Fragment } from 'react';
import { XMarkIcon, MapPinIcon, HeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
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
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-4xl overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-700" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative bg-gray-100">
              <img
                src={image.url}
                alt={image.description || 'Checkpoint image'}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Details */}
            <div className="p-6 overflow-y-auto max-h-[600px]">
              {/* Description */}
              {image.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t.images.viewDetails}
                  </h3>
                  <p className="text-gray-700">{image.description}</p>
                </div>
              )}

              {/* Location */}
              {image.latitude != null && image.longitude != null && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-2 text-blue-600" />
                    {t.images.location}
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Latitude:</strong> {image.latitude.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Longitude:</strong> {image.longitude.toFixed(6)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${image.latitude},${image.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  {t.images.createdAt}
                </h4>
                <p className="text-gray-600">
                  {new Date(image.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Reactions */}
              {onReact && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {t.images.reactions}
                  </h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onReact(image.id, 'like')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        userReaction === 'like'
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'bg-white border-gray-300 hover:border-red-300'
                      }`}
                    >
                      {userReaction === 'like' ? (
                        <HeartIcon className="w-5 h-5 text-red-600" />
                      ) : (
                        <HeartOutlineIcon className="w-5 h-5" />
                      )}
                      Like
                    </button>
                    <button
                      onClick={() => onReact(image.id, 'love')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        userReaction === 'love'
                          ? 'bg-pink-50 border-pink-300'
                          : 'bg-white border-gray-300 hover:border-pink-300'
                      }`}
                    >
                      ❤️
                    </button>
                    <button
                      onClick={() => onReact(image.id, 'wow')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        userReaction === 'wow'
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-white border-gray-300 hover:border-yellow-300'
                      }`}
                    >
                      😮
                    </button>
                  </div>
                  {image.reactionCount !== undefined && image.reactionCount > 0 && (
                    <p className="mt-3 text-sm text-gray-600">
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

