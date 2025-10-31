
import { Router } from "express";
import { FavoriteController } from "./inbound/controller.favorite";
import { FavoriteService } from "./domain/service.favorite";
import { InMemoFavoriteRepository } from "./outbound/adapter.favorite";
import { EventService } from "../events/domain/service.events"; 
import { UserService } from "../users/domain/service.users"; 
import { InMemoEventRepository } from "../events/outbound/adapter.events"; 
import { InMemoryUserRepository } from "../users/outbound/adapter.users"; 
import { AuthService } from "../../lib/port.auth";
import { UserFeatuerAdapter } from "../events/outbound/adapter.event-user";
import { EventFeatureAdapter } from "./outbound/adapter.favorite-event";


export default function loadFavoriteModule(authService: AuthService): Router {
  

    const userServiceRepository = new InMemoryUserRepository(); 
    const userService = new UserService(userServiceRepository, authService); 
    const userAdapter = new UserFeatuerAdapter(userService)
    
    const userServiceProvider = userAdapter;

    const eventRepository = new InMemoEventRepository();
    const eventService = new EventService(eventRepository, userServiceProvider);
    const eventAdapter = new EventFeatureAdapter(eventService);

    
    const favoriteRepository = new InMemoFavoriteRepository();
    const favoriteService = new FavoriteService(favoriteRepository, eventAdapter, userServiceProvider);
    const favoriteController = FavoriteController(favoriteService, authService);

    return favoriteController;
}
