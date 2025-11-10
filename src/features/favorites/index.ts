
import { Router } from "express";
import { FavoriteController } from "./inbound/controller.favorite";
import { FavoriteService } from "./domain/service.favorite";
import { InMemoFavoriteRepositorySingleton } from "./outbound/adapter.favorite";
import { EventService } from "../events/domain/service.events";
import { UserService } from "../users/domain/service.users";
import { InMemoEventRepositorySingleton } from "../events/outbound/adapter.events";
import { InMemoryUserRepository } from "../users/outbound/adapter.users";
import { AuthService } from "../../lib/port.auth";
import { UserFeatuerAdapter } from "../events/outbound/adapter.event-user";
import { EventFeatureAdapter } from "./outbound/adapter.favorite-event";
import { resendAdapter } from "../messaging";


export default function loadFavoriteModule(authService: AuthService): Router {

    // Use singleton repositories instead of creating new instances
    const userService = new UserService(InMemoryUserRepository, authService, resendAdapter);
    const userAdapter = new UserFeatuerAdapter(userService)

    const userServiceProvider = userAdapter;

    const eventService = new EventService(InMemoEventRepositorySingleton, userServiceProvider);
    const eventAdapter = new EventFeatureAdapter(eventService);

    const favoriteService = new FavoriteService(InMemoFavoriteRepositorySingleton, eventAdapter, userServiceProvider);
    const favoriteController = FavoriteController(favoriteService, authService);

    return favoriteController;
}
