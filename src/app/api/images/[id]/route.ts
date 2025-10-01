import { db } from '@/db';
import { images, reactions, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/images/[id]
 * Get detailed information about a specific image (public access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .select({
        id: images.id,
        userId: images.userId,
        planId: images.planId,
        url: images.url,
        thumbnailUrl: images.thumbnailUrl,
        description: images.description,
        latitude: images.latitude,
        longitude: images.longitude,
        createdAt: images.createdAt,
        userName: users.name,
        userAvatar: users.avatarUrl,
        reactionCount: sql<number>`count(${reactions.id})`.as('reaction_count'),
      })
      .from(images)
      .leftJoin(users, eq(images.userId, users.id))
      .leftJoin(reactions, eq(reactions.imageId, images.id))
      .where(eq(images.id, id))
      .groupBy(images.id, users.id);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Get all reactions for this image
    const imageReactions = await db
      .select()
      .from(reactions)
      .where(eq(reactions.imageId, id));

    return NextResponse.json({
      image: result[0],
      reactions: imageReactions,
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


