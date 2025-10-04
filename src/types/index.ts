import type { images, plans, reactions, users, imageViews } from '@/db/schema';
import type { ReactionType } from '@/lib/constants';

/**
 * Type definitions for the application
 */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

export type Reaction = typeof reactions.$inferSelect;
export type NewReaction = typeof reactions.$inferInsert;

export type ImageView = typeof imageViews.$inferSelect;
export type NewImageView = typeof imageViews.$inferInsert;

export interface ImageWithReactions extends Image {
  reactions?: Reaction[];
  reactionCount?: number;
  reactionCounts?: ReactionCounts;
  userReaction?: ReactionType;
  author?: User;
  viewCount?: number;
}

export interface ReactionCounts {
  like: number;
  heart: number;
  wow: number;
  haha: number;
}

export interface PlanWithImages extends Plan {
  images: Image[];
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface SearchParams extends Location {
  radius?: number; // in meters
  limit?: number;
}


