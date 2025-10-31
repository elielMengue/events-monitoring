
import { User } from "./entity.users";

export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(user: User, id: string): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
