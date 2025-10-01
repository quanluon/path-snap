# Checkpoint App - Setup Guide 🚀

## Quick Setup Instructions

### 1. Database Setup

#### Enable PostGIS in PostgreSQL

Connect to your PostgreSQL database and run:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify installation
SELECT PostGIS_version();
```

#### Create Database Tables

The app uses Drizzle ORM for database migrations. Run:

```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

### 2. Supabase Setup

#### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys

#### Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Name: `checkpoint-images`
4. Make it **Public**
5. Click **Create Bucket**

#### Configure Storage Policies (Optional)

For better security, you can add policies:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'checkpoint-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'checkpoint-images'
  AND auth.role() = 'authenticated'
);
```

### 3. Environment Variables

Create `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

**How to get these values:**

- **Supabase URL & Keys**: Dashboard → Settings → API
- **Database URL**: Dashboard → Settings → Database → Connection String (URI)

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Additional Configuration

### PWA Icons

Create app icons and place them in the `public` folder:

- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

You can use tools like:
- [PWA Asset Generator](https://www.pwabuilder.com/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

### Language Setup

The app supports English (en) and Vietnamese (vi) by default.

To add more languages:

1. Create new translation file in `src/lib/i18n/locales/[lang].ts`
2. Follow the structure of `en.ts` or `vi.ts`
3. Update `src/lib/i18n/index.ts` to include new locale

### Database Utilities

```bash
# Open Drizzle Studio (visual database editor)
npm run db:studio

# Generate new migration after schema changes
npm run db:generate

# Apply migrations
npm run db:migrate
```

## Testing the App

### 1. Test Public Access (No Login)

1. Open the app in incognito mode
2. You should see the home page with image carousel
3. Search functionality should work
4. Clicking images should show details

### 2. Test Authentication

1. Click **Upload** in navigation
2. System should require login
3. Test signup/login flow
4. After login, upload should work

### 3. Test Geolocation

1. Browser will ask for location permission
2. Allow location access
3. Upload a photo - location should be captured automatically
4. Search should use your current location

### 4. Test PWA Features

1. Open DevTools → Application → Service Workers
2. Verify service worker is registered
3. Go to Application → Manifest
4. Verify manifest is loaded correctly
5. Test "Add to Home Screen" on mobile

## Common Issues & Solutions

### PostGIS Not Found

**Error**: `function st_dwithin does not exist`

**Solution**: Enable PostGIS extension in your database:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### CORS Errors

**Error**: CORS policy blocking requests

**Solution**: Check Supabase project settings:
- Dashboard → Settings → API
- Add your domain to allowed origins

### Service Worker Not Updating

**Solution**: 
1. Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
2. Or go to DevTools → Application → Service Workers → Unregister

### Images Not Loading

**Solution**: 
1. Verify storage bucket is public
2. Check bucket name matches `STORAGE_BUCKETS.IMAGES` constant
3. Verify Supabase URL and keys are correct

### Geolocation Not Working

**Solution**:
1. Must use HTTPS (or localhost)
2. Browser must support Geolocation API
3. User must grant location permission

## Production Deployment

### Recommended: Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Database Considerations

- Use connection pooling (Supabase includes this)
- Enable SSL (required for production)
- Set appropriate timeout values
- Consider read replicas for scaling

### Environment Variables in Production

Make sure to add all variables from `.env.local` to your hosting platform:

- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment
- Railway: Variables tab

### Post-Deployment Checklist

- [ ] Test image upload
- [ ] Test geolocation
- [ ] Test search functionality
- [ ] Test PWA installation
- [ ] Test offline mode
- [ ] Verify SSL certificate
- [ ] Check service worker registration
- [ ] Test on mobile devices

## Performance Optimization

### Image Optimization

Images are automatically optimized using Sharp:
- Converted to WebP format
- Compressed with 80% quality
- Thumbnails generated for carousel

### Database Optimization

For better performance with large datasets:

```sql
-- Create indexes
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_plan_id ON images(plan_id);
CREATE INDEX idx_images_created_at ON images(created_at);

-- Spatial index for location queries
CREATE INDEX idx_images_location ON images USING GIST (
  ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography
);
```

### Caching Strategy

The service worker implements:
- **Static assets**: Cache first
- **Images**: Cache first, fallback to network
- **API requests**: Network only
- **Pages**: Network first, fallback to cache

## Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use Row Level Security (RLS)** in Supabase
3. **Validate all inputs** on both client and server
4. **Sanitize user uploads** - Already implemented with Sharp
5. **Rate limit API endpoints** - Consider adding rate limiting middleware

## Support & Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostGIS Documentation](https://postgis.net/documentation/)

## Need Help?

Open an issue on GitHub with:
- Error message
- Steps to reproduce
- Environment (OS, Node version, browser)
- Screenshots if applicable

---

Happy coding! 🎉

