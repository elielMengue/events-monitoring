
import { Event } from "../domain/entity.events";
import { type EventRepository } from "../domain/repository.events";

export class InMemoEventRepository implements EventRepository{
    // Use Map for O(1) lookups instead of O(n) array searches
    private eventsById: Map<string, Event> = new Map();

    // Method to clear all data (useful for testing)
    clear(): void {
        this.eventsById.clear();
    }

    async create(event: Event): Promise<Event> {
        const createdEvent = new Event(event.properties);
        // Check for duplicate event_id
        if (this.eventsById.has(createdEvent.properties.event_id)) {
            throw new Error("Event with this ID already exists");
        }
        this.eventsById.set(createdEvent.properties.event_id, createdEvent);
        return createdEvent;
    }

    async findById(id: string): Promise<Event | undefined> {
        return this.eventsById.get(id);
    }

    async findAll(): Promise<Event[]> {
        // Return a copy to prevent external modification
        return Array.from(this.eventsById.values());
    }

    async update(event: Event, id: string): Promise<Event | null> {
        // Check if event exists
        if (!this.eventsById.has(id)) {
            return null;
        }
        
        // If event_id changed, update the index
        if (event.properties.event_id !== id) {
            this.eventsById.delete(id);
            if (this.eventsById.has(event.properties.event_id)) {
                throw new Error("Event with this ID already exists");
            }
            this.eventsById.set(event.properties.event_id, event);
        } else {
            this.eventsById.set(id, event);
        }
        
        return event;
    }

    delete(id: string): void {
        // O(1) deletion
        this.eventsById.delete(id);
    }
}

// Singleton instance to share event data across all modules
export const InMemoEventRepositorySingleton = new InMemoEventRepository();