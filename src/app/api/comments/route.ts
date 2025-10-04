import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { comments, users, images } from '@/db/schema';
import { desc, eq, count } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import type { CommentCreateRequest } from '@/types';

const COMMENTS_PER_PAGE = 20;

// Function to send comment notification
async function sendCommentNotification({
  imageId,
  commenterUserId,
  commenterName,
  authorUserId,
}: {
  imageId: string;
  commenterUserId: string;
  commenterName: string;
  authorUserId: string;
}) {
  try {
    const supabase = await createClient();
    
    // Send real-time notification to the image author
    await supabase.channel(`notifications:${authorUserId}`).send({
      type: 'broadcast',
      event: 'comment_notification',
      payload: {
        imageId,
        commenterUserId,
        commenterName,
        type: 'comment',
        message: `${commenterName} commented on your image`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error sending comment notification:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || COMMENTS_PER_PAGE.toString());

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Get comments with user information
    const commentsWithUsers = await db
      .select({
        id: comments.id,
        imageId: comments.imageId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.imageId, imageId))
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.imageId, imageId));

    const totalCount = totalResult?.count || 0;
    const hasMore = offset + limit < totalCount;

    return NextResponse.json({
      comments: commentsWithUsers,
      hasMore,
      totalCount,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body: CommentCreateRequest = await request.json();
    const { imageId, content } = body;

    if (!imageId || !content?.trim()) {
      return NextResponse.json({ error: 'Image ID and content are required' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Comment too long (max 1000 characters)' }, { status: 400 });
    }

    // Get image author and commenter information
    const [imageWithAuthor, commenterUser] = await Promise.all([
      db
        .select({
          authorId: images.userId,
          authorName: users.name,
          authorEmail: users.email,
        })
        .from(images)
        .leftJoin(users, eq(images.userId, users.id))
        .where(eq(images.id, imageId))
        .limit(1),
      db
        .select({
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1),
    ]);

    if (!imageWithAuthor.length) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imageData = imageWithAuthor[0];
    const commenterData = commenterUser[0];

    // Create the comment
    const [newComment] = await db
      .insert(comments)
      .values({
        imageId,
        userId: user.id,
        content: content.trim(),
      })
      .returning();

    // Get the comment with user information
    const [commentWithUser] = await db
      .select({
        id: comments.id,
        imageId: comments.imageId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.id, newComment.id));

    // Send notification to image author (if not commenting on own image)
    if (imageData.authorId && imageData.authorId !== user.id) {
      await sendCommentNotification({
        imageId,
        commenterUserId: user.id,
        commenterName: commenterData.name || commenterData.email || 'Someone',
        authorUserId: imageData.authorId,
      });
    }

    return NextResponse.json({ comment: commentWithUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
