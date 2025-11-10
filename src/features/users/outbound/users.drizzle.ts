
import { type UserRepository } from "../domain/repository.users";
import { User } from "../domain/entity.users";
import db from "@/db/index";
import { users } from "@/db/schemas/users.model";
import { eq } from "drizzle-orm";
import { type UserEntry } from "../domain/entity.users";
import { type UserRole } from "../domain/entity.users";

export class DrizzleUserRepository implements UserRepository {
  /**
   * Helper method to convert database row to User entity
   * Eliminates code duplication and centralizes mapping logic
   */
  private dbRowToUser(row: typeof users.$inferInsert): User {
    return new User({
      user_id: row.id,
      email: row.email,
      username: row.username,
      role: row.role as UserRole,
      password: row.password,
      createdAt: row.createdAt,
    } as UserEntry);
  }

  /**
   * Helper method to convert User entity to database insert/update values
   */
  private userToDbValues(user: User): typeof users.$inferInsert {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      password: user.password,
      createdAt: user.createdAt,
    };
  }

  async create(user: User): Promise<User> {
    try {
      const dbValues = this.userToDbValues(user);
      const [created] = await db
        .insert(users)
        .values(dbValues)
        .returning();
      
      if (!created) {
        throw new Error("Failed to create user");
      }
      
      return this.dbRowToUser(created);
    } catch (error) {
      // Re-throw with more context
      throw new Error(`User creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async update(user: User, id: string): Promise<User | null> {
    try {
      const dbValues = this.userToDbValues(user);
      // Only update fields that are actually provided (exclude id from update)
      const { id: _, ...updateValues } = dbValues;
      
      const [updated] = await db
        .update(users)
        .set(updateValues)
        .where(eq(users.id, id))
        .returning();
      
      return updated ? this.dbRowToUser(updated) : null;
    } catch (error) {
      throw new Error(`User update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Use returning to check if a row was actually deleted
      const deleted = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id });
      
      return deleted.length > 0;
    } catch (error) {
      throw new Error(`User deletion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      
      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      return found ? this.dbRowToUser(found) : null;
    } catch (error) {
      throw new Error(`User lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const found = await db.select().from(users);
      return found.map(row => this.dbRowToUser(row));
    } catch (error) {
      throw new Error(`User retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      // Use limit(1) since email is unique - only one result expected
      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      return found ? this.dbRowToUser(found) : null;
    } catch (error) {
      throw new Error(`User email lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}




