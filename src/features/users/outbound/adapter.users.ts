
import { type UserRepository } from "../domain/repository.users";
import { User } from "../domain/entity.users";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async create(user: User): Promise<User> {
    const created = new User(user.raw); 
    this.users.push(created);
    return created;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.raw.user_id === id) ?? null;
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.raw.email === email) ?? null;
  }

  async update(user: User, id: string): Promise<User | null> {
    const idx = this.users.findIndex((u) => u.raw.user_id === id);
    if (idx === -1) return null;
    this.users[idx] = user;
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const before = this.users.length;
    this.users = this.users.filter((u) => u.raw.user_id !== id);
    return this.users.length < before;
  }
}
