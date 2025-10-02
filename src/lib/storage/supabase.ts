import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';

export interface SupabaseUploadResult {
  url: string;
  key: string;
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
        .jpeg({ 
          quality: 98, // Very high quality for smaller images
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
    }

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
