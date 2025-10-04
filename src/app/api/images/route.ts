import { db } from '@/db';
import { images, imageViews, reactions, users } from '@/db/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/images
 * Get list of images (public access, no auth required)
 * Supports pagination and filtering by user or plan
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('userId');
    const planId = searchParams.get('planId');

    // Build where conditions
    const whereConditions = [];
    if (userId) {
      whereConditions.push(eq(images.userId, userId));
    }
    if (planId) {
      whereConditions.push(eq(images.planId, planId));
    }

    // Get total count for pagination
    const totalCountQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(images)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    const totalResult = await totalCountQuery;
    const total = totalResult[0]?.count || 0;

    // Build query with conditions
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
        reactionCount: sql<number>`count(${reactions.id})`.as('reaction_count'),
        viewCount: sql<number>`count(${imageViews.id})`.as('view_count'),
        // Author information
        authorId: users.id,
        authorEmail: users.email,
        authorName: users.name,
        authorAvatar: users.avatarUrl,
        address: images.address,
      })
      .from(images)
      .leftJoin(reactions, sql`${reactions.imageId} = ${images.id}`)
      .leftJoin(imageViews, sql`${imageViews.imageId} = ${images.id}`)
      .leftJoin(users, sql`${users.id} = ${images.userId}`)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .groupBy(images.id, users.id, users.email, users.name, users.avatarUrl)
      .orderBy(desc(images.createdAt))
      .limit(limit)
      .offset(offset);

    const imageIds = result.map(img => img.id);
    let reactionCounts: Array<{ imageId: string; type: string; count: number }> = [];

    // Only query if there are imageIds, and use a proper array parameter for Postgres
    if (imageIds.length > 0) {
      // Use the 'in' operator for bulk queries, which is more portable and avoids Postgres array issues
      reactionCounts = await db
        .select({
          imageId: reactions.imageId,
          type: reactions.type,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(reactions)
        .where(inArray(reactions.imageId, imageIds))
        .groupBy(reactions.imageId, reactions.type);
    }

    // Create a map of reaction counts by image
    const reactionMap = new Map();
    reactionCounts.forEach(({ imageId, type, count }) => {
      if (!reactionMap.has(imageId)) {
        reactionMap.set(imageId, {
          like: 0,
          heart: 0,
          wow: 0,
        });
      }
      reactionMap.get(imageId)[type] = count;
    });

    // Add reaction counts and author info to images
    const imagesWithReactions = result.map(img => ({
      ...img,
      reactionCounts: reactionMap.get(img.id) || {
        like: 0,
        heart: 0,
        wow: 0,
        haha: 0,
      },
      author: img.authorId ? {
        id: img.authorId,
        email: img.authorEmail,
        name: img.authorName,
        avatarUrl: img.authorAvatar,
      } : undefined,
    }));

    return NextResponse.json({
      images: imagesWithReactions,
      pagination: {
        limit,
        offset,
        count: imagesWithReactions.length,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


