/**
 * Video utilities for validation and processing
 */

import { VIDEO_CONFIG } from '@/lib/constants';
import { formatFileSize } from './client-image';

export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  // Check file size using constant
  const maxSizeBytes = VIDEO_CONFIG.MAX_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${VIDEO_CONFIG.MAX_SIZE_MB}MB limit`,
    };
  }

  // Check file type using constant
  if (!VIDEO_CONFIG.ALLOWED_FORMATS.includes(file.type as any)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${VIDEO_CONFIG.ALLOWED_FORMATS.join(', ')}`,
    };
  }

  return { valid: true };
}

export function createVideoPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

export async function validateVideoDuration(file: File): Promise<{ valid: boolean; error?: string; duration?: number }> {
  try {
    const duration = await getVideoDuration(file);
    
    if (duration > VIDEO_CONFIG.MAX_DURATION_SECONDS) {
      return {
        valid: false,
        error: `Video duration (${Math.round(duration)}s) exceeds ${VIDEO_CONFIG.MAX_DURATION_SECONDS}s limit`,
        duration,
      };
    }
    
    return { valid: true, duration };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate video duration',
    };
  }
}

export function formatVideoDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getMaxVideoSize(): string {
  return formatFileSize(VIDEO_CONFIG.MAX_SIZE_MB * 1024 * 1024);
}

// Re-export formatFileSize from client-image for consistency
export { formatFileSize } from './client-image';
