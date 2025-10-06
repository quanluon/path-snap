# Video Support Migration

This migration adds video upload support to the Path-Snap application.

## What this migration does:

1. **Adds `media_type` column** to the `images` table to distinguish between images and videos
   - Default value: `'image'` (for backward compatibility)
   - All existing records will be marked as images

2. **Adds `duration` column** to the `images` table for video files
   - Type: `real` (floating point number for seconds)
   - Nullable (only videos will have duration values)

3. **Adds guest comment support** to the `comments` table
   - `guest_name` and `guest_email` columns for anonymous comments
   - Makes `user_id` nullable to support guest comments

## How to apply:

### Option 1: Using the generated migration file
```bash
# The migration file was already generated at:
# drizzle/0005_icy_malice.sql

# Apply using Drizzle (when database is available):
yarn db:push
```

### Option 2: Manual SQL execution
```bash
# Run the SQL directly on your database:
psql $DATABASE_URL -f VIDEO_SUPPORT_MIGRATION.sql
```

### Option 3: Using the migration script
```bash
# When your database is running:
node apply-video-migration.js
```

## Verification

After applying the migration, you can verify it worked by checking:

```sql
-- Check the new columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'images' 
AND column_name IN ('media_type', 'duration');

-- Check existing data is preserved
SELECT media_type, COUNT(*) FROM images GROUP BY media_type;
```

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove the new columns
ALTER TABLE "images" DROP COLUMN IF EXISTS "media_type";
ALTER TABLE "images" DROP COLUMN IF EXISTS "duration";

-- Restore comments table (if needed)
ALTER TABLE "comments" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "comments" DROP COLUMN IF EXISTS "guest_name";
ALTER TABLE "comments" DROP COLUMN IF EXISTS "guest_email";
```

## Notes

- This migration is **safe** and **backward compatible**
- Existing image records will continue to work normally
- The new video functionality will be available after applying this migration
- No data will be lost during this migration
