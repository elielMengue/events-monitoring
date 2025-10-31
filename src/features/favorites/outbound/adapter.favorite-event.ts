import { type EventServiceProvider } from "../domain/port.events";
import { EventService } from "../../events/domain/service.events";
import { type EventDetails } from "../domain/port.events";




export class EventFeatureAdapter implements EventServiceProvider {
    private service: EventService;

    constructor(service: EventService){
        this.service = service;
    }

    async findEventById(eventId: string): Promise<EventDetails | null> {
        const eventEntity = await this.service.findEventById(eventId);
        if (!eventEntity) {
            return null;
        }
        return {
         event_id: eventEntity.properties.event_id,
         author: eventEntity.properties.author,
        };
    }

}