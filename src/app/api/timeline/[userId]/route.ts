import { db } from '@/db';
import { images, plans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/timeline/[userId]
 * Get user's timeline with all images and plans (public access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get all user's images
    const userImages = await db
      .select()
      .from(images)
      .where(eq(images.userId, userId))
      .orderBy(images.createdAt);

    // Get all user's plans
    const userPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.userId, userId))
      .orderBy(plans.startTime);

    // Get images grouped by plan
    const plansWithImages = await Promise.all(
      userPlans.map(async (plan) => {
        const planImages = await db
          .select()
          .from(images)
          .where(eq(images.planId, plan.id))
          .orderBy(images.createdAt);

        return {
          ...plan,
          images: planImages,
        };
      })
    );

    return NextResponse.json({
      userId,
      images: userImages,
      plans: plansWithImages,
      stats: {
        totalImages: userImages.length,
        totalPlans: userPlans.length,
      },
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


