

export interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface JwtService {
  sign(payload: JwtPayload): Promise<string>;
  verify(token: string): Promise<JwtPayload>;
}
