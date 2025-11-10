
import { type Favorite } from "./entity.favorites";

export interface FavoriteRepository {
    create(favorite: Favorite): Promise<Favorite>;
    findByUserId(userId: string): Promise<Favorite[]>;
    findByUserAndEvent(userId: string, eventId: string): Promise<Favorite | null>;
    delete(favoriteId: string): Promise<void>;
}
