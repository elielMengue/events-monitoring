import { InMemoryUserRepository } from "./outbound/adapter.users";
import { UserService } from "./domain/service.users";
import { UserController } from "./inbound/controller.users";
import { AuthService } from "../../lib/port.auth";
import { resendAdapter } from "../messaging";
import { DrizzleUserRepository } from "./outbound/users.drizzle";

import dotenv from "dotenv";
dotenv.config();

export function UserRouter() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

 
  const repository = InMemoryUserRepository;
  //const repository = new DrizzleUserRepository();
  const jwtService = new AuthService(secret);
  const service = new UserService(repository, jwtService, resendAdapter);

 
  return UserController(service, jwtService);
}

export default UserRouter;
