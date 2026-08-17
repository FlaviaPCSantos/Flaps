import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categories table for organizing products
 */
export const categories = mysqlTable(
  "categories",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    nameIdx: index("categories_name_idx").on(table.name),
  })
);

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Products table for storing Mercado Livre affiliate products
 */
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    curationReason: text("curationReason"),
    price: decimal("price", { precision: 10, scale: 2 }),
    imageUrl: varchar("imageUrl", { length: 1000 }),
    imageNeedsReview: boolean("imageNeedsReview").default(false).notNull(),
    mlId: varchar("mlId", { length: 100 }), // Mercado Livre product ID (optional for affiliate links)
    mlLink: varchar("mlLink", { length: 1000 }), // Original ML link (for data extraction)
    affiliateLink: varchar("affiliateLink", { length: 1000 }).notNull(), // Full affiliate link
    categoryId: int("categoryId"),
    featured: boolean("featured").default(false),
    isMostSold: boolean("isMostSold").default(false),
    active: boolean("active").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    mlIdIdx: index("products_mlId_idx").on(table.mlId),
    featuredIdx: index("products_featured_idx").on(table.featured),
    activeIdx: index("products_active_idx").on(table.active),
    categoryIdIdx: index("products_categoryId_idx").on(table.categoryId),
    titleIdx: index("products_title_idx").on(table.title),
  })
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Relations
 */
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));


/**
 * Mercado Livre OAuth Tokens
 * Armazena tokens de acesso para integração com API do Mercado Livre
 */
export const mlTokens = mysqlTable(
  "ml_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: varchar("userId", { length: 255 }).notNull().unique(),
    accessToken: text("accessToken").notNull(),
    refreshToken: text("refreshToken"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("ml_tokens_userId_idx").on(table.userId),
  })
);

export type MLToken = typeof mlTokens.$inferSelect;
export type InsertMLToken = typeof mlTokens.$inferInsert;


/**
 * Favorites table for storing user favorite products
 */
export const favorites = mysqlTable(
  "favorites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    productId: int("productId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("favorites_userId_idx").on(table.userId),
    productIdIdx: index("favorites_productId_idx").on(table.productId),
    userProductIdx: index("favorites_userId_productId_idx").on(table.userId, table.productId),
  })
);

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;


/**
 * Admin authentication table for email/password login
 */
export const admins = mysqlTable(
  "admins",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    isActive: boolean("isActive").default(true).notNull(),
    lastLoginAt: timestamp("lastLoginAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    emailIdx: index("admins_email_idx").on(table.email),
    isActiveIdx: index("admins_isActive_idx").on(table.isActive),
  })
);

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;


/**
 * Product Ratings table for user reviews
 */
export const ratings = mysqlTable(
  "ratings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    productId: int("productId").notNull(),
    rating: int("rating").notNull(), // 1-5 stars
    comment: text("comment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("ratings_userId_idx").on(table.userId),
    productIdIdx: index("ratings_productId_idx").on(table.productId),
    userProductIdx: index("ratings_userId_productId_idx").on(table.userId, table.productId),
  })
);

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;


/**
 * Wishlist table for storing user product wishlists
 */
export const wishlists = mysqlTable(
  "wishlists",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    productId: int("productId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("wishlists_userId_idx").on(table.userId),
    productIdIdx: index("wishlists_productId_idx").on(table.productId),
    userProductIdx: index("wishlists_userId_productId_idx").on(table.userId, table.productId),
  })
);

export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = typeof wishlists.$inferInsert;


/**
 * Notifications table for user notifications
 */
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }).notNull(), // 'new_product', 'price_drop', 'back_in_stock', etc
    productId: int("productId"), // optional, for product-related notifications
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("notifications_userId_idx").on(table.userId),
    isReadIdx: index("notifications_isRead_idx").on(table.isRead),
    typeIdx: index("notifications_type_idx").on(table.type),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


/**
 * Relations for new tables
 */
export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [ratings.productId],
    references: [products.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [notifications.productId],
    references: [products.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  ratings: many(ratings),
  wishlists: many(wishlists),
  notifications: many(notifications),
  favorites: many(favorites),
}));

export const productsRelations2 = relations(products, ({ many }) => ({
  ratings: many(ratings),
  wishlists: many(wishlists),
  notifications: many(notifications),
  favorites: many(favorites),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [favorites.productId],
    references: [products.id],
  }),
}));
