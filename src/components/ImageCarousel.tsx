'use client';

import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon } from '@heroicons/react/24/solid';
import type { ImageWithReactions } from '@/types';

interface ImageCarouselProps {
  images: ImageWithReactions[];
  onImageClick?: (image: ImageWithReactions) => void;
  startIndex?: number;
}

export default function ImageCarousel({ images, onImageClick, startIndex = 0 }: ImageCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(startIndex);

  // Scroll to startIndex when component mounts or startIndex changes
  useEffect(() => {
    if (emblaApi && startIndex !== undefined && startIndex < images.length) {
      emblaApi.scrollTo(startIndex);
      setSelectedIndex(startIndex);
    }
  }, [emblaApi, startIndex, images.length]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No images found</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
            >
              <div
                className="relative group cursor-pointer bg-gray-100 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                onClick={() => onImageClick?.(image)}
              >
                {/* Image */}
                <div className="aspect-square relative">
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.description || 'Checkpoint image'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity" />
                </div>

                {/* Image Info */}
                <div className="p-4">
                  {image.description && (
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {image.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      <span>
                        {image.latitude.toFixed(4)}, {image.longitude.toFixed(4)}
                      </span>
                    </div>
                    
                    {image.reactionCount !== undefined && image.reactionCount > 0 && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        ❤️ {image.reactionCount}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    {new Date(image.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors z-10"
            aria-label="Previous"
          >
            <ChevronLeftIcon className="w-6 h-6 mx-auto text-gray-800" />
          </button>

          <button
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors z-10"
            aria-label="Next"
          >
            <ChevronRightIcon className="w-6 h-6 mx-auto text-gray-800" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === selectedIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}


