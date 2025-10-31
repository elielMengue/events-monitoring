import { Event } from "./entity.events"

export interface EventRepository{
    create(event: Event): Promise<Event>,
    findById(id: string): Promise<Event | undefined>,
    findAll(): Promise<Event[]>,
    update(event: Event, id: string): Promise<Event | null>,
    delete(id: string): void
}