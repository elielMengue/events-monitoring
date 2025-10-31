
import { Router, type Request, type Response } from "express";
import { UserService } from "../domain/service.users";
import { User } from "../domain/entity.users";
import { z } from "zod";


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

export function UserController(service: UserService) {
  const router = Router();

  router.get("/", async (_req: Request, res: Response) => {
    const users = await service.findAllUsers();
    res.status(200).json(users);
  });

  router.post("/", async (req: Request, res: Response) => {
    const userRequest = req.body;
    const parsed = createUserSchema.safeParse(userRequest);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }
   
    try {
      const user = new User(parsed.data as any);
      const created = await service.createUser(user);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof Error) {
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

 
  router.put("/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = updateSchema.safeParse(req.body);
    if (!user.success) {
      return res.status(400).json({ error: user.error });
    }
    const updatedUser = user.data;
    const existing = await service.findUserById(id as string);
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = await service.updateUser(updatedUser as any, id as string);
    if (!result) return res.status(404).json({ error: "Update failed" });

    return res.status(200).json(result);
  });


  router.delete("/:id", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: " invalid authorization header" });
    }
    const token = authHeader.split(" ")[1];

    try {
      const payload = await service.verifyToken(token as string);
      const requesterId = payload.userId as string;
      const requesterRole = payload.role as string;

      if (!requesterId) return res.status(401).json({ error: "Unauthorized action" });
      if (requesterRole !== "admin") return res.status(403).json({ error: "Forbidden action" });

      const { id } = req.params;
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
