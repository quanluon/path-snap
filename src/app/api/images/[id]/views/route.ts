import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { imageViews } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/images/[id]/views
 * Track a view for an image
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params;
    const supabase = await createClient();

    // Get user info (optional - for authenticated users)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get client info for anonymous tracking
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if this view should be counted (basic duplicate prevention)
    const existingView = await db
      .select()
      .from(imageViews)
      .where(
        user 
          ? sql`${imageViews.userId} = ${user.id} AND ${imageViews.imageId} = ${imageId} AND ${imageViews.createdAt} > NOW() - INTERVAL '1 hour'`
          : sql`${imageViews.ipAddress} = ${ipAddress} AND ${imageViews.imageId} = ${imageId} AND ${imageViews.createdAt} > NOW() - INTERVAL '1 hour'`
      )
      .limit(1);

    if (existingView.length > 0) {
      return NextResponse.json({ 
        message: 'View already tracked recently',
        counted: false 
      });
    }

    // Create new view record
    const [newView] = await db
      .insert(imageViews)
      .values({
        imageId,
        userId: user?.id || null,
        ipAddress,
        userAgent,
      })
      .returning();

    return NextResponse.json({
      view: newView,
      message: 'View tracked',
      counted: true,
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
