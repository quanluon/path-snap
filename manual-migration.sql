-- Manual migration script to apply changes without PostGIS conflicts

-- 1. Create image_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS "image_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_id" uuid NOT NULL,
	"user_id" uuid,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 2. Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "image_views" ADD CONSTRAINT "image_views_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "image_views" ADD CONSTRAINT "image_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 3. Change reaction type from enum to text (if needed)
DO $$ BEGIN
 ALTER TABLE "reactions" ALTER COLUMN "type" SET DATA TYPE text;
EXCEPTION
 WHEN others THEN null;
END $$;

-- 4. Enable RLS for image_views table
ALTER TABLE "image_views" ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for image_views
DROP POLICY IF EXISTS "Anyone can view image views" ON "image_views";
CREATE POLICY "Anyone can view image views" ON "image_views"
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert image views" ON "image_views";
CREATE POLICY "Anyone can insert image views" ON "image_views"
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own image views" ON "image_views";
CREATE POLICY "Users can update own image views" ON "image_views"
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own image views" ON "image_views";
CREATE POLICY "Users can delete own image views" ON "image_views"
FOR DELETE USING (auth.uid() = user_id);
