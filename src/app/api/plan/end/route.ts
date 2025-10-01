import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { plans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/plan/end
 * End an active travel plan (requires authentication)
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

    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Update plan to mark as inactive and set end time
    const [updatedPlan] = await db
      .update(plans)
      .set({
        isActive: 'false',
        endTime: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(plans.id, planId), eq(plans.userId, user.id)))
      .returning();

    if (!updatedPlan) {
      return NextResponse.json(
        { error: 'Plan not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      plan: updatedPlan,
      message: 'Plan ended successfully',
    });
  } catch (error) {
    console.error('Error ending plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


