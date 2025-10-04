import { pgTable, text, timestamp, uuid, real, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Database schema for Checkpoint app
 * Using Drizzle ORM with PostgreSQL + PostGIS extension
 */

// Reaction types are now stored as varchar for flexibility

// Users table (extends Supabase Auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Plans table for travel plans
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  isActive: text('is_active').notNull().default('false'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Images table
export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  planId: uuid('plan_id').references(() => plans.id),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  description: text('description'),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  address: text('address'), // Reverse geocoded address from coordinates
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reactions table
export const reactions = pgTable('reactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  imageId: uuid('image_id').references(() => images.id).notNull(),
  type: text('type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Image views table for tracking views
export const imageViews = pgTable('image_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  imageId: uuid('image_id').references(() => images.id).notNull(),
  userId: uuid('user_id').references(() => users.id), // null for anonymous views
  ipAddress: text('ip_address'), // for anonymous tracking
  userAgent: text('user_agent'), // for analytics
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Comments table for image comments
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  imageId: uuid('image_id').references(() => images.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  images: many(images),
  plans: many(plans),
  reactions: many(reactions),
  imageViews: many(imageViews),
  comments: many(comments),
}));

export const plansRelations = relations(plans, ({ one, many }) => ({
  user: one(users, {
    fields: [plans.userId],
    references: [users.id],
  }),
  images: many(images),
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
  user: one(users, {
    fields: [images.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [images.planId],
    references: [plans.id],
  }),
  reactions: many(reactions),
  views: many(imageViews),
  comments: many(comments),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
  image: one(images, {
    fields: [reactions.imageId],
    references: [images.id],
  }),
}));

export const imageViewsRelations = relations(imageViews, ({ one }) => ({
  user: one(users, {
    fields: [imageViews.userId],
    references: [users.id],
  }),
  image: one(images, {
    fields: [imageViews.imageId],
    references: [images.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  image: one(images, {
    fields: [comments.imageId],
    references: [images.id],
  }),
}));


