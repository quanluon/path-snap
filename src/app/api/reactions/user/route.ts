import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { reactions } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/reactions/user
 * Get the current user's reaction for an image (requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Get user's reaction for this image
    const userReaction = await db
      .select()
      .from(reactions)
      .where(
        and(eq(reactions.userId, user.id), eq(reactions.imageId, imageId))
      )
      .limit(1);

    return NextResponse.json({ 
      reaction: userReaction[0] || null 
    });
  } catch (error) {
    console.error('Error fetching user reaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
