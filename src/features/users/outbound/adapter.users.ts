
import { type UserRepository } from "../domain/repository.users";
import { User } from "../domain/entity.users";

export class InMemoryUserRepositoryClass implements UserRepository {
  // Use Maps for O(1) lookups instead of O(n) array searches
  private usersById: Map<string, User> = new Map();
  private usersByEmail: Map<string, User> = new Map();

  // Method to clear all data (useful for testing)
  clear(): void {
    this.usersById.clear();
    this.usersByEmail.clear();
  }

  async create(user: User): Promise<User> {
    // Service layer already validates duplicates, but ensure indexes are consistent
    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersById.get(id) ?? null;
  }

  async findAll(): Promise<User[]> {
    // Return a copy to prevent external modification
    return Array.from(this.usersById.values());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersByEmail.get(email) ?? null;
  }

  async update(user: User, id: string): Promise<User | null> {
    const existing = this.usersById.get(id);
    if (!existing) return null;
    
    // If email changed, update email index
    if (existing.email !== user.email) {
      this.usersByEmail.delete(existing.email);
      if (this.usersByEmail.has(user.email)) {
        throw new Error("User with this email already exists");
      }
      this.usersByEmail.set(user.email, user);
    }
    
    this.usersById.set(id, user);
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const user = this.usersById.get(id);
    if (!user) return false;
    
    // O(1) deletion from both indexes
    this.usersById.delete(id);
    this.usersByEmail.delete(user.email);
    return true;
  }
}

// Singleton instance to share user data across all modules
export const InMemoryUserRepository = new InMemoryUserRepositoryClass();
