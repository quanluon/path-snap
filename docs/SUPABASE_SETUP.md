# 🔧 Supabase Setup for Checkpoint App

## ✅ Environment Variables (Already Set)
Your `.env` file is configured with:
- ✅ Supabase URL: `https://ydfbvdbjcjeofxlxtheq.supabase.co`
- ✅ Supabase Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- ✅ Database URL: `postgresql://postgres:gYGBTco8VkaDFJqR@db.ydfbvdbjcjeofxlxtheq.supabase.co:5432/postgres`

## 🚨 Missing: Storage Bucket Setup

You need to create the storage bucket in Supabase:

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project: `ydfbvdbjcjeofxlxtheq`

### Step 2: Create Storage Bucket
1. Go to **Storage** in the left sidebar
2. Click **"New Bucket"**
3. **Bucket name**: `checkpoint-images`
4. **Public bucket**: ✅ Check this box
5. Click **"Create Bucket"**

### Step 3: Set Storage Policies (Optional)
Go to **Storage** → **Policies** and add:

```sql
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'checkpoint-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'checkpoint-images' 
  AND auth.role() = 'authenticated'
);
```

## 🔍 Debugging Upload Issues

The upload error is likely because:
1. **Storage bucket doesn't exist** - Create `checkpoint-images` bucket
2. **Bucket not public** - Make sure it's public
3. **Authentication required** - User needs to be logged in

## 🚀 After Setup

Once the storage bucket is created:
1. Restart your development server: `yarn dev`
2. Try uploading a photo
3. Check the browser console for detailed error messages

## 📱 Test the App

1. **Home page**: http://localhost:3000 - View public timeline
2. **Upload page**: http://localhost:3000/upload - Upload photos (requires login)
3. **Search page**: http://localhost:3000/search - Search by location
4. **Plan page**: http://localhost:3000/plan - Manage travel plans

The app should work perfectly once the storage bucket is set up! 🎉
