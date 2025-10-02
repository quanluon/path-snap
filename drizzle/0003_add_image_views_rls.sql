-- Enable Row Level Security for image_views table
ALTER TABLE "image_views" ENABLE ROW LEVEL SECURITY;

-- Image views table policies
CREATE POLICY "Anyone can view image views" ON "image_views"
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert image views" ON "image_views"
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own image views" ON "image_views"
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own image views" ON "image_views"
FOR DELETE USING (auth.uid() = user_id);
