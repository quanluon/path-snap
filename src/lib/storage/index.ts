import { uploadToSupabase } from './supabase';
import { uploadToS3 } from './s3';
import sharp from 'sharp';

export type StorageProvider = 'supabase' | 's3';

export interface UploadResult {
  url: string;
  key: string;
}

export interface ProcessedImage {
  buffer: Buffer;
  metadata: sharp.Metadata;
}

/**
 * Common function to process images with consistent quality and EXIF handling
 * @param file - The image file to process
 * @returns Processed image buffer and metadata
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Get image metadata to determine if it needs processing
  const metadata = await sharp(buffer).metadata();
  const isLargeImage = (metadata.width || 0) > 1920 || (metadata.height || 0) > 1920;
  
  let processedImage: Buffer;

  if (isLargeImage) {
    // For large images, resize but maintain high quality
    processedImage = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF data to fix mobile photo orientation
      .resize(1920, 1920, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: 95, // Higher quality for large images
        progressive: true,
        mozjpeg: true // Better compression
      })
      .toBuffer();
  } else {
    // For smaller images, keep original quality but optimize
    processedImage = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF data to fix mobile photo orientation
      .jpeg({ 
        quality: 98, // Very high quality for smaller images
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();
  }

  return {
    buffer: processedImage,
    metadata
  };
}

export async function uploadImage(
  file: File,
  userId: string,
  planId?: string
): Promise<UploadResult> {
  const provider = (process.env.STORAGE_PROVIDER as StorageProvider) || 'supabase';
  
  console.log(`Using storage provider: ${provider}`);
  
  switch (provider) {
    case 's3':
      return await uploadToS3(file, userId, planId);
    case 'supabase':
    default:
      return await uploadToSupabase(file, userId, planId);
  }
}

export function getStorageProvider(): StorageProvider {
  return (process.env.STORAGE_PROVIDER as StorageProvider) || 'supabase';
}
