
import { type EventRepository } from "./repository.events";
import { Event } from "./entity.events";
import { type UserServiceProvider } from "./port.users";
import { User, type UserRole } from "../../users/domain/entity.users";



export class EventService {

    private repository: EventRepository;
    private userService: UserServiceProvider;

    constructor(repository: EventRepository, userService: UserServiceProvider){

        this.repository = repository;
        this.userService = userService;
    }


    private async hasRequiredRole(userId: string, requiredRole: UserRole): Promise<boolean> {

        const user = await this.userService.getUserDetailsForAuth(userId);
        return !!user && user.role === requiredRole;

    }


    private validateEventDates(event: Event): void {

        if (event.properties.startAt >= event.properties.endAt) {
            throw new Error('Event start date must be before end date');

        }

    }



    async createEvent(userId: string,event: Event){

        if (!this.hasRequiredRole(userId, "admin")) {
            throw new Error('Unauthorized');

        }

        this.validateEventDates(event); 
        return this.repository.create(event);

    }


    async findEventById(id: string){
        return this.repository.findById(id);

    }

    async findAllEvents(){

        return this.repository.findAll();

    }



    async updateEvent(userId: string,event: Event, id: string){

        if (!this.hasRequiredRole(userId, "admin")) {
            throw new Error('Unauthorized');

        }

        this.validateEventDates(event); 
        return this.repository.update(event, id);

    }



    async deleteEvent(userId: string, id: string){

        if (!this.hasRequiredRole(userId, "admin")) {
            throw new Error('Unauthorized');

        }else{ 

            return this.repository.delete(id);

        }

    }

}
