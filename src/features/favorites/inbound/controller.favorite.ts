
import { Router, type Request, type Response } from "express";
import { FavoriteService } from "../domain/service.favorite";
import { authMiddleware } from "../../../lib/middleware.auth";
import { AuthService } from "../../../lib/port.auth";

export function FavoriteController(service: FavoriteService, authService: AuthService): Router {
    const router = Router();

    router.post('/:eventId', authMiddleware(authService), async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const { eventId } = req.params;
            const favorite = await service.addFavorite(userId, eventId as string);
            res.status(201).json(favorite.properties);
        } catch (err) {
            if (err instanceof Error) {
                if (err.message === 'Favorite already exists') {
                    return res.status(409).json({ error: 'Favorite already exists' });
                }
                if (err.message === 'Event not found') {
                    return res.status(404).json({ error: 'Event not found' });
                }
                if (err.message === 'Unauthorized') {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/', authMiddleware(authService), async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const favorites = await service.getFavoritesByUserId(userId);
            res.json(favorites.map(f => f.properties));
        } catch (err) {
            if (err instanceof Error && err.message === 'Unauthorized') {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.delete('/:favoriteId', authMiddleware(authService), async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const { favoriteId } = req.params;
            await service.removeFavorite(userId, favoriteId as string);
            res.sendStatus(204);
        } catch (err) {
            if (err instanceof Error && err.message === 'Unauthorized') {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
}
