import { InMemoryUserRepository } from "./outbound/adapter.users";
import { UserService } from "./domain/service.users";
import { UserController } from "./inbound/controller.users";
import { AuthService } from "../../lib/port.auth";

import dotenv from "dotenv";
dotenv.config();

export function UserRouter() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }


  const repository = new InMemoryUserRepository();
  const jwtService = new AuthService(secret);
  const service = new UserService(repository, jwtService);

 
  return UserController(service);
}

export default UserRouter;
