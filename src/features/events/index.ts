
import { Router } from "express";
import { EventController } from "./inbound/controller.events";
import { EventService } from "./domain/service.events";
import { InMemoEventRepositorySingleton } from "./outbound/adapter.events";
import { InMemoryUserRepository } from "../users/outbound/adapter.users";
import { AuthService } from "../../lib/port.auth";
import { UserService } from "../users/domain/service.users";
import { UserFeatuerAdapter } from '../events/outbound/adapter.event-user'
import { resendAdapter } from "../messaging";
import dotenv from "dotenv";
dotenv.config();



export default function EventRouter(authService: AuthService): Router {
    // Use the singleton user repository instead of creating new instances
    const userService = new UserService(InMemoryUserRepository, authService, resendAdapter);
    const userServiceAdapter = new UserFeatuerAdapter(userService);

    const eventService = new EventService(InMemoEventRepositorySingleton, userServiceAdapter);
    const eventController = EventController(eventService, authService);

    return eventController;
}
