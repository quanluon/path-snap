import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { reactions } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/reactions/user
 * Get the current user's reactions for image(s) (requires authentication)
 * Supports both single imageId and multiple imageIds
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

    // Get user's reactions for these images
    const userReactions = await db
      .select()
      .from(reactions)
      .where(
        and(eq(reactions.userId, user.id), inArray(reactions.imageId, targetImageIds))
      );

    // Format the response
    const reactionsMap: Record<string, any> = {};
    userReactions.forEach(reaction => {
      reactionsMap[reaction.imageId] = reaction;
    });

    // Return single image format for backward compatibility
    if (targetImageIds.length === 1) {
      return NextResponse.json({ 
        reaction: reactionsMap[targetImageIds[0]] || null 
      });
    }

    // Return multiple images format
    return NextResponse.json({ 
      reactions: reactionsMap 
    });
  } catch (error) {
    console.error('Error fetching user reactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
