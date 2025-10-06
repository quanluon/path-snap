import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { images } from '@/db/schema';
import { validateCoordinates } from '@/lib/utils/location';
import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, uploadVideo } from '@/lib/storage';
import { getAddressFromCoordinatesServer } from '@/lib/locationServiceServer';
import { validateVideoFileServer } from '@/lib/utils/server-video';
import { IMAGE_CONFIG, VIDEO_CONFIG } from '@/lib/constants';

/**
 * POST /api/upload
 * Upload an image or video with location data
 * Requires authentication for upload
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File || formData.get('image') as File; // Support both 'file' and 'image' for backward compatibility
    const latitudeStr = formData.get('latitude') as string;
    const longitudeStr = formData.get('longitude') as string;
    const description = formData.get('description') as string | null;
    const planId = formData.get('planId') as string | null;

    // Parse coordinates (optional)
    const latitude = latitudeStr ? parseFloat(latitudeStr) : null;
    const longitude = longitudeStr ? parseFloat(longitudeStr) : null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Determine if it's an image or video
    const isImage = IMAGE_CONFIG.ALLOWED_FORMATS.includes(file.type as any);
    const isVideo = VIDEO_CONFIG.ALLOWED_FORMATS.includes(file.type as any);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload an image or video.' },
        { status: 400 }
      );
    }

    // Validate file based on type
    if (isVideo) {
      const videoValidation = validateVideoFileServer(file);
      if (!videoValidation.valid) {
        return NextResponse.json(
          { error: videoValidation.error },
          { status: 400 }
        );
      }
    }

    // Validate coordinates only if provided
    if (latitude !== null && longitude !== null && !validateCoordinates(latitude, longitude)) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Upload file using appropriate storage provider
    const uploadResult = isVideo 
      ? await uploadVideo(file, user.id, planId!)
      : await uploadImage(file, user.id, planId!);

    // Get address from coordinates if available
    let address = null;
    if (latitude !== null && longitude !== null && latitude !== 0 && longitude !== 0) {
      try {
        address = await getAddressFromCoordinatesServer(latitude, longitude);
      } catch (error) {
        console.error('Failed to get address:', error);
        // Continue without address if geocoding fails
      }
    }

    // Save to database
    const [newImage] = await db
      .insert(images)
      .values({
        userId: user.id,
        planId: planId || null,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl || uploadResult.url, // Use thumbnail URL if available, otherwise use main URL
        description: description || null,
        latitude: latitude || 0, // Default to 0 if not provided
        longitude: longitude || 0, // Default to 0 if not provided
        address: address, // Add reverse geocoded address
        mediaType: isVideo ? 'video' : 'image',
        duration: isVideo ? uploadResult.duration : null, // Add duration for videos
      })
      .returning();

    return NextResponse.json(
      {
        image: newImage,
        message: `${isVideo ? 'Video' : 'Image'} uploaded successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}


