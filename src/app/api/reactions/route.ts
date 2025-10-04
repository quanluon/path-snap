import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { reactions, images, users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { REACTION_TYPES } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Send notification to image author about new reaction
 */
async function sendReactionNotification({
  imageId,
  reactorUserId,
  reactorName,
  reactionType,
  authorUserId,
}: {
  imageId: string;
  reactorUserId: string;
  reactorName: string;
  reactionType: string;
  authorUserId: string;
}) {
  try {
    // Don't send notification if user is reacting to their own image
    if (reactorUserId === authorUserId) {
      return;
    }

    // Get image details for notification
    const imageDetails = await db
      .select({
        url: images.url,
        description: images.description,
      })
      .from(images)
      .where(eq(images.id, imageId))
      .limit(1);

    if (imageDetails.length === 0) {
      console.warn('Image not found for notification:', imageId);
      return;
    }

    const image = imageDetails[0];

    // Send notification to all connected clients of the author
    // This would typically be done via WebSocket or Server-Sent Events
    // For now, we'll use Supabase real-time to broadcast the notification
    
    const supabase = await createClient();
    const channel = supabase.channel(`notifications:${authorUserId}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'reaction_notification',
      payload: {
        type: 'reaction',
        imageId,
        reactorName,
        reactionType,
        imageUrl: image.url,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('Reaction notification sent to author:', authorUserId);
  } catch (error) {
    console.error('Error sending reaction notification:', error);
  }
}

/**
 * POST /api/reactions
 * Add or update a reaction to an image (requires authentication)
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

    const { imageId, type } = await request.json();

    if (!imageId || !type) {
      return NextResponse.json(
        { error: 'Image ID and reaction type are required' },
        { status: 400 }
      );
    }

    // Validate reaction type
    const validTypes = Object.values(REACTION_TYPES);
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid reaction type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user already reacted to this image
    const existingReaction = await db
      .select()
      .from(reactions)
      .where(
        and(eq(reactions.userId, user.id), eq(reactions.imageId, imageId))
      );

    // Get image author and reactor user details for notifications
    const [imageWithAuthor, reactorUser] = await Promise.all([
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

    if (imageWithAuthor.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    const imageData = imageWithAuthor[0];
    const reactorData = reactorUser[0];

    if (existingReaction.length > 0) {
      // Update existing reaction
      const [updated] = await db
        .update(reactions)
        .set({ type })
        .where(eq(reactions.id, existingReaction[0].id))
        .returning();

      // Send notification for reaction update (only if author exists and is different from reactor)
      if (imageData.authorId && imageData.authorId !== user.id) {
        await sendReactionNotification({
          imageId,
          reactorUserId: user.id,
          reactorName: reactorData.name || reactorData.email || 'Someone',
          reactionType: type,
          authorUserId: imageData.authorId,
        });
      }

      return NextResponse.json({
        reaction: updated,
        message: 'Reaction updated',
      });
    } else {
      // Create new reaction
      const [newReaction] = await db
        .insert(reactions)
        .values({
          userId: user.id,
          imageId,
          type,
        })
        .returning();

      // Send notification for new reaction (only if author exists and is different from reactor)
      if (imageData.authorId && imageData.authorId !== user.id) {
        await sendReactionNotification({
          imageId,
          reactorUserId: user.id,
          reactorName: reactorData.name || reactorData.email || 'Someone',
          reactionType: type,
          authorUserId: imageData.authorId,
        });
      }

      return NextResponse.json(
        {
          reaction: newReaction,
          message: 'Reaction added',
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reactions
 * Remove a reaction from an image (requires authentication)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    await db
      .delete(reactions)
      .where(
        and(eq(reactions.userId, user.id), eq(reactions.imageId, imageId))
      );

    return NextResponse.json({ message: 'Reaction removed' });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


