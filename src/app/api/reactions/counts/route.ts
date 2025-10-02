import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { reactions } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { REACTION_TYPES } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/reactions/counts
 * Get reaction counts for an image
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Get reaction counts grouped by type
    const counts = await db
      .select({
        type: reactions.type,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(reactions)
      .where(eq(reactions.imageId, imageId))
      .groupBy(reactions.type);

    // Initialize counts object
    const reactionCounts = {
      like: 0,
      heart: 0,
      wow: 0,
    };

    // Populate counts from database results
    counts.forEach(({ type, count }) => {
      if (type in reactionCounts) {
        reactionCounts[type as keyof typeof reactionCounts] = count;
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
