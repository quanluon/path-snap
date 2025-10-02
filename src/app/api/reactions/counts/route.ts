import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { reactions } from '@/db/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { REACTION_TYPES } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/reactions/counts
 * Get reaction counts for specific image(s)
 * Supports both single imageId and multiple imageIds
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    const imageIds = searchParams.get('imageIds');

    let targetImageIds: string[] = [];

    if (imageIds) {
      // Handle multiple imageIds (comma-separated)
      targetImageIds = imageIds.split(',').filter(id => id.trim() !== '');
    } else if (imageId) {
      // Handle single imageId
      targetImageIds = [imageId];
    } else {
      return NextResponse.json(
        { error: 'Image ID or Image IDs are required' },
        { status: 400 }
      );
    }

    if (targetImageIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid Image ID is required' },
        { status: 400 }
      );
    }

    // Get reaction counts grouped by imageId and type
    const counts = await db
      .select({
        imageId: reactions.imageId,
        type: reactions.type,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(reactions)
      .where(inArray(reactions.imageId, targetImageIds))
      .groupBy(reactions.imageId, reactions.type);

    // Initialize counts object for all requested images
    const reactionCounts: Record<string, { like: number; heart: number; wow: number }> = {};
    targetImageIds.forEach(id => {
      reactionCounts[id] = { like: 0, heart: 0, wow: 0 };
    });

    // Populate counts from database results
    counts.forEach(({ imageId, type, count }) => {
      if (reactionCounts[imageId] && type in reactionCounts[imageId]) {
        reactionCounts[imageId][type as keyof typeof reactionCounts[typeof imageId]] = count;
      }
    });

    // Return single image format for backward compatibility
    if (targetImageIds.length === 1) {
      return NextResponse.json({ counts: reactionCounts[targetImageIds[0]] });
    }

    // Return multiple images format
    return NextResponse.json({ counts: reactionCounts });
  } catch (error) {
    console.error('Error fetching reaction counts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
