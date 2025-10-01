import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { plans, images } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's plans with image count
    const userPlans = await db
      .select({
        id: plans.id,
        name: plans.name,
        startTime: plans.startTime,
        endTime: plans.endTime,
        userId: plans.userId,
        createdAt: plans.createdAt,
        imageCount: count(images.id).as('imageCount'),
      })
      .from(plans)
      .leftJoin(images, eq(plans.id, images.planId))
      .where(eq(plans.userId, user.id))
      .groupBy(plans.id, plans.name, plans.startTime, plans.endTime, plans.userId, plans.createdAt)
      .orderBy(desc(plans.createdAt));

    return NextResponse.json({ plans: userPlans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
