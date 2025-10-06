import { createClient } from '@/lib/supabase/server';
import { processImage } from './index';
import { ProcessedVideo } from '@/lib/utils/server-video';
import { STORAGE_BUCKETS } from '@/lib/constants';

export interface SupabaseUploadResult {
  url: string;
  key: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  duration?: number;
}

export async function uploadToSupabase(
  file: File,
  userId: string,
  planId?: string
): Promise<SupabaseUploadResult> {
  try {
    const supabase = await createClient();
    
    // Generate unique key
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const key = `images/${userId}/${timestamp}.${fileExtension}`;

    // Process image using common function
    const { buffer: processedImage } = await processImage(file);

    // Upload image
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

    // Get public URL
    const { data: imageUrl } = supabase.storage
      .from('checkpoint-images')
      .getPublicUrl(key);

    return {
      url: imageUrl.publicUrl,
      key,
    };
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Failed to upload image to Supabase');
  }
}

export async function uploadVideoToSupabase(
  processedVideo: ProcessedVideo,
  userId: string,
  planId?: string
): Promise<SupabaseUploadResult> {
  try {
    const supabase = await createClient();
    
    const timestamp = Date.now();
    
    // Generate keys for video and thumbnail
    const videoKey = `videos/${userId}/${timestamp}.mp4`;
    const thumbnailKey = `thumbnails/${userId}/${timestamp}.jpg`;

    // Upload video and thumbnail in parallel
    const [videoUpload, thumbnailUpload] = await Promise.all([
      supabase.storage
        .from(STORAGE_BUCKETS.VIDEOS)
        .upload(videoKey, processedVideo.buffer, {
          contentType: 'video/mp4',
          metadata: {
            userId,
            planId: planId || '',
            type: 'video',
            duration: processedVideo.metadata.duration.toString(),
            uploadedAt: new Date().toISOString(),
          },
        }),
      supabase.storage
        .from(STORAGE_BUCKETS.THUMBNAILS)
        .upload(thumbnailKey, processedVideo.thumbnailBuffer, {
          contentType: 'image/jpeg',
          metadata: {
            userId,
            planId: planId || '',
            type: 'thumbnail',
            uploadedAt: new Date().toISOString(),
          },
        })
    ]);

    if (videoUpload.error) {
      console.error('Supabase video upload error:', videoUpload.error);
      throw new Error('Failed to upload video to Supabase');
    }

    if (thumbnailUpload.error) {
      console.error('Supabase thumbnail upload error:', thumbnailUpload.error);
      throw new Error('Failed to upload thumbnail to Supabase');
    }

    // Get public URLs
    const { data: videoUrl } = supabase.storage
      .from(STORAGE_BUCKETS.VIDEOS)
      .getPublicUrl(videoKey);
    
    const { data: thumbnailUrl } = supabase.storage
      .from(STORAGE_BUCKETS.THUMBNAILS)
      .getPublicUrl(thumbnailKey);

    return {
      url: videoUrl.publicUrl,
      key: videoKey,
      thumbnailUrl: thumbnailUrl.publicUrl,
      thumbnailKey,
      duration: processedVideo.metadata.duration,
    };
  } catch (error) {
    console.error('Supabase video upload error:', error);
    throw new Error('Failed to upload video to Supabase');
  }
}
