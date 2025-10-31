
import { type Favorite } from "./entity.favorites";

export interface FavoriteRepository {
    create(favorite: Favorite): Promise<Favorite>;
    findByUserId(userId: string): Promise<Favorite[]>;
    delete(favoriteId: string): Promise<void>;
}
