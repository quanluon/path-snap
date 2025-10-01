import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { plans } from '@/db/schema';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/plan/start
 * Start a new travel plan (requires authentication)
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

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Plan name is required' },
        { status: 400 }
      );
    }

    // Create new plan
    const [newPlan] = await db
      .insert(plans)
      .values({
        userId: user.id,
        name,
        startTime: new Date(),
        isActive: 'true',
      })
      .returning();

    return NextResponse.json(
      {
        plan: newPlan,
        message: 'Plan started successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error starting plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


