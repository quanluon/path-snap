-- Enable Row Level Security (RLS) for all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reactions" ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all profiles" ON "users"
FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON "users"
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON "users"
FOR INSERT WITH CHECK (auth.uid() = id);

-- Images table policies
CREATE POLICY "Anyone can view images" ON "images"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert images" ON "images"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own images" ON "images"
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own images" ON "images"
FOR DELETE USING (auth.uid() = user_id);

-- Plans table policies
CREATE POLICY "Anyone can view plans" ON "plans"
FOR SELECT USING (true);

CREATE POLICY "Users can insert own plans" ON "plans"
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON "plans"
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" ON "plans"
FOR DELETE USING (auth.uid() = user_id);

-- Reactions table policies
CREATE POLICY "Anyone can view reactions" ON "reactions"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reactions" ON "reactions"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own reactions" ON "reactions"
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON "reactions"
FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for checkpoint-images bucket
CREATE POLICY "Public read access for images" ON storage.objects
FOR SELECT USING (bucket_id = 'checkpoint-images');

CREATE POLICY "Authenticated upload for images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'checkpoint-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'checkpoint-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'checkpoint-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
