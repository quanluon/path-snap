ALTER TABLE "comments" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "media_type" text DEFAULT 'image' NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "duration" real;