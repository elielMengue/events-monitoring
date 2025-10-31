
import { Router, type Request, type Response } from "express";
import { FavoriteService } from "../domain/service.favorite";
import { authMiddleware } from "../../../lib/middleware.auth";
import { AuthService } from "../../../lib/port.auth";

const router = Router();

export function FavoriteController(service: FavoriteService, authService: AuthService): Router {

    router.post('/:eventId', authMiddleware(authService), async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { eventId } = req.params;
        const favorite = await service.addFavorite(userId, eventId as string);
        res.status(201).json(favorite);
    });

    router.get('/', authMiddleware(authService), async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const favorites = await service.getFavoritesByUserId(userId);
        res.json(favorites);
    });

    router.delete('/:favoriteId', authMiddleware(authService), async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { favoriteId } = req.params;
        await service.removeFavorite(userId, favoriteId as string);
        res.sendStatus(204);
    });

    return router;
}
