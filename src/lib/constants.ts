/**
 * Application-wide constants
 * Using constants instead of hardcoded values for better maintainability
 */

export const SEARCH_RADIUS = {
  MIN: 100, // meters
  DEFAULT: 500, // meters
  MAX: 1000, // meters
} as const;

export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 10,
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'] as const,
  OUTPUT_FORMAT: 'webp' as const,
  QUALITY: 80,
} as const;

export const VIDEO_CONFIG = {
  MAX_SIZE_MB: 50, // 50MB for short videos
  MAX_DURATION_SECONDS: 30, // 30 seconds max
  ALLOWED_FORMATS: ['video/mp4', 'video/webm', 'video/quicktime'] as const,
  THUMBNAIL_FORMAT: 'jpeg' as const,
  THUMBNAIL_QUALITY: 80,
} as const;

export const STORAGE_BUCKETS = {
  IMAGES: 'checkpoint-images',
  VIDEOS: 'checkpoint-videos',
  THUMBNAILS: 'checkpoint-thumbnails',
} as const;

export const ROUTES = {
  HOME: '/',
  TIMELINE: '/timeline',
  SEARCH: '/search',
  UPLOAD: '/upload',
  PLAN: '/plan',
} as const;

export const REACTION_TYPES = {
  LIKE: 'like',
  HEART: 'heart',
  WOW: 'wow',
  HAHA: 'haha',
} as const;

export type ReactionType = typeof REACTION_TYPES[keyof typeof REACTION_TYPES];

export const DEFAULT_REACTION = { like: 0, heart: 0, wow: 0, haha: 0 }

export const FETCH_MORE_THRESHOLD = 500;