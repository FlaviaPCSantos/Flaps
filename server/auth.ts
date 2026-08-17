import bcrypt from "bcrypt";
import { getDb } from "./db";
import { admins } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new admin user
 */
export async function createAdmin(
  email: string,
  password: string,
  name?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const passwordHash = await hashPassword(password);

  const result = await db.insert(admins).values({
    email,
    passwordHash,
    name,
    isActive: true,
  });

  return result;
}

/**
 * Find admin by email
 */
export async function findAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Authenticate admin with email and password
 */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; admin?: any; error?: string }> {
  try {
    const admin = await findAdminByEmail(email);

    if (!admin) {
      return { success: false, error: "Admin não encontrado" };
    }

    if (!admin.isActive) {
      return { success: false, error: "Admin inativo" };
    }

    const isPasswordValid = await verifyPassword(password, admin.passwordHash);

    if (!isPasswordValid) {
      return { success: false, error: "Senha incorreta" };
    }

    // Update last login time
    const db = await getDb();
    if (db) {
      await db
        .update(admins)
        .set({ lastLoginAt: new Date() })
        .where(eq(admins.id, admin.id));
    }

    return {
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  } catch (error) {
    return { success: false, error: "Erro ao autenticar" };
  }
}

/**
 * Update admin email
 */
export async function updateAdminEmail(
  adminId: number,
  currentPassword: string,
  newEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };

    // Get current admin
    const result = await db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
    const admin = result.length > 0 ? result[0] : null;

    if (!admin) {
      return { success: false, error: "Admin não encontrado" };
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Senha atual incorreta" };
    }

    // Check if new email is already in use
    const existingAdmin = await findAdminByEmail(newEmail);
    if (existingAdmin && existingAdmin.id !== adminId) {
      return { success: false, error: "Este email já está em uso" };
    }

    // Update email
    await db
      .update(admins)
      .set({ email: newEmail, updatedAt: new Date() })
      .where(eq(admins.id, adminId));

    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar email" };
  }
}

/**
 * Update admin password
 */
export async function updateAdminPassword(
  adminId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };

    // Validate new password strength
    if (newPassword.length < 8) {
      return { success: false, error: "Nova senha deve ter pelo menos 8 caracteres" };
    }

    // Get current admin
    const result = await db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
    const admin = result.length > 0 ? result[0] : null;

    if (!admin) {
      return { success: false, error: "Admin não encontrado" };
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Senha atual incorreta" };
    }

    // Check if new password is same as old
    const isSamePassword = await verifyPassword(newPassword, admin.passwordHash);
    if (isSamePassword) {
      return { success: false, error: "Nova senha não pode ser igual à senha atual" };
    }

    // Hash and update password
    const newPasswordHash = await hashPassword(newPassword);
    await db
      .update(admins)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(admins.id, adminId));

    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar senha" };
  }
}
