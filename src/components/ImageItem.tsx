'use client';

import { MapPinIcon, EyeIcon } from '@heroicons/react/24/solid';
import { UserIcon as UserIconOutline } from '@heroicons/react/24/outline';
import OptimizedImage from '@/components/OptimizedImage';
import ReactionBar from '@/components/ReactionBar';
import { useReactions } from '@/hooks/useReactions';
import { useImageView } from '@/hooks/useImageView';
import { useRouter } from 'next/navigation';
import type { ImageWithReactions } from '@/types';

interface ImageItemProps {
  image: ImageWithReactions;
  onImageClick?: (image: ImageWithReactions) => void;
  style?: React.CSSProperties;
}

export default function ImageItem({ image, onImageClick, style }: ImageItemProps) {
  const router = useRouter();
  const { reactionCounts, userReaction, addReaction, isAuthenticated } = useReactions({
    imageId: image.id,
    initialCounts: image.reactionCounts || { like: 0, heart: 0, wow: 0 },
    initialUserReaction: image.userReaction,
  });

  // Track view when image is displayed
  useImageView({ imageId: image.id });

  const handleReactionChange = async (type: string) => {
    if (userReaction === type) {
      // If clicking the same reaction, remove it
      return;
    }
    await addReaction(type as 'like' | 'heart' | 'wow');
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (image.author?.id) {
      router.push(`/profile/${image.author.id}`);
    }
  };

  return (
    <div style={style} className="w-full bg-black">
      {/* Image and Content Container */}
      <div className="w-full h-full bg-black flex flex-col">
        {/* Image Section */}
        <div className="relative w-full flex-1 bg-black flex items-center justify-center">
          <div 
            className="relative w-full h-full cursor-pointer"
            onClick={() => onImageClick?.(image)}
          >
            <OptimizedImage
              src={image.thumbnailUrl || image.url}
              alt={image.description || 'Checkpoint image'}
              fill
              className="object-contain"
              objectFit="contain"
              fallbackSrc="/placeholder-image.svg"
            />
          </div>
        </div>
        
        {/* Text Content Section */}
        <div className="bg-black p-6 flex-shrink-0">
          {/* Description */}
          {image.description && (
            <p className="text-white text-base mb-4 text-story font-smooth break-words line-clamp-3">
              {image.description}
            </p>
          )}
          
          {/* Author and Location */}
          <div className="flex items-center justify-between text-white/90">
            <div className="flex items-center space-x-4">
              {/* Author */}
              {image.author && (
                <button
                  onClick={handleAuthorClick}
                  className="flex items-center space-x-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {image.author.avatarUrl ? (
                    <OptimizedImage
                      src={image.author.avatarUrl}
                      alt={image.author.name || 'Author'}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <UserIconOutline className="w-6 h-6" />
                  )}
                  <span className="text-sm text-meta font-smooth">
                    {image.author.name || image.author.email}
                  </span>
                </button>
              )}
              
              {/* Location */}
              {/* <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-2" />
                <span className="text-sm text-meta font-smooth truncate max-w-[200px]">
                  {image.latitude.toFixed(4)}, {image.longitude.toFixed(4)}
                </span>
              </div> */}
            </div>


            {/* View Count */}
            {image.viewCount !== undefined && image.viewCount > 0 && (
              <div className="flex items-center text-white/70 py-5">
                <EyeIcon className="w-4 h-4 mr-1" />
                <span className="text-sm text-meta font-smooth">
                  {image.viewCount}
                </span>
              </div>
            )}
          </div>

           {/* Timestamp */}
           <div className="text-white/70 text-sm text-meta font-smooth mb-3">
            {new Date(image.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>

          {/* Reaction Bar */}
          <div>
            <ReactionBar
              imageId={image.id}
              reactionCounts={reactionCounts}
              userReaction={userReaction}
              onReactionChange={handleReactionChange}
              disabled={!isAuthenticated}
            />
          </div>

         
        </div>
      </div>
    </div>
  );
}
