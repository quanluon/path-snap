import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users, images, plans, reactions, comments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/profile/export
 * Export all user data as JSON
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user data
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));

    const userImages = await db
      .select()
      .from(images)
      .where(eq(images.userId, user.id))
      .orderBy(images.createdAt);

    const userPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.userId, user.id))
      .orderBy(plans.createdAt);

    const userReactions = await db
      .select()
      .from(reactions)
      .where(eq(reactions.userId, user.id))
      .orderBy(reactions.createdAt);

    const userComments = await db
      .select()
      .from(comments)
      .where(eq(comments.userId, user.id))
      .orderBy(comments.createdAt);

    // Compile export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: userData?.id,
        email: userData?.email,
        name: userData?.name,
        avatarUrl: userData?.avatarUrl,
        createdAt: userData?.createdAt,
        updatedAt: userData?.updatedAt,
      },
      data: {
        images: userImages,
        plans: userPlans,
        reactions: userReactions,
        comments: userComments,
      },
      stats: {
        totalImages: userImages.length,
        totalPlans: userPlans.length,
        totalReactions: userReactions.length,
        totalComments: userComments.length,
      },
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="checkpoint-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
