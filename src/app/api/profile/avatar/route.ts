import { createClient } from '@/lib/supabase/server';
import { uploadAvatarToS3, deleteAvatarFromS3 } from '@/lib/storage/s3';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/profile/avatar
 * Upload avatar image to S3 and update user profile
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

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Get current user data to delete old avatar if exists
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));

    // Delete old avatar from S3 if exists
    if (currentUser?.avatarUrl) {
      try {
        // Extract key from URL
        const urlParts = currentUser.avatarUrl.split('/');
        const key = urlParts.slice(-2).join('/'); // Get 'avatars/userId/filename'
        await deleteAvatarFromS3(key);
      } catch (error) {
        console.error('Error deleting old avatar:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new avatar to S3
    const { url: avatarUrl } = await uploadAvatarToS3(file, user.id);

    // Update user profile with new avatar URL
    const [updatedUser] = await db
      .update(users)
      .set({
        avatarUrl,
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
      avatarUrl,
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/avatar
 * Delete user's avatar
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

    // Get current user data
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete avatar from S3 if exists
    if (currentUser.avatarUrl) {
      try {
        // Extract key from URL
        const urlParts = currentUser.avatarUrl.split('/');
        const key = urlParts.slice(-2).join('/'); // Get 'avatars/userId/filename'
        await deleteAvatarFromS3(key);
      } catch (error) {
        console.error('Error deleting avatar from S3:', error);
        // Continue with database update even if S3 deletion fails
      }
    }

    // Update user profile to remove avatar URL
    const [updatedUser] = await db
      .update(users)
      .set({
        avatarUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json({
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
