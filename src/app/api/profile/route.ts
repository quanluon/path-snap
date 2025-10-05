import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users, images, plans, reactions, comments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/profile
 * Delete user account and all associated data
 */
export async function DELETE() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all user data in the correct order (due to foreign key constraints)
    
    // 1. Delete reactions
    await db.delete(reactions).where(eq(reactions.userId, user.id));
    
    // 2. Delete comments
    await db.delete(comments).where(eq(comments.userId, user.id));
    
    // 3. Delete images (this will also delete image views due to cascade)
    await db.delete(images).where(eq(images.userId, user.id));
    
    // 4. Delete plans
    await db.delete(plans).where(eq(plans.userId, user.id));
    
    // 5. Delete user record
    await db.delete(users).where(eq(users.id, user.id));

    // 6. Delete from Supabase Auth
    await supabase.auth.admin.deleteUser(user.id);

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Update user profile information
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, avatarUrl } = await request.json();

    // Update user record
    const [updatedUser] = await db
      .update(users)
      .set({
        ...(name && {name: name}),
        ...(avatarUrl && {avatarUrl: avatarUrl}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}