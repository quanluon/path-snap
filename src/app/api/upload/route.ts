import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { images } from '@/db/schema';
import { validateCoordinates } from '@/lib/utils/location';
import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/storage';

/**
 * POST /api/upload
 * Upload an image with location data
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
    const file = formData.get('image') as File;
    const latitudeRaw = formData.get('latitude');
    const longitudeRaw = formData.get('longitude');
    const latitude = latitudeRaw !== null ? parseFloat(String(latitudeRaw)) : null;
    const longitude = longitudeRaw !== null ? parseFloat(String(longitudeRaw)) : null;
    const description = formData.get('description') as string | null;
    const planId = formData.get('planId') as string | null;


    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Validate coordinates only if provided
    if (latitude !== null && longitude !== null) {
      if (!validateCoordinates(latitude, longitude)) {
        return NextResponse.json(
          { error: 'Invalid coordinates' },
          { status: 400 }
        );
      }
    }

    // Upload image using storage provider (Supabase or S3)
    const uploadResult = await uploadImage(file, user.id, planId!);

    // Save to database
    const [newImage] = await db
      .insert(images)
      .values({
        userId: user.id,
        planId: planId || null,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        description: description || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      })
      .returning();

    return NextResponse.json(
      {
        image: newImage,
        message: 'Image uploaded successfully',
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


