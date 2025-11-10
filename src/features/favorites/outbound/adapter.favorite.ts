
import { Favorite } from "../domain/entity.favorites";
import { type FavoriteRepository } from "../domain/repository.favorites";
import { v4 as uuidv4 } from 'uuid';

export class InMemoFavoriteRepository implements FavoriteRepository {
    private adapter: Favorite[] = [];

    // Method to clear all data (useful for testing)
    clear(): void {
        this.adapter = [];
    }

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

    async findByUserAndEvent(userId: string, eventId: string): Promise<Favorite | null> {
        const found = this.adapter.find(fav =>
            fav.properties.user_id === userId && fav.properties.event_id === eventId
        );
        return Promise.resolve(found || null);
    }
}

// Singleton instance to share favorite data across all modules
export const InMemoFavoriteRepositorySingleton = new InMemoFavoriteRepository();
