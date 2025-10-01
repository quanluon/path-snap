# Checkpoint - Location Photo App 📍

A Progressive Web App for capturing and sharing photos with location tags. Built with Next.js, Supabase, and Drizzle ORM.

## Features ✨

- 📸 **Photo Upload**: Capture photos with automatic geolocation tagging
- 🗺️ **Location Search**: Find photos within a specific radius
- 🎯 **Travel Plans**: Group checkpoints into named travel plans
- 🌍 **Public Timeline**: View all photos without login (upload requires auth)
- ❤️ **Reactions**: Like and react to photos (requires auth)
- 🌐 **Multi-language**: Support for English and Vietnamese
- 📱 **PWA**: Installable on mobile devices with offline support
- 🎨 **Modern UI**: Beautiful, responsive design with TailwindCSS

## Tech Stack 🛠️

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **Heroicons** - Beautiful icon set
- **Embla Carousel** - Smooth image carousel

### Backend
- **Supabase** - Authentication and file storage
- **PostgreSQL + PostGIS** - Database with geospatial queries
- **Drizzle ORM** - Type-safe database access
- **Sharp** - Image processing and optimization

### PWA
- **Service Worker** - Offline support and caching
- **Web Manifest** - Installable app experience

## Getting Started 🚀

### Prerequisites

- Node.js 18+
- PostgreSQL database with PostGIS extension
- Supabase project

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd path-snap
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Configuration
DATABASE_URL=your-postgres-connection-string
```

4. Enable PostGIS extension in your PostgreSQL database:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

5. Generate and run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

6. Create the storage bucket in Supabase:
- Go to Supabase Dashboard > Storage
- Create a new bucket named `checkpoint-images`
- Make it public

7. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure 📁

```
path-snap/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── images/       # Image CRUD operations
│   │   │   ├── plan/         # Travel plan management
│   │   │   ├── reactions/    # Reaction endpoints
│   │   │   ├── search/       # Location-based search
│   │   │   └── timeline/     # User timeline
│   │   ├── upload/           # Upload page
│   │   ├── search/           # Search page
│   │   ├── plan/             # Plan management page
│   │   └── layout.tsx        # Root layout
│   ├── components/            # React components
│   ├── contexts/              # React contexts (Language)
│   ├── db/                    # Database schema and config
│   ├── lib/                   # Utilities and helpers
│   │   ├── i18n/             # Internationalization
│   │   ├── supabase/         # Supabase clients
│   │   └── utils/            # Helper functions
│   └── types/                 # TypeScript type definitions
├── public/                    # Static files
│   ├── manifest.json         # PWA manifest
│   └── sw.js                 # Service worker
└── drizzle.config.ts         # Drizzle ORM configuration
```

## API Endpoints 🔌

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Images
- `GET /api/images` - List images (public)
- `GET /api/images/[id]` - Get image details (public)
- `POST /api/upload` - Upload image (auth required)

### Search
- `GET /api/search` - Search images by location (public)

### Plans
- `POST /api/plan/start` - Start travel plan (auth required)
- `POST /api/plan/end` - End travel plan (auth required)

### Timeline
- `GET /api/timeline/[userId]` - Get user timeline (public)

### Reactions
- `POST /api/reactions` - Add/update reaction (auth required)
- `DELETE /api/reactions` - Remove reaction (auth required)

## Features in Detail 📋

### Photo Upload
- Automatic geolocation capture using HTML5 Geolocation API
- Image optimization with Sharp (WebP format)
- Thumbnail generation
- Upload to Supabase Storage

### Location Search
- PostGIS-powered geospatial queries
- Configurable search radius (100m - 1km)
- Distance calculation and sorting

### Travel Plans
- Create named travel plans
- Group checkpoints by plan
- Track start/end times
- View plan timeline

### Multi-language Support
- English and Vietnamese translations
- Context-based language switching
- LocalStorage persistence

### PWA Features
- Offline image caching
- Network-first strategy for API calls
- Installable on mobile devices
- Optimized loading with service worker

## Database Schema 🗄️

### Users
- Extended from Supabase Auth
- Stores name, email, avatar

### Images
- URL, thumbnail URL
- Latitude, longitude (PostGIS geography)
- Description, timestamps
- User and plan associations

### Plans
- Name, start/end times
- Active status
- User association

### Reactions
- User, image, reaction type
- Unique constraint per user-image pair

## Development 💻

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Constants for magic numbers
- Comprehensive error handling

## Deployment 🚀

### Recommended Platform: Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Database Setup

Ensure your PostgreSQL database has:
- PostGIS extension enabled
- Proper connection pooling
- SSL enabled (recommended)

## License 📄

MIT License - feel free to use this project for your own purposes.

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## Support 💬

For questions or issues, please open an issue on GitHub.

---

Built with ❤️ using Next.js and Supabase
