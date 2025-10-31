
import { Event } from "../../events/domain/entity.events";

export interface EventDetails {
    event_id: string;
    author: string;
}

export interface EventServiceProvider {
    findEventById(id: string): Promise<EventDetails | null>;

}