
import { Router, type Request, type Response } from "express";
import { UserService } from "../domain/service.users";
import { User } from "../domain/entity.users";
import { z } from "zod";
import { authMiddleware } from "../../../lib/middleware.auth";
import { AuthService } from "../../../lib/port.auth";


const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  role: z.enum(["admin", "member"]).default("member"),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const updateSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  role: z.enum(["admin", "member"]).optional(),
  password: z.string().min(8).optional(),
});

export function UserController(service: UserService, authService: AuthService) {
  const router = Router();

  router.get("/", authMiddleware(authService), async (req: Request, res: Response) => {
    try {
      const requesterRole = req.user!.role as string;
      if (requesterRole !== "admin") {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }
      const users = await service.findAllUsers();
      res.status(200).json(users.map(u => u.toJSON()));
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/", async (req: Request, res: Response) => {
    try {
      const userRequest = req.body;
      const parsed = createUserSchema.safeParse(userRequest);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({ error: errorMessages });
      }

      // Validation passed, create user
      // Service will handle hashing, ID generation, and createdAt
      const user = new User({
        user_id: "",
        email: parsed.data.email,
        username: parsed.data.username,
        role: parsed.data.role,
        password: parsed.data.password,
        createdAt: new Date(),
      });
      const created = await service.createUser(user);
      res.status(201).json(created.toJSON());
    } catch (err) {
      if (err instanceof Error) {
        // Check if it's a validation error first
        if (err.message.includes('email') || err.message.includes('password') || err.message.includes('username')) {
          return res.status(400).json({ error: err.message });
        }
        if (err.message === "User already exists") {
          return res.status(409).json({ error: "User already exists" });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

 
  router.post("/login", async (req: Request, res: Response) => {
    const user = loginSchema.safeParse(req.body);
    if (!user.success) {
      return res.status(400).json({ error: user.error });
    }
    const { email, password } = user.data;

    try {
      const token = await service.loginUser(email, password);
      return res.status(200).json({ token });
    } catch (err) {
      if (err instanceof Error) {
        return res.status(401).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

 
  router.put("/:id", authMiddleware(authService), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const requesterId = req.user!.userId as string;
      const requesterRole = req.user!.role as string;

      if (!requesterId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = updateSchema.safeParse(req.body);
      if (!user.success) {
        const errorMessages = user.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({ error: errorMessages });
      }
      const updatedUserData = user.data;
      const existing = await service.findUserById(id as string);
      if (!existing) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check authorization: user can update their own profile, or admin can update any profile
      if (requesterId !== id && requesterRole !== "admin") {
        return res.status(403).json({ error: "Forbidden: You can only update your own profile" });
      }

      // Service handles password hashing and User entity creation
      const result = await service.updateUser(updatedUserData as any, id as string);
      if (!result) return res.status(404).json({ error: "Update failed" });

      return res.status(200).json(result.toJSON());
    } catch (err) {
      if (err instanceof Error) {
        return res.status(401).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });


  router.delete("/:id", authMiddleware(authService), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const requesterId = req.user!.userId as string;
      const requesterRole = req.user!.role as string;

      if (!requesterId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check authorization: user can delete their own account, or admin can delete any account
      if (requesterId !== id && requesterRole !== "admin") {
        return res.status(403).json({ error: "Forbidden: You can only delete your own account" });
      }

      const success = await service.deleteUser(id as string);
      if (!success) return res.status(404).json({ error: "User not found" });

      return res.sendStatus(204);
    } catch (err) {
      if (err instanceof Error) {
        return res.status(401).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
