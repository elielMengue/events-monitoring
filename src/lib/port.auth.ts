

import jwt from "jsonwebtoken";
import type{ JwtService, JwtPayload } from "./adapter.auth";

export class AuthService implements JwtService {
  private readonly secret: string;

  constructor(secret: string) {
    if (!secret) {
      throw new Error("JWT secret is required");
    }
    this.secret = secret;
  }

  async sign(payload: JwtPayload): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        this.secret, 
        (err, token) => {
          if (err || !token) return reject(err || new Error("Token failed"));
          resolve(token);
        }
      );
    });
  }

  async verify(token: string): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, (err, decoded) => {
        if (err || !decoded) return reject(err || new Error("Invalid token"));
        resolve(decoded as JwtPayload);
      });
    });
  }
}
