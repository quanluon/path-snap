import sharp from 'sharp';
import { IMAGE_CONFIG } from '../constants';

/**
 * Image processing utilities using Sharp
 */

export async function processImage(
  buffer: Buffer,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<Buffer> {
  const { width = 1920, height = 1080, quality = IMAGE_CONFIG.QUALITY } = options;

  return sharp(buffer)
    .rotate() // respect EXIF orientation
    .resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();
}

export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(400, 400, {
      fit: 'cover',
    })
    .webp({ quality: 82 })
    .toBuffer();
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = IMAGE_CONFIG.MAX_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${IMAGE_CONFIG.MAX_SIZE_MB}MB limit`,
    };
  }

  // Check file type
  if (!IMAGE_CONFIG.ALLOWED_FORMATS.includes(file.type as (typeof IMAGE_CONFIG.ALLOWED_FORMATS)[number])) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${IMAGE_CONFIG.ALLOWED_FORMATS.join(', ')}`,
    };
  }

  return { valid: true };
}


