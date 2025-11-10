
import { User } from "./entity.users";
import { type UserRepository } from "./repository.users";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { type AuthService } from "../../../lib/port.auth"; 
import type { EmailSender } from "../../messaging/domain/email.model";


export class UserService {
  private repository: UserRepository;
  private authService: AuthService;
  private readonly saltRounds = 10;
  private emailSender: EmailSender; 
  constructor(repository: UserRepository, authService: AuthService, emailSender: EmailSender) {
    this.repository = repository;
    this.authService = authService;
    this.emailSender = emailSender;
  }

  async createUser(user: User): Promise<User> {
    const existing = await this.repository.findByEmail(user.email);
    if (existing) {
      throw new Error("User already exists");
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(user.password, this.saltRounds);
    
    // Create new User entity with hashed password and required fields
    const userWithHashedPassword = new User({
      user_id: user.id || crypto.randomUUID(),
      email: user.email,
      username: user.username,
      role: user.role,
      password: hashedPassword,
      createdAt: user.createdAt || new Date(),
    });

    const created = await this.repository.create(userWithHashedPassword);
    
    await this.emailSender.sendEmail({
      from: "noreply@notifications.edev-ca.com",
      to: user.email,
      subject: "Welcome on the events App",
      message: "Good Morning, we are writing to you to confirm that your account has been created successfully."
    });
    return created;
   
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

  async updateUser(userData: Partial<User>, id: string): Promise<User | null> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      return null;
    }

    // Hash password if it's being updated
    let hashedPassword = existing.password;
    if (userData.password) {
      hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);
    }

    // Create updated user entity
    const updatedUser = new User({
      user_id: existing.id,
      email: userData.email ?? existing.email,
      username: userData.username ?? existing.username,
      role: userData.role ?? existing.role,
      password: hashedPassword,
      createdAt: existing.createdAt,
    });

    return this.repository.update(updatedUser, id);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
