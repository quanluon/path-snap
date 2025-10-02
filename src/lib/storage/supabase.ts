import { createClient } from '@/lib/supabase/server';
import { processImage } from './index';

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
