'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ImageWithReactions } from '@/types';

interface UseImagesProps {
  initialImages?: ImageWithReactions[];
  itemsPerPage?: number;
}

interface UseImagesReturn {
  images: ImageWithReactions[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchImages: (isInitial?: boolean) => Promise<void>;
  addNewImage: (image: ImageWithReactions) => void;
  refreshImages: () => Promise<void>;
}

export function useImages({
  initialImages = [],
  itemsPerPage = 50
}: UseImagesProps): UseImagesReturn {
  const [images, setImages] = useState<ImageWithReactions[]>(initialImages);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false);

  const supabase = createClient();

  const fetchImages = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
        setImages([]);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const response = await fetch(`/api/images?limit=${itemsPerPage}&offset=${images.length}`);
      const data = await response.json();
      
      const newImages = data.images || [];
      
      if (isInitial) {
        setImages(newImages);
      } else {
        // Filter out duplicates based on image ID
        const uniqueNewImages = newImages.filter(
          (newImage: ImageWithReactions) => 
            !images.some(existingImage => existingImage.id === newImage.id)
        );
        setImages(prev => [...prev, ...uniqueNewImages]);
      }
      
      // If no new images returned, no more to load
      setHasMore(newImages.length > 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [images.length, itemsPerPage]);

  const addNewImage = useCallback((image: ImageWithReactions) => {
    console.log('Adding new image to feed:', image.id);
    
    // Add to the beginning of the list (newest first)
    setImages(prev => {
      // Check if image already exists to prevent duplicates
      if (prev.some(existingImage => existingImage.id === image.id)) {
        console.log('Image already exists in feed, skipping');
        return prev;
      }
      
      return [image, ...prev];
    });
  }, []);

  const refreshImages = useCallback(async () => {
    await fetchImages(true);
  }, [fetchImages]);

  // Fetch initial data and check for uploaded images
  useEffect(() => {
    fetchImages(true);
    
    // Check for recently uploaded images in localStorage
    const checkForUploadedImages = () => {
      try {
        const uploadedData = localStorage.getItem('newImageUploaded');
        if (uploadedData) {
          const data = JSON.parse(uploadedData);
          // Only process if uploaded within the last 5 minutes
          if (data.timestamp && Date.now() - data.timestamp < 5 * 60 * 1000) {
            console.log('Found recent uploaded image in localStorage:', data.image.id);
            addNewImage(data.image);
            // Clear the localStorage after processing
            localStorage.removeItem('newImageUploaded');
          }
        }
      } catch (err) {
        console.error('Error checking localStorage for uploaded images:', err);
      }
    };

    // Check immediately and also after a short delay to ensure DOM is ready
    checkForUploadedImages();
    const timeoutId = setTimeout(checkForUploadedImages, 1000);

    return () => clearTimeout(timeoutId);
  }, [fetchImages, addNewImage]);

  // Subscribe to real-time updates for new images
  useEffect(() => {
    console.log('Setting up real-time subscription for images');

    const channel = supabase
      .channel('images:feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'images',
        },
        async (payload) => {
          console.log('Real-time new image received:', payload);
          
          // Skip real-time updates if we're in the middle of an optimistic update
          if (isOptimisticUpdate) {
            console.log('Skipping real-time update due to optimistic update in progress');
            return;
          }
          
          // Fetch the complete image data with reactions and author info
          try {
            const response = await fetch(`/api/images/${payload.new.id}`);
            if (response.ok) {
              const imageData = await response.json();
              addNewImage(imageData.image);
            }
          } catch (err) {
            console.error('Error fetching new image data:', err);
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time images subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time images');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to real-time images');
        }
      });

    return () => {
      console.log('Cleaning up real-time images subscription');
      supabase.removeChannel(channel);
    };
  }, [supabase, addNewImage, isOptimisticUpdate]);

  // Listen for new image uploads from localStorage and custom events
  useEffect(() => {
    const handleImageUploaded = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { image } = customEvent.detail;
      console.log('New image uploaded event received:', image.id);
      
      // Fetch complete image data with reactions and author info
      try {
        const response = await fetch(`/api/images/${image.id}`);
        if (response.ok) {
          const imageData = await response.json();
          addNewImage(imageData.image);
        } else {
          // Fallback: use the basic image data from upload
          addNewImage(image);
        }
      } catch (err) {
        console.error('Error fetching uploaded image data:', err);
        // Fallback: use the basic image data from upload
        addNewImage(image);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'newImageUploaded' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data.image) {
            console.log('New image uploaded via localStorage:', data.image.id);
            // Create a custom event-like object
            const customEvent = { detail: { image: data.image } } as CustomEvent;
            handleImageUploaded(customEvent);
          }
        } catch (err) {
          console.error('Error parsing localStorage image data:', err);
        }
      }
    };

    // Listen for custom events
    window.addEventListener('imageUploaded', handleImageUploaded);
    
    // Listen for localStorage changes (for cross-tab communication)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for service worker upload success events
    const handleUploadSuccess = (event: CustomEvent) => {
      const { image } = event.detail;
      console.log('Upload success from Service Worker:', image.id);
      addNewImage(image);
    };

    window.addEventListener('uploadSuccess', handleUploadSuccess as EventListener);

    return () => {
      window.removeEventListener('imageUploaded', handleImageUploaded);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('uploadSuccess', handleUploadSuccess as EventListener);
    };
  }, [addNewImage]);

  // Fallback polling mechanism (every 60 seconds) in case real-time fails
  useEffect(() => {
    const interval = setInterval(async () => {
      // Skip polling if we're in the middle of an optimistic update
      if (isOptimisticUpdate) return;
      
      console.log('Polling for new images...');
      await refreshImages();
    }, 60000); // Poll every 60 seconds

    return () => clearInterval(interval);
  }, [refreshImages, isOptimisticUpdate]);

  return {
    images,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchImages,
    addNewImage,
    refreshImages,
  };
}
