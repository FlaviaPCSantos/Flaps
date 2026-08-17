import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, categories, favorites, admins, ratings, wishlists, notifications } from "../drizzle/schema";
import { ENV } from './_core/env';
import { sanitizeProductImageUrl } from './productImage';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Product queries
export async function getActiveProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.featured), desc(products.createdAt));
}

export async function getFeaturedProducts(limit: number = 6) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.active, true), eq(products.featured, true))).limit(limit).orderBy(desc(products.createdAt));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductByMlId(mlId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.mlId, mlId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: {
  title: string;
  price: number;
  imageUrl?: string;
  imageNeedsReview?: boolean;
  mlId?: string;
  mlLink?: string;
  affiliateLink: string;
  description?: string;
  curationReason?: string;
  featured?: boolean;
  isMostSold?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const sanitizedImageUrl = sanitizeProductImageUrl(data.imageUrl);
  const imageNeedsReview = data.imageNeedsReview ?? !sanitizedImageUrl;

  const result = await db.insert(products).values({
    title: data.title,
    description: data.description || null,
    curationReason: data.curationReason || null,
    price: data.price ? String(parseFloat(String(data.price)).toFixed(2)) : "0.00",
    imageUrl: sanitizedImageUrl || null,
    imageNeedsReview,
    mlId: data.mlId || undefined,
    mlLink: data.mlLink || null,
    affiliateLink: data.affiliateLink,
    categoryId: undefined,
    featured: data.featured || false,
    isMostSold: data.isMostSold || false,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return result;
}

export async function updateProduct(id: number, data: Partial<{
  title: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
  featured: boolean;
  isMostSold: boolean;
  active: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };
  
  if (data.title !== undefined) updateData.title = data.title;
  if (data.price !== undefined) updateData.price = String(data.price);
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.featured !== undefined) updateData.featured = data.featured;
  if (data.isMostSold !== undefined) updateData.isMostSold = data.isMostSold;
  if (data.active !== undefined) updateData.active = data.active;
  
  await db.update(products).set(updateData).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(products).set({ active: false, updatedAt: new Date() }).where(eq(products.id, id));
}


// Favorites queries
export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, userId));
  
  return result;
}

export async function addFavorite(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.insert(favorites).values({
      userId,
      productId,
      createdAt: new Date(),
    });
  } catch (error: any) {
    // Ignore duplicate key error (product already favorited)
    if (error.code !== "ER_DUP_ENTRY") {
      throw error;
    }
  }
}

export async function removeFavorite(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(favorites).where(
    and(eq(favorites.userId, userId), eq(favorites.productId, productId))
  );
}

export async function isFavorite(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)))
    .limit(1);
  
  return result.length > 0;
}


// ============ RATINGS ============

export async function addRating(userId: number, productId: number, rating: number, comment?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(ratings).values({
    userId,
    productId,
    rating: Math.min(5, Math.max(1, rating)), // Ensure 1-5
    comment: comment || null,
  });
  
  return result;
}

export async function getProductRatings(productId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(ratings).where(eq(ratings.productId, productId)).orderBy(desc(ratings.createdAt));
}

export async function getAverageRating(productId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select().from(ratings).where(eq(ratings.productId, productId));
  if (result.length === 0) return 0;
  
  const sum = result.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / result.length) * 10) / 10; // Round to 1 decimal
}

export async function getUserRating(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.productId, productId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}


// ============ WISHLISTS ============

export async function addToWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already in wishlist
  const existing = await db
    .select()
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0]; // Already exists
  }
  
  const result = await db.insert(wishlists).values({
    userId,
    productId,
  });
  
  return result;
}

export async function removeFromWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(wishlists).where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
}

export async function getUserWishlist(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(wishlists).where(eq(wishlists.userId, userId)).orderBy(desc(wishlists.createdAt));
}

export async function isInWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select()
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
    .limit(1);
  
  return result.length > 0;
}


// ============ NOTIFICATIONS ============

export async function createNotification(userId: number, title: string, message: string, type: string, productId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values({
    userId,
    title,
    message,
    type,
    productId: productId || null,
  });
  
  return result;
}

export async function getUserNotifications(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  
  return result.length;
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}
