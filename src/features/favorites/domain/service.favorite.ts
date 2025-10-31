
import { type FavoriteRepository } from "./repository.favorites";
import {  Favorite } from "./entity.favorites";
import { type EventServiceProvider } from "./port.events";
import { type UserServiceProvider } from "./port.users";

export class FavoriteService {
    private repository: FavoriteRepository;
    private eventService: EventServiceProvider;
    private userService: UserServiceProvider;

    constructor(repository: FavoriteRepository, eventService: EventServiceProvider, userService: UserServiceProvider){
        this.repository = repository;
        this.eventService = eventService;
        this.userService = userService;
    }

    async addFavorite(userId: string, eventId: string){
        const user = await this.userService.getUserDetailsForAuth(userId);
        if(!user){
            throw new Error('Unauthorized');
        }

        const event = await this.eventService.findEventById(eventId);
        if(!event){
            throw new Error('Event not found');
        }

        const favorite = new Favorite({
            favorite_id: '', 
            user_id: userId,
            event_id: eventId
        });

        return this.repository.create(favorite);
    }

    async getFavoritesByUserId(userId: string){
        const user = await this.userService.getUserDetailsForAuth(userId);
        if(!user){
            throw new Error('Unauthorized');
        }

        return this.repository.findByUserId(userId);
    }

    async removeFavorite(userId: string, favoriteId: string){
        const user = await this.userService.getUserDetailsForAuth(userId);
        if(!user){
            throw new Error('Unauthorized');
        }

        return this.repository.delete(favoriteId);
    }
}
