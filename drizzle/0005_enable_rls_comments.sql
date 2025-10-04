-- Enable Row Level Security on comments table
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all comments
CREATE POLICY "comments_select_policy" ON "comments"
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own comments
CREATE POLICY "comments_insert_policy" ON "comments"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "comments_update_policy" ON "comments"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "comments_delete_policy" ON "comments"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
