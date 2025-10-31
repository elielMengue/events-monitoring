
import { type Request, type Response, type NextFunction } from "express";
import { AuthService } from "./port.auth";
import { type JwtPayload } from "./adapter.auth";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export function authMiddleware(authService: AuthService) {
    return async (req: Request, res: Response) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: Missing or invalid token" });
        }

        const token = authHeader.split(" ")[1];

        try {
            const decoded = await authService.verify(token as string);
            req.user = decoded;
    
        } catch (error) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
    };
}
