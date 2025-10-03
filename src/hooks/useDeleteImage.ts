import { useState } from 'react';

interface UseDeleteImageOptions {
  onSuccess?: (imageId: string) => void;
  onError?: (error: string) => void;
}

export function useDeleteImage({ onSuccess, onError }: UseDeleteImageOptions = {}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteImage = async (imageId: string) => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/images/${imageId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete image');
      }

      // Call success callback
      onSuccess?.(imageId);
      
      // Refresh the entire window to update the UI and clear any cached data
      window.location.reload();
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      onError?.(errorMessage);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteImage,
    isDeleting,
  };
}
