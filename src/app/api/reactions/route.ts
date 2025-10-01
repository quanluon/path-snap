import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { reactions } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { REACTION_TYPES } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/reactions
 * Add or update a reaction to an image (requires authentication)
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

    const { imageId, type } = await request.json();

    if (!imageId || !type) {
      return NextResponse.json(
        { error: 'Image ID and reaction type are required' },
        { status: 400 }
      );
    }

    // Validate reaction type
    const validTypes = Object.values(REACTION_TYPES);
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid reaction type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user already reacted to this image
    const existingReaction = await db
      .select()
      .from(reactions)
      .where(
        and(eq(reactions.userId, user.id), eq(reactions.imageId, imageId))
      );

    if (existingReaction.length > 0) {
      // Update existing reaction
      const [updated] = await db
        .update(reactions)
        .set({ type })
        .where(eq(reactions.id, existingReaction[0].id))
        .returning();

      return NextResponse.json({
        reaction: updated,
        message: 'Reaction updated',
      });
    } else {
      // Create new reaction
      const [newReaction] = await db
        .insert(reactions)
        .values({
          userId: user.id,
          imageId,
          type,
        })
        .returning();

      return NextResponse.json(
        {
          reaction: newReaction,
          message: 'Reaction added',
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reactions
 * Remove a reaction from an image (requires authentication)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    await db
      .delete(reactions)
      .where(
        and(eq(reactions.userId, user.id), eq(reactions.imageId, imageId))
      );

    return NextResponse.json({ message: 'Reaction removed' });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


