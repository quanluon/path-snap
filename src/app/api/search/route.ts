import { db } from '@/db';
import { images, users } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { SEARCH_RADIUS } from '@/lib/constants';
import { validateCoordinates } from '@/lib/utils/location';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/search
 * Search images by location (public access)
 * Uses PostGIS ST_DWithin for efficient geospatial queries
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const latitude = parseFloat(searchParams.get('latitude') || '');
    const longitude = parseFloat(searchParams.get('longitude') || '');
    const radius = parseInt(
      searchParams.get('radius') || String(SEARCH_RADIUS.DEFAULT)
    );
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate coordinates
    if (!validateCoordinates(latitude, longitude)) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Validate radius
    if (radius < SEARCH_RADIUS.MIN || radius > SEARCH_RADIUS.MAX) {
      return NextResponse.json(
        {
          error: `Radius must be between ${SEARCH_RADIUS.MIN} and ${SEARCH_RADIUS.MAX} meters`,
        },
        { status: 400 }
      );
    }

    // Try PostGIS query first, fallback to simple distance calculation
    let nearbyImages;
    
    try {
      // Query using PostGIS for location-based search with author information
      nearbyImages = await db
        .select({
          id: images.id,
          userId: images.userId,
          url: images.url,
          thumbnailUrl: images.thumbnailUrl,
          description: images.description,
          latitude: images.latitude,
          longitude: images.longitude,
          createdAt: images.createdAt,
          distance: sql<number>`
            ST_Distance(
              ST_SetSRID(ST_Point(${images.longitude}, ${images.latitude}), 4326)::geography,
              ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)::geography
            )
          `.as('distance'),
          author: {
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(images)
        .leftJoin(users, sql`${images.userId} = ${users.id}`)
        .where(
          sql`
            ST_DWithin(
              ST_SetSRID(ST_Point(${images.longitude}, ${images.latitude}), 4326)::geography,
              ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)::geography,
              ${radius}
            )
          `
        )
        .orderBy(sql`distance ASC`)
        .limit(limit)
        .offset(offset);
        console.log('PostGIS enabled');
        
    } catch (error) {
      console.log('PostGIS not available, using fallback distance calculation:', error);
      
      // Fallback: Get all images and calculate distance manually with author information
      const allImages = await db
        .select({
          id: images.id,
          userId: images.userId,
          url: images.url,
          thumbnailUrl: images.thumbnailUrl,
          description: images.description,
          latitude: images.latitude,
          longitude: images.longitude,
          createdAt: images.createdAt,
          author: {
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(images)
        .leftJoin(users, sql`${images.userId} = ${users.id}`)
        .limit(1000); // Limit to prevent memory issues
      
      // Calculate distance using Haversine formula
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      
      // Filter and sort by distance
      nearbyImages = allImages
        .map(img => ({
          ...img,
          distance: calculateDistance(latitude, longitude, img.latitude, img.longitude)
        }))
        .filter(img => img.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(offset, offset + limit);
    }

        return NextResponse.json({
          images: nearbyImages,
          searchParams: {
            latitude,
            longitude,
            radius,
          },
          count: nearbyImages.length,
          pagination: {
            limit,
            offset,
            total: nearbyImages.length,
          },
        });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


