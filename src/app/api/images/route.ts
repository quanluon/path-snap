import { db } from '@/db';
import { images, reactions } from '@/db/schema';
import { desc, sql, eq, and } from 'drizzle-orm';
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
      })
      .from(images)
      .leftJoin(reactions, sql`${reactions.imageId} = ${images.id}`)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .groupBy(images.id)
      .orderBy(desc(images.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      images: result,
      pagination: {
        limit,
        offset,
        count: result.length,
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


