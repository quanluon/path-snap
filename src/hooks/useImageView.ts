'use client';

import { useEffect, useRef } from 'react';

interface UseImageViewProps {
  imageId: string;
  enabled?: boolean;
}

export function useImageView({ imageId, enabled = true }: UseImageViewProps) {
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (!enabled || !imageId || hasTrackedView.current) return;

    const trackView = async () => {
      try {
        const response = await fetch(`/api/images/${imageId}/views`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          hasTrackedView.current = true;
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    // Track view after a short delay to ensure the image is actually viewed
    const timer = setTimeout(trackView, 1000);

    return () => clearTimeout(timer);
  }, [imageId, enabled]);

  return {
    trackView: () => {
      if (!hasTrackedView.current) {
        hasTrackedView.current = true;
        fetch(`/api/images/${imageId}/views`, { method: 'POST' });
      }
    },
  };
}
