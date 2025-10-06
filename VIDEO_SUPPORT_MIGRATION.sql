-- Video Support Migration for Path-Snap
-- This migration adds video support to the existing images table
-- Run this SQL directly on your database when ready

-- Add media_type column to distinguish between images and videos
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "media_type" text DEFAULT 'image' NOT NULL;

-- Add duration column for video files (nullable for images)
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "duration" real;

-- Ensure all existing records are marked as images
UPDATE "images" SET "media_type" = 'image' WHERE "media_type" IS NULL;

-- Add guest comment support (if not already present)
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "guest_name" text;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "guest_email" text;

-- Make user_id nullable for guest comments
ALTER TABLE "comments" ALTER COLUMN "user_id" DROP NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'images' 
AND column_name IN ('media_type', 'duration')
ORDER BY column_name;
