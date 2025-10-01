import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { plans, images } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: planId } = await params;

    // Get plan details
    const planDetails = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.userId, user.id)))
      .limit(1);

    if (planDetails.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const plan = planDetails[0];

    // Get images for this plan
    const planImages = await db
      .select({
        id: images.id,
        url: images.url,
        thumbnailUrl: images.thumbnailUrl,
        description: images.description,
        latitude: images.latitude,
        longitude: images.longitude,
        createdAt: images.createdAt,
        planId: images.planId,
      })
      .from(images)
      .where(eq(images.planId, planId))
      .orderBy(asc(images.createdAt));

    return NextResponse.json({
      plan: {
        ...plan,
        images: planImages,
        imageCount: planImages.length,
      },
    });
  } catch (error) {
    console.error('Error fetching plan details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan details' },
      { status: 500 }
    );
  }
}
