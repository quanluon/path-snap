import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { images, reactions, users, imageViews } from '@/db/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import type { ImageWithReactions } from '@/types';
import { ReactionType } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params;

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Get the specific image with author information and view count
    const imageResult = await db
      .select({
        id: images.id,
        url: images.url,
        description: images.description,
        latitude: images.latitude,
        longitude: images.longitude,
        createdAt: images.createdAt,
        userId: images.userId,
        viewCount: sql<number>`count(${imageViews.id})`,
        authorId: users.id,
        authorEmail: users.email,
        authorName: users.name,
        authorAvatar: users.avatarUrl,
        address: images.address,
      })
      .from(images)
      .leftJoin(imageViews, eq(imageViews.imageId, images.id))
      .leftJoin(users, eq(users.id, images.userId))
      .where(eq(images.id, imageId))
      .groupBy(images.id, users.id, users.email, users.name, users.avatarUrl).limit(1);

    if (imageResult.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    const image = imageResult[0];

    // Get reaction counts for this image
    const reactionCounts = await db
      .select({
        type: reactions.type,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(reactions)
      .where(eq(reactions.imageId, imageId))
      .groupBy(reactions.type);

    // Format reaction counts
    const counts = {
      like: 0,
      heart: 0,
      wow: 0,
      haha: 0,
    };

    reactionCounts.forEach(({ type, count }) => {
      if (type in counts) {
        counts[type as keyof typeof counts] = count;
      }
    });

    // Get user's reaction if authenticated
    let userReaction = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const userReactionResult = await db
          .select()
          .from(reactions)
          .where(
            sql`${reactions.userId} = ${user.id} AND ${reactions.imageId} = ${imageId}`
          )
          .limit(1);
        
        userReaction = userReactionResult[0]?.type || null;
      }
    } catch (error) {
      // User not authenticated or other auth error - continue without user reaction
      console.log('Could not fetch user reaction:', error);
    }

    // Format the response
    const imageWithReactions: Partial<ImageWithReactions> = {
      id: image.id,
      url: image.url,
      description: image.description,
      latitude: image.latitude,
      longitude: image.longitude,
      createdAt: image.createdAt,
      userId: image.userId,
      reactionCounts: counts,
      userReaction: userReaction as ReactionType,
      viewCount: image.viewCount,
      author: {
        id: image.authorId as string,
        email: image.authorEmail as string,
        name: image.authorName as string,
        avatarUrl: image.authorAvatar,
        createdAt: image.createdAt,
        updatedAt: image.createdAt,
      },
    };

    return NextResponse.json({ image: imageWithReactions });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}