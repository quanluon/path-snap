import { db } from '@/db';
import { reactions } from '@/db/schema';
import { sql, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/reactions/counts
 * Get reaction counts for multiple images
 * Requires imageIds parameter (comma-separated list)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageIds = searchParams.get('imageIds');

    if (!imageIds) {
      return NextResponse.json(
        { error: 'Image IDs are required' },
        { status: 400 }
      );
    }

    // Parse comma-separated image IDs
    const targetImageIds = imageIds.split(',').filter(id => id.trim() !== '');

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
    const reactionCounts: Record<string, { like: number; heart: number; wow: number; haha: number }> = {};
    targetImageIds.forEach(id => {
      reactionCounts[id] = { like: 0, heart: 0, wow: 0, haha: 0 };
    });

    // Populate counts from database results
    counts.forEach(({ imageId, type, count }) => {
      if (reactionCounts[imageId] && type in reactionCounts[imageId]) {
        reactionCounts[imageId][type as keyof typeof reactionCounts[typeof imageId]] = Number(count || 0);
      }
    });

    return NextResponse.json({ counts: reactionCounts });
  } catch (error) {
    console.error('Error fetching reaction counts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
