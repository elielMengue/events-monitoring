
import { Favorite } from "../domain/entity.favorites";
import { type FavoriteRepository } from "../domain/repository.favorites";
import { v4 as uuidv4 } from 'uuid';

export class InMemoFavoriteRepository implements FavoriteRepository {
    private adapter: Favorite[] = [];

    async create(favorite: Favorite): Promise<Favorite> {
        const newFavorite = new Favorite({ ...favorite.properties, favorite_id: uuidv4() });
        this.adapter.push(newFavorite);
        return Promise.resolve(newFavorite);
    }

    async findByUserId(userId: string): Promise<Favorite[]> {
        return Promise.resolve(this.adapter.filter(fav => fav.properties.user_id === userId));
    }

    async delete(favoriteId: string): Promise<void> {
        this.adapter = this.adapter.filter(fav => fav.properties.favorite_id !== favoriteId);
        return Promise.resolve();
    }
}
