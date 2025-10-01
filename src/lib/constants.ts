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

export const STORAGE_BUCKETS = {
  IMAGES: 'checkpoint-images',
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
  LOVE: 'love',
  WOW: 'wow',
} as const;

export type ReactionType = typeof REACTION_TYPES[keyof typeof REACTION_TYPES];


