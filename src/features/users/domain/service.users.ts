
import { User } from "./entity.users";
import { type UserRepository } from "./repository.users";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { type AuthService } from "../../../lib/port.auth"; 

export class UserService {
  private repository: UserRepository;
  private authService: AuthService;
  private readonly saltRounds = 10;

  constructor(repository: UserRepository, authService: AuthService) {
    this.repository = repository;
    this.authService = authService;
  }

  async createUser(user: User): Promise<User> {
    const existing = await this.repository.findByEmail(user.email);
    if (existing) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(user.password, this.saltRounds);
    const newUser = new User({
      user_id: crypto.randomUUID(),
      email: user.email,
      username: user.username,
      role: user.role,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return this.repository.create(newUser);
  }

  async loginUser(email: string, password: string): Promise<string> {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const token = await this.authService.sign({
      userId: user.id,
      role: user.role,
    });

    return token;
  }

  async verifyToken(token: string) {
    return this.authService.verify(token);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }

  async findAllUsers(): Promise<User[]> {
    return this.repository.findAll();
  }

  async updateUser(user: User, id: string): Promise<User | null> {
    return this.repository.update(user, id);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
