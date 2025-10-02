import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';

export interface SupabaseUploadResult {
  url: string;
  thumbnailUrl: string;
  key: string;
  thumbnailKey: string;
}

export async function uploadToSupabase(
  file: File,
  userId: string,
  planId?: string
): Promise<SupabaseUploadResult> {
  try {
    const supabase = await createClient();
    
    // Generate unique keys
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const key = `images/${userId}/${timestamp}.${fileExtension}`;
    const thumbnailKey = `thumbnails/${userId}/${timestamp}_thumb.${fileExtension}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image metadata to determine if it needs processing
    const metadata = await sharp(buffer).metadata();
    const isLargeImage = (metadata.width || 0) > 1920 || (metadata.height || 0) > 1920;
    
    let processedImage: Buffer;
    let processedThumbnail: Buffer;

    if (isLargeImage) {
      // For large images, resize but maintain high quality
      processedImage = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF data
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

      processedThumbnail = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF data
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ 
          quality: 90, // Higher quality for thumbnails
          progressive: true
        })
        .toBuffer();
    } else {
      // For smaller images, keep original quality but optimize
      processedImage = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF data
        .jpeg({ 
          quality: 98, // Very high quality for smaller images
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();

      processedThumbnail = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF data
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ 
          quality: 90,
          progressive: true
        })
        .toBuffer();
    }

    // Upload main image
    const { error: imageError } = await supabase.storage
      .from('checkpoint-images')
      .upload(key, processedImage, {
        contentType: 'image/jpeg',
        metadata: {
          userId,
          planId: planId || '',
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

    if (imageError) {
      console.error('Supabase image upload error:', imageError);
      throw new Error('Failed to upload image to Supabase');
    }

    // Upload thumbnail
    const { error: thumbnailError } = await supabase.storage
      .from('checkpoint-images')
      .upload(thumbnailKey, processedThumbnail, {
        contentType: 'image/jpeg',
        metadata: {
          userId,
          planId: planId || '',
          type: 'thumbnail',
          uploadedAt: new Date().toISOString(),
        },
      });

    if (thumbnailError) {
      console.error('Supabase thumbnail upload error:', thumbnailError);
      throw new Error('Failed to upload thumbnail to Supabase');
    }

    // Get public URLs
    const { data: imageUrl } = supabase.storage
      .from('checkpoint-images')
      .getPublicUrl(key);

    const { data: thumbnailUrl } = supabase.storage
      .from('checkpoint-images')
      .getPublicUrl(thumbnailKey);

    return {
      url: imageUrl.publicUrl,
      thumbnailUrl: thumbnailUrl.publicUrl,
      key,
      thumbnailKey,
    };
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Failed to upload image to Supabase');
  }
}
