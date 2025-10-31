
import { Router } from "express";
import { EventController } from "./inbound/controller.events";
import { EventService } from "./domain/service.events";
import { InMemoEventRepository } from "./outbound/adapter.events";
import { InMemoryUserRepository } from "../users/outbound/adapter.users"; // Assuming this is the user repository
import { AuthService } from "../../lib/port.auth";
import { UserService } from "../users/domain/service.users";
import { UserFeatuerAdapter } from '../events/outbound/adapter.event-user'
import dotenv from "dotenv";
dotenv.config();



export default function EventRouter(authService: AuthService): Router {
    const jwtService = new AuthService(process.env.JWT_SECRET as string);
    const userRepository = new InMemoryUserRepository();
    const userService = new UserService(userRepository, jwtService); 
    const userServiceAdapter = new UserFeatuerAdapter(userService);
    const eventRepository = new InMemoEventRepository();
   
   
    const eventService = new EventService(eventRepository, userServiceAdapter);
    const eventController = EventController(eventService, authService);

    return eventController;
}
