import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { images, imageViews, reactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: imageId } = await params;

    if (!imageId) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
    }

    // First, check if the image exists and belongs to the user
    const existingImage = await db
      .select()
      .from(images)
      .where(and(
        eq(images.id, imageId),
        eq(images.userId, user.id)
      ))
      .limit(1);

    if (existingImage.length === 0) {
      return NextResponse.json(
        { error: "Image not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    const imageToDelete = existingImage[0];

    // Delete related records first to avoid foreign key constraints
    // 1. Delete image views
    await db
      .delete(imageViews)
      .where(eq(imageViews.imageId, imageId));

    // 2. Delete reactions
    await db
      .delete(reactions)
      .where(eq(reactions.imageId, imageId));

    // 3. Delete the image
    await db
      .delete(images)
      .where(and(
        eq(images.id, imageId),
        eq(images.userId, user.id)
      ));

    // TODO: Delete the actual image file from storage (Supabase Storage)
    // This would involve deleting from the storage bucket
    // For now, we'll just delete from the database

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
      deletedImage: {
        id: imageToDelete.id,
        url: imageToDelete.url
      }
    });

  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
