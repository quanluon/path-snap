/**
 * Client-side image utilities (browser-safe)
 */

import { IMAGE_CONFIG } from '@/lib/constants';

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size using constant
  const maxSizeBytes = IMAGE_CONFIG.MAX_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${IMAGE_CONFIG.MAX_SIZE_MB}MB limit`,
    };
  }

  // Check file type using constant
  if (!IMAGE_CONFIG.ALLOWED_FORMATS.includes(file.type as any)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${IMAGE_CONFIG.ALLOWED_FORMATS.join(', ')}`,
    };
  }

  return { valid: true };
}

export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getMaxFileSize(): string {
  return formatFileSize(IMAGE_CONFIG.MAX_SIZE_MB * 1024 * 1024);
}
